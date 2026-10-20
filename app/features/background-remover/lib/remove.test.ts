import { describe, expect, it } from 'vitest';
import {
  borderIndices,
  detectBackground,
  edgeAlpha,
  removeBackground,
  toHex,
  type Pixels,
  type RemoveSettings,
  type Rgb,
} from './remove';

type Rgba = [number, number, number, number];

const WHITE: Rgba = [255, 255, 255, 255];
const BLACK: Rgba = [0, 0, 0, 255];
const RED: Rgba = [220, 30, 30, 255];
const CLEAR: Rgba = [0, 0, 0, 0];

/** Builds an image from rows of single-letter pixel codes. */
function image(rows: string[], palette: Record<string, Rgba>): Pixels {
  const height = rows.length;
  const width = rows[0]!.length;
  const data = new Uint8ClampedArray(width * height * 4);
  rows.forEach((row, y) =>
    [...row].forEach((code, x) => {
      data.set(palette[code]!, (y * width + x) * 4);
    }),
  );
  return { data, width, height };
}

function alphaRows(pixels: { data: Uint8ClampedArray }, width: number) {
  const rows: string[] = [];
  let row = '';
  for (let i = 3; i < pixels.data.length; i += 4) {
    row += pixels.data[i] === 0 ? '.' : pixels.data[i] === 255 ? '#' : '~';
    if (row.length === width) {
      rows.push(row);
      row = '';
    }
  }
  return rows;
}

const SHARP: RemoveSettings = {
  mode: 'connected',
  tolerance: 12,
  smoothEdges: false,
};

const P = { w: WHITE, k: BLACK, r: RED, c: CLEAR };

// A ring-shaped "O": the white inside is not connected to the white outside.
const LETTER_O = [
  'wwwwwww',
  'wkkkkkw',
  'wkwwwkw',
  'wkwwwkw',
  'wkkkkkw',
  'wwwwwww',
];

describe('borderIndices', () => {
  it('lists every edge pixel once', () => {
    expect(borderIndices(3, 3).sort((a, b) => a - b)).toEqual([
      0, 1, 2, 3, 5, 6, 7, 8,
    ]);
    expect(borderIndices(1, 1)).toEqual([0]);
  });
});

describe('detectBackground', () => {
  it('finds a white background around a subject', () => {
    const result = detectBackground(image(LETTER_O, P), 12);
    expect(result.color).toEqual([255, 255, 255]);
    expect(result.coverage).toBe(1);
  });

  it('is not limited to white', () => {
    const result = detectBackground(image(['rrrr', 'rkkr', 'rrrr'], P), 12);
    expect(result.color).toEqual([220, 30, 30]);
  });

  it('averages the bucket, so a JPEG-noisy white is not rounded down', () => {
    const noisy: Pixels = image(['abab', 'b..a', 'abab'], {
      a: [254, 254, 254, 255],
      b: [250, 251, 252, 255],
      '.': BLACK,
    });
    const color = detectBackground(noisy, 12).color!;
    for (const channel of color) {
      expect(channel).toBeGreaterThanOrEqual(250);
    }
  });

  it('reports low coverage when the edges are not one colour', () => {
    const result = detectBackground(image(['wwkk', 'wkkr', 'rrkk'], P), 5);
    expect(result.coverage).toBeLessThan(0.5);
  });

  it('returns no colour when the edges are already transparent', () => {
    const result = detectBackground(image(['ccc', 'ckc', 'ccc'], P), 12);
    expect(result.color).toBeNull();
  });
});

describe('removeBackground', () => {
  it('clears the outside and keeps an enclosed hole in connected mode', () => {
    const px = image(LETTER_O, P);
    const result = removeBackground(px, SHARP, [255, 255, 255]);
    expect(alphaRows(result, 7)).toEqual([
      '.......',
      '.#####.',
      '.#####.',
      '.#####.',
      '.#####.',
      '.......',
    ]);
  });

  it('clears the hole as well when it is clicked', () => {
    const px = image(LETTER_O, P);
    const result = removeBackground(
      px,
      SHARP,
      [255, 255, 255],
      [{ x: 3, y: 2 }],
    );
    expect(alphaRows(result, 7)).toEqual([
      '.......',
      '.#####.',
      '.#...#.',
      '.#...#.',
      '.#####.',
      '.......',
    ]);
  });

  it('clears every matching pixel in global mode', () => {
    const px = image(LETTER_O, P);
    const result = removeBackground(
      px,
      { ...SHARP, mode: 'global' },
      [255, 255, 255],
    );
    expect(alphaRows(result, 7)[2]).toBe('.#...#.');
  });

  it('removes a second background colour by clicking it', () => {
    const px = image(['wwrr', 'wkkr', 'wwrr'], P);
    const result = removeBackground(
      px,
      SHARP,
      [255, 255, 255],
      [{ x: 3, y: 0 }],
    );
    expect(alphaRows(result, 4)).toEqual(['....', '.##.', '....']);
  });

  it('respects the tolerance', () => {
    const px = image(['wgw', 'gkg', 'wgw'], {
      ...P,
      g: [225, 225, 225, 255],
    });
    // About 13% of the full RGB distance away from white.
    const tight = removeBackground(
      px,
      { ...SHARP, mode: 'global', tolerance: 5 },
      [255, 255, 255],
    );
    expect(alphaRows(tight, 3)).toEqual(['.#.', '###', '.#.']);
    const loose = removeBackground(
      px,
      { ...SHARP, mode: 'global', tolerance: 15 },
      [255, 255, 255],
    );
    expect(alphaRows(loose, 3)).toEqual(['...', '.#.', '...']);
  });

  it('walks through transparent pixels to reach a halo inside them', () => {
    const px = image(['ccccc', 'cwwwc', 'cwkwc', 'cwwwc', 'ccccc'], P);
    const result = removeBackground(px, SHARP, [255, 255, 255]);
    expect(alphaRows(result, 5)[2]).toBe('..#..');
  });

  it('never touches the source buffer', () => {
    const px = image(LETTER_O, P);
    const before = new Uint8ClampedArray(px.data);
    removeBackground(px, { ...SHARP, smoothEdges: true }, [255, 255, 255]);
    expect(px.data).toEqual(before);
  });

  it('does nothing without a background or clicks', () => {
    const px = image(LETTER_O, P);
    const result = removeBackground(px, SHARP, null);
    expect(result.removed).toBe(0);
    expect(result.data).toEqual(px.data);
  });

  it('ignores clicks outside the image', () => {
    const px = image(LETTER_O, P);
    const result = removeBackground(px, SHARP, null, [{ x: 99, y: -1 }]);
    expect(result.removed).toBe(0);
  });

  it('reports the share of pixels it cleared', () => {
    const px = image(['wwww', 'wkkw', 'wwww'], P);
    expect(removeBackground(px, SHARP, [255, 255, 255]).removed).toBe(10 / 12);
  });

  describe('smooth edges', () => {
    // A black bar with a 50% grey anti-aliased pixel between it and white.
    const EDGE = ['wwwww', 'wgkgw', 'wwwww'];
    const palette = { ...P, g: [128, 128, 128, 255] as Rgba };

    it('turns a blended edge into half-transparent black', () => {
      const px = image(EDGE, palette);
      const result = removeBackground(
        px,
        { ...SHARP, smoothEdges: true },
        [255, 255, 255],
      );
      const o = (1 * 5 + 1) * 4;
      expect([...result.data.slice(o, o + 4)]).toEqual([0, 0, 0, 127]);
    });

    it('leaves edges hard when switched off', () => {
      const px = image(EDGE, palette);
      const result = removeBackground(px, SHARP, [255, 255, 255]);
      expect(alphaRows(result, 5)[1]).toBe('.###.');
    });

    it('keeps the source transparency on top', () => {
      const px = image(EDGE, { ...palette, k: [0, 0, 0, 100] });
      const result = removeBackground(
        px,
        { ...SHARP, smoothEdges: true },
        [255, 255, 255],
      );
      expect(result.data[(1 * 5 + 2) * 4 + 3]).toBe(100);
    });

    it('does not shave the hard edge of a pale subject', () => {
      const pale: Rgba = [255, 230, 230, 255];
      const px = image(['wwwww', 'wpppw', 'wpppw', 'wpppw', 'wwwww'], {
        ...P,
        p: pale,
      });
      const result = removeBackground(
        px,
        { ...SHARP, tolerance: 3, smoothEdges: true },
        [255, 255, 255],
      );
      expect(alphaRows(result, 5)).toEqual([
        '.....',
        '.###.',
        '.###.',
        '.###.',
        '.....',
      ]);
    });
  });
});

describe('edgeAlpha', () => {
  const out: [number, number, number] = [0, 0, 0];

  it('recovers the foreground from a blend over white', () => {
    // 25% red over white.
    const alpha = edgeAlpha([255, 191, 191], [255, 255, 255], [255, 0, 0], out);
    expect(alpha).toBeCloseTo(0.251, 2);
    expect(out).toEqual([255, 0, 0]);
  });

  it('works over a dark background', () => {
    const alpha = edgeAlpha([128, 128, 160], [0, 0, 64], [255, 255, 255], out);
    expect(alpha).toBeCloseTo(0.5, 2);
    expect(out[0]).toBe(255);
  });

  it('keeps a pale foreground opaque', () => {
    const pale: Rgb = [255, 230, 230];
    expect(edgeAlpha(pale, [255, 255, 255], pale, out)).toBe(1);
    expect(out).toEqual([255, 230, 230]);
  });

  it('is fully transparent for the background itself', () => {
    expect(edgeAlpha([10, 20, 30], [10, 20, 30], [10, 20, 30], out)).toBe(0);
  });
});

describe('toHex', () => {
  it('formats a colour for display', () => {
    expect(toHex([255, 8, 0])).toBe('#ff0800');
  });
});
