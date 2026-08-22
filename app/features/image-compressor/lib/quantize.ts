import type { Palette } from './png'

// Reduces an image to a small palette, which is what "compressing a PNG"
// actually means. PNG's own compression is lossless and already applied; the
// saving comes from having fewer distinct colours to store and from spending
// one byte per pixel instead of four.
//
// This is therefore a lossy operation, and the tool says so. It suits
// illustrations, logos, screenshots and diagrams — images built from flat
// areas. Photographs band visibly, which is why dithering exists and why the
// before/after comparison matters more here than anywhere else in the tool.

type Box = {
  /** Indices into the colour list this box covers. */
  from: number
  to: number
  rMin: number
  rMax: number
  gMin: number
  gMax: number
  bMin: number
  bMax: number
}

/** Distinct colours, packed as 0xAARRGGBB, with how often each occurs. */
function collectColors(pixels: Uint8ClampedArray): {
  values: Uint32Array
  counts: Uint32Array
} {
  const seen = new Map<number, number>()
  for (let i = 0; i < pixels.length; i += 4) {
    // Fully transparent pixels differ only by accident, so they are folded
    // into one colour rather than spending palette entries on invisible noise.
    const a = pixels[i + 3]
    const key =
      a === 0
        ? 0
        : ((a << 24) |
            (pixels[i] << 16) |
            (pixels[i + 1] << 8) |
            pixels[i + 2]) >>>
          0
    seen.set(key, (seen.get(key) ?? 0) + 1)
  }
  const values = new Uint32Array(seen.size)
  const counts = new Uint32Array(seen.size)
  let i = 0
  for (const [value, count] of seen) {
    values[i] = value
    counts[i] = count
    i += 1
  }
  return { values, counts }
}

function bounds(values: Uint32Array, from: number, to: number): Box {
  let rMin = 255,
    rMax = 0,
    gMin = 255,
    gMax = 0,
    bMin = 255,
    bMax = 0
  for (let i = from; i <= to; i += 1) {
    const v = values[i]
    const r = (v >>> 16) & 0xff
    const g = (v >>> 8) & 0xff
    const b = v & 0xff
    if (r < rMin) rMin = r
    if (r > rMax) rMax = r
    if (g < gMin) gMin = g
    if (g > gMax) gMax = g
    if (b < bMin) bMin = b
    if (b > bMax) bMax = b
  }
  return { from, to, rMin, rMax, gMin, gMax, bMin, bMax }
}

/**
 * Median cut: repeatedly split the box with the widest colour spread at its
 * median, so palette entries end up where the image actually has colours
 * rather than spread evenly through a cube most images never visit.
 */
export function buildPalette(
  pixels: Uint8ClampedArray,
  maxColors: number,
): Palette {
  const { values, counts } = collectColors(pixels)
  const order = Array.from({ length: values.length }, (_, i) => i)
  const sortedValues = new Uint32Array(order.map((i) => values[i]))
  const sortedCounts = new Uint32Array(order.map((i) => counts[i]))

  if (sortedValues.length <= maxColors) {
    // Fewer colours than the budget: keep them exactly, and the result is
    // lossless despite going through a "lossy" path.
    const colors = new Uint8Array(sortedValues.length * 4)
    for (let i = 0; i < sortedValues.length; i += 1) {
      const v = sortedValues[i]
      colors[i * 4] = (v >>> 16) & 0xff
      colors[i * 4 + 1] = (v >>> 8) & 0xff
      colors[i * 4 + 2] = v & 0xff
      colors[i * 4 + 3] = (v >>> 24) & 0xff
    }
    return { colors, count: sortedValues.length }
  }

  const boxes: Box[] = [bounds(sortedValues, 0, sortedValues.length - 1)]
  while (boxes.length < maxColors) {
    let widest = -1
    let widestSpread = 0
    for (let i = 0; i < boxes.length; i += 1) {
      const box = boxes[i]
      if (box.to <= box.from) {
        continue
      }
      const spread = Math.max(
        box.rMax - box.rMin,
        box.gMax - box.gMin,
        box.bMax - box.bMin,
      )
      if (spread > widestSpread) {
        widestSpread = spread
        widest = i
      }
    }
    if (widest < 0) {
      break
    }
    const box = boxes[widest]
    const rSpread = box.rMax - box.rMin
    const gSpread = box.gMax - box.gMin
    const bSpread = box.bMax - box.bMin
    const shift =
      rSpread >= gSpread && rSpread >= bSpread ? 16 : gSpread >= bSpread ? 8 : 0

    const slice = Array.from(sortedValues.subarray(box.from, box.to + 1)).map(
      (value, i) => ({ value, count: sortedCounts[box.from + i] }),
    )
    slice.sort(
      (a, b) => ((a.value >>> shift) & 0xff) - ((b.value >>> shift) & 0xff),
    )
    for (let i = 0; i < slice.length; i += 1) {
      sortedValues[box.from + i] = slice[i].value
      sortedCounts[box.from + i] = slice[i].count
    }

    const mid = box.from + (slice.length >> 1)
    boxes.splice(
      widest,
      1,
      bounds(sortedValues, box.from, mid - 1),
      bounds(sortedValues, mid, box.to),
    )
  }

  const colors = new Uint8Array(boxes.length * 4)
  boxes.forEach((box, i) => {
    // Weighted by how often each colour appears, so a box holding one stray
    // pixel and a large flat area lands on the flat area's colour.
    let r = 0,
      g = 0,
      b = 0,
      a = 0,
      total = 0
    for (let j = box.from; j <= box.to; j += 1) {
      const v = sortedValues[j]
      const n = sortedCounts[j]
      r += ((v >>> 16) & 0xff) * n
      g += ((v >>> 8) & 0xff) * n
      b += (v & 0xff) * n
      a += ((v >>> 24) & 0xff) * n
      total += n
    }
    colors[i * 4] = Math.round(r / total)
    colors[i * 4 + 1] = Math.round(g / total)
    colors[i * 4 + 2] = Math.round(b / total)
    colors[i * 4 + 3] = Math.round(a / total)
  })

  // Fully transparent entries first, so tRNS stays as short as possible.
  return { colors, count: boxes.length }
}

/** Nearest palette entry, cached by colour so each distinct colour is searched once. */
function nearestFinder(palette: Palette) {
  const cache = new Map<number, number>()
  return (r: number, g: number, b: number, a: number): number => {
    const key = ((a << 24) | (r << 16) | (g << 8) | b) >>> 0
    const hit = cache.get(key)
    if (hit !== undefined) {
      return hit
    }
    let best = 0
    let bestDistance = Infinity
    for (let i = 0; i < palette.count; i += 1) {
      const dr = r - palette.colors[i * 4]
      const dg = g - palette.colors[i * 4 + 1]
      const db = b - palette.colors[i * 4 + 2]
      const da = a - palette.colors[i * 4 + 3]
      // Alpha is weighted heavily: putting an opaque pixel on a transparent
      // entry is far more visible than a small hue shift.
      const distance = dr * dr + dg * dg + db * db + da * da * 4
      if (distance < bestDistance) {
        bestDistance = distance
        best = i
      }
    }
    cache.set(key, best)
    return best
  }
}

export type QuantizeResult = { indices: Uint8Array; palette: Palette }

/**
 * Maps every pixel to a palette entry.
 *
 * With dithering the leftover error is pushed into neighbouring pixels
 * (Floyd–Steinberg), which trades a faint stipple for the hard bands that
 * otherwise appear across gradients and skies.
 */
export function quantize(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  maxColors: number,
  dither: boolean,
): QuantizeResult {
  const palette = buildPalette(pixels, maxColors)
  const nearest = nearestFinder(palette)
  const indices = new Uint8Array(width * height)

  if (!dither) {
    for (let i = 0, p = 0; i < indices.length; i += 1, p += 4) {
      indices[i] = nearest(
        pixels[p],
        pixels[p + 1],
        pixels[p + 2],
        pixels[p + 3],
      )
    }
    return { indices, palette }
  }

  // Errors are carried in a float copy so they can go negative and accumulate
  // across the image rather than being clamped at every step.
  const work = Float32Array.from(pixels)
  const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v)
  const spread = (
    p: number,
    er: number,
    eg: number,
    eb: number,
    factor: number,
  ) => {
    work[p] += er * factor
    work[p + 1] += eg * factor
    work[p + 2] += eb * factor
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = (y * width + x) * 4
      const r = clamp(work[p])
      const g = clamp(work[p + 1])
      const b = clamp(work[p + 2])
      const a = clamp(work[p + 3])
      const index = nearest(
        Math.round(r),
        Math.round(g),
        Math.round(b),
        Math.round(a),
      )
      indices[y * width + x] = index
      const er = r - palette.colors[index * 4]
      const eg = g - palette.colors[index * 4 + 1]
      const eb = b - palette.colors[index * 4 + 2]
      if (x + 1 < width) spread(p + 4, er, eg, eb, 7 / 16)
      if (y + 1 < height) {
        const below = p + width * 4
        if (x > 0) spread(below - 4, er, eg, eb, 3 / 16)
        spread(below, er, eg, eb, 5 / 16)
        if (x + 1 < width) spread(below + 4, er, eg, eb, 1 / 16)
      }
    }
  }
  return { indices, palette }
}
