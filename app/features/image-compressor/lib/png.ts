// Writes palette PNGs, which is the file format the browser cannot produce.
//
// `canvas.convertToBlob({ type: 'image/png' })` always writes 8-bit RGBA with
// no palette and no filter selection, so re-encoding an optimised PNG through
// it routinely produces a larger file than the original — measured at 192% on
// this site's own OGP images. A palette PNG stores one byte per pixel plus a
// colour table, which is where the actual saving comes from.
//
// Only the chunks needed for that are implemented: IHDR, PLTE, optional tRNS,
// IDAT, IEND. Nothing here reads PNGs.

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** Standard PNG CRC-32, table built once on first use. */
let crcTable: Uint32Array | null = null

function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n += 1) {
      let c = n
      for (let k = 0; k < 8; k += 1) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      }
      crcTable[n] = c >>> 0
    }
  }
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) {
    crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  for (let i = 0; i < 4; i += 1) {
    out[4 + i] = type.charCodeAt(i)
  }
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  // 'deflate' is zlib-wrapped (RFC 1950), which is exactly what IDAT holds —
  // 'deflate-raw' would produce a file no decoder accepts.
  const stream = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new CompressionStream('deflate'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export type Palette = {
  /** Up to 256 entries, red/green/blue/alpha per entry. */
  colors: Uint8Array
  count: number
}

/**
 * Encodes indexed pixels as a PNG.
 *
 * Scanlines use filter 0 (None). Filtering helps continuous-tone images by
 * making neighbouring bytes similar, but palette indices are labels rather than
 * quantities — the difference between index 7 and index 9 means nothing — so
 * filtering them tends to enlarge the file rather than shrink it.
 */
export async function encodeIndexedPng(
  indices: Uint8Array,
  palette: Palette,
  width: number,
  height: number,
): Promise<Uint8Array> {
  const ihdr = new Uint8Array(13)
  const view = new DataView(ihdr.buffer)
  view.setUint32(0, width)
  view.setUint32(4, height)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 3 // colour type 3: indexed
  // 10..12 stay zero: deflate compression, adaptive filtering, no interlacing.

  const plte = new Uint8Array(palette.count * 3)
  for (let i = 0; i < palette.count; i += 1) {
    plte[i * 3] = palette.colors[i * 4]
    plte[i * 3 + 1] = palette.colors[i * 4 + 1]
    plte[i * 3 + 2] = palette.colors[i * 4 + 2]
  }

  // tRNS lists alpha for the leading palette entries, so it is only worth
  // writing up to the last entry that is not fully opaque.
  let lastTransparent = -1
  for (let i = 0; i < palette.count; i += 1) {
    if (palette.colors[i * 4 + 3] !== 255) {
      lastTransparent = i
    }
  }
  const trns =
    lastTransparent >= 0
      ? Uint8Array.from(
          { length: lastTransparent + 1 },
          (_, i) => palette.colors[i * 4 + 3],
        )
      : null

  const raw = new Uint8Array(height * (width + 1))
  for (let y = 0; y < height; y += 1) {
    raw[y * (width + 1)] = 0 // filter: None
    raw.set(indices.subarray(y * width, (y + 1) * width), y * (width + 1) + 1)
  }

  const parts = [
    Uint8Array.from(SIGNATURE),
    chunk('IHDR', ihdr),
    chunk('PLTE', plte),
    ...(trns ? [chunk('tRNS', trns)] : []),
    chunk('IDAT', await deflate(raw)),
    chunk('IEND', new Uint8Array()),
  ]

  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}
