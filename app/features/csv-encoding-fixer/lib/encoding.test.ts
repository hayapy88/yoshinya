import { describe, expect, it } from 'vitest';
import {
  analyze,
  excelRisk,
  decodeText,
  detectEncoding,
  isValidUtf8,
  toUtf8WithBom,
  UTF8_BOM,
} from './encoding';

const utf8 = (text: string) => new TextEncoder().encode(text);
const withBom = (text: string) =>
  Uint8Array.from([...UTF8_BOM, ...new TextEncoder().encode(text)]);

/**
 * Byte sequences written out rather than produced by an encoder: the browser
 * can only encode UTF-8, and these are the exact bytes a Japanese business
 * system would export.
 */
// 「名前,住所」in Shift_JIS. Lead bytes sit in 0x81-0x9F, which UTF-8 rejects.
const SJIS_HEADER = Uint8Array.from([
  0x96, 0xbc, 0x91, 0x4f, 0x2c, 0x8f, 0x5a, 0x8f, 0x8a,
]);
// 「あいう」in EUC-JP: every byte is >= 0xA1, so Shift_JIS reads it as katakana.
const EUC_TEXT = Uint8Array.from([0xa4, 0xa2, 0xa4, 0xa4, 0xa4, 0xa6]);

describe('isValidUtf8', () => {
  it('accepts multi-byte UTF-8', () => {
    expect(isValidUtf8(utf8('名前,住所'))).toBe(true);
  });

  it('rejects Shift_JIS, whose lead bytes are not valid UTF-8', () => {
    expect(isValidUtf8(SJIS_HEADER)).toBe(false);
  });

  it('accepts an empty file rather than calling it broken', () => {
    expect(isValidUtf8(new Uint8Array())).toBe(true);
  });
});

describe('detectEncoding', () => {
  it('recognises UTF-8 with and without the marker', () => {
    expect(detectEncoding(utf8('名前'))).toBe('utf-8');
    expect(detectEncoding(withBom('名前'))).toBe('utf-8');
  });

  it('recognises Shift_JIS', () => {
    expect(detectEncoding(SJIS_HEADER)).toBe('shift_jis');
  });

  // The case a replacement-character count gets wrong: Shift_JIS decodes these
  // bytes to half-width katakana without complaint, so the naive score ties and
  // picks the wrong one.
  it('recognises EUC-JP even though Shift_JIS decodes it without error', () => {
    expect(new TextDecoder('shift_jis').decode(EUC_TEXT)).not.toContain('�');
    expect(detectEncoding(EUC_TEXT)).toBe('euc-jp');
  });

  it('reads the UTF-16 markers', () => {
    expect(detectEncoding(Uint8Array.from([0xff, 0xfe, 0x42, 0x00]))).toBe(
      'utf-16le',
    );
    expect(detectEncoding(Uint8Array.from([0xfe, 0xff, 0x00, 0x42]))).toBe(
      'utf-16be',
    );
  });

  it('treats plain ASCII as UTF-8', () => {
    expect(detectEncoding(utf8('id,name\n1,a\n'))).toBe('utf-8');
  });
});

describe('decodeText', () => {
  it('recovers Japanese from Shift_JIS', () => {
    expect(decodeText(SJIS_HEADER, 'shift_jis')).toBe('名前,住所');
  });

  it('recovers Japanese from EUC-JP', () => {
    expect(decodeText(EUC_TEXT, 'euc-jp')).toBe('あいう');
  });

  it('drops the marker instead of leaving it in the text', () => {
    expect(decodeText(withBom('名前'), 'utf-8')).toBe('名前');
  });
});

describe('analyze', () => {
  // The reported symptom: right in Google Sheets, garbage in Excel. The file is
  // not broken; only the marker Excel looks for is missing.
  it('reports a UTF-8 file with no marker as needing only the marker', () => {
    const result = analyze(utf8('名前,住所\n山田,東京\n'));
    expect(result.encoding).toBe('utf-8');
    expect(result.hasBom).toBe(false);
    expect(result.bomOnly).toBe(true);
    expect(result.damaged).toBe(false);
  });

  it('does not claim a file with the marker needs one', () => {
    const result = analyze(withBom('名前'));
    expect(result.hasBom).toBe(true);
    expect(result.bomOnly).toBe(false);
  });

  it('reports a Shift_JIS file as needing conversion, not just a marker', () => {
    const result = analyze(SJIS_HEADER);
    expect(result.encoding).toBe('shift_jis');
    expect(result.bomOnly).toBe(false);
    expect(result.preview).toBe('名前,住所');
  });

  // Bytes that survive no decoder were destroyed before they arrived. Saying so
  // beats handing back a tidier file with the same holes.
  it('flags text that no longer decodes cleanly', () => {
    const damaged = Uint8Array.from([0x96, 0xbc, 0xf0, 0x28, 0x8c, 0xbc]);
    expect(analyze(damaged).damaged).toBe(true);
  });

  it('keeps the preview short', () => {
    expect(analyze(utf8('あ'.repeat(1000)), 50).preview).toHaveLength(50);
  });
});

describe('toUtf8WithBom', () => {
  it('adds the marker to a UTF-8 file and changes nothing else', () => {
    const original = utf8('名前,住所\n山田,東京\n');
    const fixed = toUtf8WithBom(original);
    expect([...fixed.subarray(0, 3)]).toEqual([...UTF8_BOM]);
    // Byte for byte: the promise is that the data is untouched.
    expect([...fixed.subarray(3)]).toEqual([...original]);
  });

  it('does not add a second marker to a file that has one', () => {
    const fixed = toUtf8WithBom(withBom('名前'));
    expect([...fixed.subarray(0, 3)]).toEqual([...UTF8_BOM]);
    expect([...fixed.subarray(3, 6)]).not.toEqual([...UTF8_BOM]);
    expect(new TextDecoder().decode(fixed)).toBe('名前');
  });

  it('converts Shift_JIS to UTF-8 and marks it', () => {
    const fixed = toUtf8WithBom(SJIS_HEADER);
    expect([...fixed.subarray(0, 3)]).toEqual([...UTF8_BOM]);
    expect(new TextDecoder().decode(fixed)).toBe('名前,住所');
  });

  it('converts EUC-JP too', () => {
    expect(new TextDecoder().decode(toUtf8WithBom(EUC_TEXT))).toBe('あいう');
  });

  it('leaves an empty file as just the marker', () => {
    expect([...toUtf8WithBom(new Uint8Array())]).toEqual([...UTF8_BOM]);
  });
});

describe('excelRisk', () => {
  const build = (sizeBytes: number, lineBytes: number) => {
    const out = new Uint8Array(sizeBytes).fill(0x61);
    for (let i = lineBytes; i < sizeBytes; i += lineBytes + 1) {
      out[i] = 0x0a;
    }
    return out;
  };

  // The reported file: 4.6 MB with a 53 KB line. Fixing the encoding was
  // correct and still left Excel unable to open it.
  it('flags a large file made of long lines', () => {
    const risk = excelRisk(build(4_600_000, 53_000));
    expect(risk.heavy).toBe(true);
    expect(risk.longestLineBytes).toBe(53_000);
  });

  // Both of these opened fine when the reporter tested them, so neither may
  // raise the warning.
  it('does not flag long lines in a small file', () => {
    expect(excelRisk(build(350_000, 53_000)).heavy).toBe(false);
  });

  it('does not flag a large file of ordinary short rows', () => {
    expect(excelRisk(build(4_600_000, 200)).heavy).toBe(false);
  });

  it('measures the last line when the file does not end in a newline', () => {
    const bytes = new Uint8Array(3_000_000).fill(0x61);
    bytes[10] = 0x0a;
    expect(excelRisk(bytes).longestLineBytes).toBe(3_000_000 - 11);
  });

  it('reports a size for an empty file without dividing by anything', () => {
    expect(excelRisk(new Uint8Array())).toEqual({
      heavy: false,
      sizeBytes: 0,
      longestLineBytes: 0,
    });
  });
});
