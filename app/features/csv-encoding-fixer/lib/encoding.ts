// Reading a CSV that opens as garbage is a decoding problem, not a CSV
// problem: the bytes are fine, something read them with the wrong table. So
// nothing here parses commas, quotes or newlines — the file is treated as
// bytes throughout, which is also why a fix cannot corrupt the data.

export type DetectedEncoding =
  'utf-8' | 'utf-16le' | 'utf-16be' | 'shift_jis' | 'euc-jp'

export const UTF8_BOM = [0xef, 0xbb, 0xbf] as const

export type Diagnosis = {
  encoding: DetectedEncoding
  hasBom: boolean
  /**
   * The bytes are already UTF-8 and only the marker is missing. This is the
   * common case behind "fine in Google Sheets, garbage in Excel", and the one
   * where the fix adds three bytes and changes nothing else.
   */
  bomOnly: boolean
  /**
   * Replacement characters survived the decode, so parts of the text were
   * already destroyed before the file arrived. Re-encoding cannot bring them
   * back, and saying so is more useful than handing back a cleaner-looking
   * file with the same holes in it.
   */
  damaged: boolean
  preview: string
}

function startsWith(bytes: Uint8Array, prefix: readonly number[]): boolean {
  return (
    bytes.length >= prefix.length &&
    prefix.every((byte, index) => bytes[index] === byte)
  )
}

export function hasUtf8Bom(bytes: Uint8Array): boolean {
  return startsWith(bytes, UTF8_BOM)
}

/**
 * Whether the bytes are valid UTF-8. This is the whole detector for the modern
 * case: UTF-8's multi-byte sequences are structured enough that text in another
 * Japanese encoding almost never satisfies them by accident.
 */
export function isValidUtf8(bytes: Uint8Array): boolean {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return true
  } catch {
    return false
  }
}

function countReplacements(text: string): number {
  let count = 0
  for (const char of text) {
    if (char === '�') {
      count += 1
    }
  }
  return count
}

/**
 * Half-width katakana. Counting replacement characters alone cannot separate
 * the two legacy encodings, because EUC-JP bytes are all in Shift_JIS's
 * half-width katakana range: EUC-JP text read as Shift_JIS produces no
 * replacements at all, just a line of ｱｲｳ. Real Japanese CSVs are written in
 * full-width, so a decode that yields mostly half-width katakana has almost
 * certainly read the file wrong.
 */
function countHalfWidthKatakana(text: string): number {
  let count = 0
  for (const char of text) {
    const code = char.codePointAt(0)!
    if (code >= 0xff61 && code <= 0xff9f) {
      count += 1
    }
  }
  return count
}

/** Lower is better. Unrepresentable bytes are the stronger signal of the two. */
function misreadScore(text: string): number {
  return countReplacements(text) * 10 + countHalfWidthKatakana(text)
}

function chooseLegacy(bytes: Uint8Array): DetectedEncoding {
  const sjis = misreadScore(new TextDecoder('shift_jis').decode(bytes))
  const euc = misreadScore(new TextDecoder('euc-jp').decode(bytes))
  // Shift_JIS on a tie: it is what Japanese business systems export.
  return euc < sjis ? 'euc-jp' : 'shift_jis'
}

export function detectEncoding(bytes: Uint8Array): DetectedEncoding {
  if (startsWith(bytes, [0xff, 0xfe])) {
    return 'utf-16le'
  }
  if (startsWith(bytes, [0xfe, 0xff])) {
    return 'utf-16be'
  }
  if (isValidUtf8(bytes)) {
    return 'utf-8'
  }
  return chooseLegacy(bytes)
}

export function decodeText(
  bytes: Uint8Array,
  encoding: DetectedEncoding,
): string {
  // TextDecoder drops a leading BOM itself for both UTF-8 and UTF-16.
  return new TextDecoder(encoding).decode(bytes)
}

export function analyze(bytes: Uint8Array, previewChars = 400): Diagnosis {
  const encoding = detectEncoding(bytes)
  const hasBom = encoding === 'utf-8' && hasUtf8Bom(bytes)
  const text = decodeText(bytes, encoding)
  return {
    encoding,
    hasBom,
    bomOnly: encoding === 'utf-8' && !hasBom,
    damaged: countReplacements(text) > 0,
    preview: text.slice(0, previewChars),
  }
}

/**
 * Produces the bytes to save: UTF-8 with the marker Excel needs before it will
 * stop assuming the system's own code page.
 *
 * A file that is already UTF-8 keeps its exact bytes and only gains the marker.
 * Round-tripping it through decode and encode would produce the same result in
 * almost every case, and "almost" is not a promise worth making about someone's
 * data — a lone surrogate or an unusual normalisation would come back changed.
 */
export function toUtf8WithBom(bytes: Uint8Array): Uint8Array {
  const encoding = detectEncoding(bytes)
  const body =
    encoding === 'utf-8'
      ? hasUtf8Bom(bytes)
        ? bytes.subarray(UTF8_BOM.length)
        : bytes
      : new TextEncoder().encode(decodeText(bytes, encoding))

  const out = new Uint8Array(UTF8_BOM.length + body.length)
  out.set(UTF8_BOM, 0)
  out.set(body, UTF8_BOM.length)
  return out
}

/**
 * Whether Excel is likely to fail on this file for reasons that have nothing to
 * do with encoding.
 *
 * Measured on a Webflow content export that hung Excel after being fixed: 4.6 MB
 * across 703 rows, one column holding whole HTML article bodies, longest line
 * 53 KB. Cutting it to 50 rows opened fine, and so did all 703 rows with that
 * one column removed — so neither row count nor long cells alone is the
 * problem. Both together are.
 *
 * Hence the AND: an ordinary large CSV of numbers opens without complaint, and
 * warning about it would be noise. The line length is measured between newline
 * bytes rather than by parsing fields, which keeps the promise that this tool
 * never interprets CSV structure.
 */
export const EXCEL_RISK = {
  bytes: 2 * 1024 * 1024,
  lineBytes: 8 * 1024,
} as const

export type ExcelRisk = {
  heavy: boolean
  sizeBytes: number
  longestLineBytes: number
}

export function excelRisk(bytes: Uint8Array): ExcelRisk {
  let longest = 0
  let start = 0
  for (let i = 0; i < bytes.length; i += 1) {
    if (bytes[i] === 0x0a) {
      if (i - start > longest) {
        longest = i - start
      }
      start = i + 1
    }
  }
  if (bytes.length - start > longest) {
    longest = bytes.length - start
  }
  return {
    heavy: bytes.length > EXCEL_RISK.bytes && longest > EXCEL_RISK.lineBytes,
    sizeBytes: bytes.length,
    longestLineBytes: longest,
  }
}
