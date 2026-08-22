import { describe, expect, it } from 'vitest';
import { encodeIndexedPng } from './png';
import { buildPalette, quantize } from './quantize';

/** Builds RGBA pixel data from a list of [r,g,b,a] tuples. */
const px = (...colors: [number, number, number, number][]) =>
  new Uint8ClampedArray(colors.flat());

describe('buildPalette', () => {
  // Reducing an image that already fits is not an approximation, and treating
  // it as one would degrade logos and screenshots for no saving at all.
  it('keeps every colour when the image has fewer than the budget', () => {
    const palette = buildPalette(
      px([255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255]),
      256,
    );
    expect(palette.count).toBe(3);
    expect([...palette.colors.subarray(0, 4)]).toEqual([255, 0, 0, 255]);
  });

  it('reduces to the requested number of colours', () => {
    const pixels = new Uint8ClampedArray(64 * 4);
    for (let i = 0; i < 64; i += 1) {
      pixels.set([i * 4, 255 - i * 4, 128, 255], i * 4);
    }
    expect(buildPalette(pixels, 4).count).toBe(4);
  });

  it('folds every fully transparent pixel into one entry', () => {
    const palette = buildPalette(
      px([255, 0, 0, 0], [0, 255, 0, 0], [1, 2, 3, 255]),
      256,
    );
    expect(palette.count).toBe(2);
  });

  // A box holding one stray pixel and a large flat area must land on the flat
  // area, or a single outlier drags a whole region off colour.
  it('weights a palette entry towards the colour that occurs most', () => {
    const many: [number, number, number, number][] = Array.from(
      { length: 99 },
      () => [10, 10, 10, 255],
    );
    const palette = buildPalette(px(...many, [250, 250, 250, 255]), 1);
    expect(palette.colors[0]).toBeLessThan(20);
  });
});

describe('quantize', () => {
  it('returns one index per pixel', () => {
    const result = quantize(
      px([255, 0, 0, 255], [0, 0, 255, 255]),
      2,
      1,
      2,
      false,
    );
    expect(result.indices).toHaveLength(2);
    expect(result.palette.count).toBe(2);
  });

  it('maps each pixel to its own colour when the palette is exact', () => {
    const result = quantize(
      px([255, 0, 0, 255], [0, 0, 255, 255]),
      2,
      1,
      2,
      false,
    );
    const [a, b] = result.indices;
    expect(a).not.toBe(b);
    expect(result.palette.colors[a * 4]).toBe(255);
    expect(result.palette.colors[b * 4 + 2]).toBe(255);
  });

  it('keeps transparency rather than turning it opaque', () => {
    const result = quantize(
      px([255, 0, 0, 0], [255, 0, 0, 255]),
      2,
      1,
      2,
      false,
    );
    const alphas = [...result.indices].map(
      (i) => result.palette.colors[i * 4 + 3],
    );
    expect(alphas).toContain(0);
    expect(alphas).toContain(255);
  });

  // Dithering must reach for more than one palette entry across a gradient;
  // that spread is the whole reason it exists.
  it('dithering uses more of the palette across a gradient than not dithering', () => {
    const width = 32;
    const pixels = new Uint8ClampedArray(width * 4);
    for (let i = 0; i < width; i += 1) {
      pixels.set([i * 8, i * 8, i * 8, 255], i * 4);
    }
    const plain = quantize(pixels, width, 1, 2, false);
    const dithered = quantize(pixels, width, 1, 2, true);
    const runs = (indices: Uint8Array) =>
      indices.reduce(
        (n, v, i) => (i > 0 && v !== indices[i - 1] ? n + 1 : n),
        0,
      );
    expect(runs(dithered.indices)).toBeGreaterThan(runs(plain.indices));
  });

  it('does not crash on a single pixel', () => {
    const result = quantize(px([1, 2, 3, 255]), 1, 1, 16, true);
    expect(result.indices).toHaveLength(1);
  });
});

describe('encodeIndexedPng', () => {
  const header = async (
    indices: Uint8Array,
    palette: Parameters<typeof encodeIndexedPng>[1],
    w: number,
    h: number,
  ) => encodeIndexedPng(indices, palette, w, h);

  it('writes a PNG signature and an indexed header', async () => {
    const palette = { colors: Uint8Array.from([255, 0, 0, 255]), count: 1 };
    const png = await header(new Uint8Array([0]), palette, 1, 1);
    expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    // IHDR payload starts at 16; bit depth then colour type 3 (indexed).
    expect(png[24]).toBe(8);
    expect(png[25]).toBe(3);
  });

  it('includes a palette and ends with IEND', async () => {
    const palette = { colors: Uint8Array.from([1, 2, 3, 255]), count: 1 };
    const png = await header(new Uint8Array([0]), palette, 1, 1);
    const text = new TextDecoder('latin1').decode(png);
    expect(text).toContain('PLTE');
    expect(text).toContain('IDAT');
    // Compared as bytes: IEND's CRC is fixed, and decoding it as text turns
    // 0xAE into a character rather than the byte the file has to end with.
    expect([...png.subarray(-8)]).toEqual([
      0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
  });

  // tRNS is only written when something is actually transparent; an opaque
  // image carrying a transparency chunk is wasted bytes in every file.
  it('omits the transparency chunk for a fully opaque image', async () => {
    const palette = { colors: Uint8Array.from([1, 2, 3, 255]), count: 1 };
    const png = await header(new Uint8Array([0]), palette, 1, 1);
    expect(new TextDecoder('latin1').decode(png)).not.toContain('tRNS');
  });

  it('writes a transparency chunk when an entry is not opaque', async () => {
    const palette = {
      colors: Uint8Array.from([1, 2, 3, 0, 4, 5, 6, 255]),
      count: 2,
    };
    const png = await header(new Uint8Array([0, 1]), palette, 2, 1);
    expect(new TextDecoder('latin1').decode(png)).toContain('tRNS');
  });
});
