import { describe, expect, it } from 'vitest';
import {
  buildMatrix,
  drawMatrix,
  exportSize,
  QrCapacityError,
  renderSvg,
  type QrMatrix,
} from './qr';

describe('buildMatrix', () => {
  it('encodes Japanese as UTF-8, not as the library default', () => {
    // 'こんにちは' is 15 bytes in UTF-8 and needs version 2 (25 modules). The
    // library's default byte encoder would make it 5 bytes and fit version 1
    // (21 modules) — a code that scans and shows the wrong characters. The
    // module count is therefore the cheapest proof the swap is in effect.
    expect(buildMatrix('こんにちは', 'M').count).toBe(25);
  });

  it('grows with the error-correction level, because redundancy costs space', () => {
    const url = 'https://yoshinya.com/ja/qr-code-generator';
    expect(buildMatrix(url, 'M').count).toBe(29);
    expect(buildMatrix(url, 'H').count).toBe(37);
  });

  it('returns a square matrix of that size', () => {
    const matrix = buildMatrix('yoshinya', 'M');
    expect(matrix.dark).toHaveLength(matrix.count);
    for (const row of matrix.dark) {
      expect(row).toHaveLength(matrix.count);
    }
  });

  it('always sets the top-left finder pattern', () => {
    const matrix = buildMatrix('yoshinya', 'M');
    expect(matrix.dark[0][0]).toBe(true);
    expect(matrix.dark[0][6]).toBe(true);
    expect(matrix.dark[1][1]).toBe(false);
  });

  it('reports over-capacity input as QrCapacityError', () => {
    // The library throws a value without a message for this; the wrapper is
    // what turns it into something the UI can explain.
    expect(() => buildMatrix('x'.repeat(5000), 'H')).toThrow(QrCapacityError);
  });
});

describe('exportSize', () => {
  const matrix = { count: 25, dark: [] } as unknown as QrMatrix;

  it('rounds down to a whole number of pixels per module', () => {
    // 25 modules + 4 margin each side = 33 across. 512 / 33 = 15.5…
    expect(exportSize(matrix, 4, 512)).toEqual({ scale: 15, size: 495 });
  });

  it('is exact when the request divides evenly', () => {
    expect(exportSize(matrix, 4, 330)).toEqual({ scale: 10, size: 330 });
  });

  it('never drops below one pixel per module, however small the request', () => {
    expect(exportSize(matrix, 4, 10)).toEqual({ scale: 1, size: 33 });
  });

  it('counts the margin on both sides', () => {
    expect(exportSize(matrix, 0, 250).size).toBe(250);
  });
});

describe('renderSvg', () => {
  // A 2x2 matrix is small enough to read the path by eye.
  const matrix: QrMatrix = {
    count: 2,
    dark: [
      [true, true],
      [false, true],
    ],
  };

  it('sizes the viewBox to include the quiet zone', () => {
    expect(renderSvg(matrix, { margin: 4 })).toContain('viewBox="0 0 10 10"');
    expect(renderSvg(matrix, { margin: 0 })).toContain('viewBox="0 0 2 2"');
  });

  it('merges neighbouring modules into one horizontal run', () => {
    const svg = renderSvg(matrix, { margin: 0 });
    // The first row is two dark modules: one segment two units wide, not two.
    expect(svg).toContain('M0 0h2v1h-2z');
    expect(svg).toContain('M1 1h1v1h-1z');
  });

  it('paints a background, so a transparent PNG never becomes unreadable', () => {
    expect(renderSvg(matrix, { margin: 1 })).toContain(
      '<rect width="4" height="4" fill="#ffffff"/>',
    );
  });

  it('honours the colours it is given', () => {
    const svg = renderSvg(matrix, { margin: 0, dark: '#162e64', light: '#fdf2d0' });
    expect(svg).toContain('fill="#162e64"');
    expect(svg).toContain('fill="#fdf2d0"');
  });
});

describe('drawMatrix', () => {
  it('fills the background first, then one rect per dark module', () => {
    const calls: string[] = [];
    const context = {
      set fillStyle(value: string) {
        calls.push(`style:${value}`);
      },
      fillRect(x: number, y: number, w: number, h: number) {
        calls.push(`rect:${x},${y},${w},${h}`);
      },
    } as unknown as CanvasRenderingContext2D;

    drawMatrix(
      context,
      { count: 1, dark: [[true]] },
      10,
      1,
    );

    expect(calls).toEqual([
      'style:#ffffff',
      'rect:0,0,30,30',
      'style:#000000',
      'rect:10,10,10,10',
    ]);
  });
});
