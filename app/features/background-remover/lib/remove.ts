// Single-colour background removal. Pure functions over RGBA pixel buffers, so
// everything here runs the same in the browser and under Vitest.

// Backed by a plain ArrayBuffer, which is what ImageData accepts.
export type PixelData = Uint8ClampedArray<ArrayBuffer>;

export type Pixels = {
  data: PixelData;
  width: number;
  height: number;
};

export type Rgb = readonly [number, number, number];

export type Point = { x: number; y: number };

export const MODES = ['connected', 'global'] as const;
export type Mode = (typeof MODES)[number];

export type RemoveSettings = {
  /** Only what is reachable from the edges, or every matching pixel. */
  mode: Mode;
  /** How far a colour may stray from the background, 0–50 (%). */
  tolerance: number;
  /** Turn the anti-aliased ring around the subject semi-transparent. */
  smoothEdges: boolean;
};

export type Detection = {
  /** null when the edges are already transparent. */
  color: Rgb | null;
  /** Share of the opaque edge pixels within tolerance of `color`, 0–1. */
  coverage: number;
};

export type RemoveResult = {
  data: PixelData;
  /** Share of the image's pixels made fully transparent, 0–1. */
  removed: number;
};

// Clicks per image. Each one becomes a target, and the target index has to fit
// in a byte alongside the automatic one.
export const MAX_POINTS = 50;

// How far the edge treatment reaches into the subject. One pixel catches
// ordinary anti-aliasing; the second catches images that were scaled up or
// saved as JPEG, where the blend is smeared over two.
const RING_WIDTH = 2;

const MAX_DISTANCE = Math.sqrt(3) * 255;

// Below this, a pixel is treated as already transparent: it carries no colour
// worth matching and it can be walked through by the flood fill.
const OPAQUE_ALPHA = 128;

/** Squared RGB distance that a tolerance percentage allows. */
function threshold(tolerance: number): number {
  const limit = (Math.min(Math.max(tolerance, 0), 100) / 100) * MAX_DISTANCE;
  return limit * limit;
}

function distanceSq(data: Uint8ClampedArray, offset: number, c: Rgb): number {
  const dr = data[offset]! - c[0];
  const dg = data[offset + 1]! - c[1];
  const db = data[offset + 2]! - c[2];
  return dr * dr + dg * dg + db * db;
}

/** Pixel indices along the four edges, each corner listed once. */
export function borderIndices(width: number, height: number): number[] {
  const seen = new Uint8Array(width * height);
  const indices: number[] = [];
  const add = (x: number, y: number) => {
    const i = y * width + x;
    if (!seen[i]) {
      seen[i] = 1;
      indices.push(i);
    }
  };
  for (let x = 0; x < width; x++) {
    add(x, 0);
    add(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    add(0, y);
    add(width - 1, y);
  }
  return indices;
}

/**
 * Guesses the background as the commonest colour along the edges. Colours are
 * bucketed at 4 bits a channel so JPEG noise lands in one bucket, and the
 * answer is the average of that bucket rather than its corner, so a #FEFEFE
 * background is matched as #FEFEFE and not as #F0F0F0.
 */
export function detectBackground(pixels: Pixels, tolerance: number): Detection {
  const { data, width, height } = pixels;
  const counts = new Uint32Array(4096);
  const sums = new Float64Array(4096 * 3);
  const opaque: number[] = [];

  for (const i of borderIndices(width, height)) {
    const o = i * 4;
    if (data[o + 3]! < OPAQUE_ALPHA) {
      continue;
    }
    opaque.push(o);
    const bin =
      ((data[o]! >> 4) << 8) | ((data[o + 1]! >> 4) << 4) | (data[o + 2]! >> 4);
    counts[bin]! += 1;
    sums[bin * 3]! += data[o]!;
    sums[bin * 3 + 1]! += data[o + 1]!;
    sums[bin * 3 + 2]! += data[o + 2]!;
  }

  // A transparent border means there is no background left to remove. Half is
  // the line because a subject touching one edge is common and not decisive.
  const borderCount = 2 * (width + height) - 4;
  if (opaque.length === 0 || opaque.length < Math.max(1, borderCount) / 2) {
    return { color: null, coverage: 0 };
  }

  let best = 0;
  for (let bin = 1; bin < 4096; bin++) {
    if (counts[bin]! > counts[best]!) {
      best = bin;
    }
  }
  const n = counts[best]!;
  const color: Rgb = [
    Math.round(sums[best * 3]! / n),
    Math.round(sums[best * 3 + 1]! / n),
    Math.round(sums[best * 3 + 2]! / n),
  ];

  const limit = threshold(tolerance);
  let matched = 0;
  for (const o of opaque) {
    if (distanceSq(data, o, color) <= limit) {
      matched += 1;
    }
  }
  return { color, coverage: matched / opaque.length };
}

type Target = { color: Rgb; seeds: number[] };

function buildTargets(
  pixels: Pixels,
  background: Rgb | null,
  points: readonly Point[],
  limit: number,
): Target[] {
  const { data, width, height } = pixels;
  const targets: Target[] = [];
  if (background) {
    // Transparent edge pixels seed too: the fill walks through them, which is
    // what reaches a white halo inside an already-transparent margin.
    const seeds = borderIndices(width, height).filter((i) => {
      const o = i * 4;
      return (
        data[o + 3]! < OPAQUE_ALPHA || distanceSq(data, o, background) <= limit
      );
    });
    targets.push({ color: background, seeds });
  }
  for (const point of points.slice(0, MAX_POINTS)) {
    const x = Math.floor(point.x);
    const y = Math.floor(point.y);
    if (x < 0 || y < 0 || x >= width || y >= height) {
      continue;
    }
    const i = y * width + x;
    const o = i * 4;
    // The colour clicked on, not the detected background: a click is how a
    // second background colour gets removed.
    targets.push({
      color: [data[o]!, data[o + 1]!, data[o + 2]!],
      seeds: [i],
    });
  }
  return targets;
}

/**
 * Marks the pixels to clear. Each marked pixel holds 1 + the index of the
 * target that claimed it, which the edge pass needs to know which colour to
 * subtract.
 */
function buildMask(
  pixels: Pixels,
  targets: Target[],
  mode: Mode,
  limit: number,
): Uint8Array {
  const { data, width, height } = pixels;
  const n = width * height;
  const mask = new Uint8Array(n);

  if (mode === 'global') {
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      if (data[o + 3]! < OPAQUE_ALPHA) {
        continue;
      }
      for (let t = 0; t < targets.length; t++) {
        if (distanceSq(data, o, targets[t]!.color) <= limit) {
          mask[i] = t + 1;
          break;
        }
      }
    }
    return mask;
  }

  // 4-connected, so a fill does not leak through the diagonal gap between two
  // touching strokes. Visited is per target: another target's region is no
  // barrier to this one.
  const visited = new Uint8Array(n);
  const queue = new Int32Array(n);
  for (let t = 0; t < targets.length; t++) {
    const { color, seeds } = targets[t]!;
    if (t > 0) {
      visited.fill(0);
    }
    let head = 0;
    let tail = 0;
    const visit = (i: number) => {
      if (visited[i]) {
        return;
      }
      visited[i] = 1;
      const o = i * 4;
      // Transparent pixels are walked through but never claimed: they need no
      // clearing, and claiming them would put an edge ring around the
      // subject of an image that was already cut out.
      if (data[o + 3]! < OPAQUE_ALPHA) {
        queue[tail++] = i;
        return;
      }
      if (distanceSq(data, o, color) <= limit) {
        if (!mask[i]) {
          mask[i] = t + 1;
        }
        queue[tail++] = i;
      }
    };
    for (const seed of seeds) {
      visit(seed);
    }
    while (head < tail) {
      const i = queue[head++]!;
      const x = i % width;
      if (x > 0) visit(i - 1);
      if (x < width - 1) visit(i + 1);
      if (i >= width) visit(i - width);
      if (i < n - width) visit(i + width);
    }
  }
  return mask;
}

/**
 * The pixels within RING_WIDTH (8-connected) of the cleared area, each holding
 * the target of the cleared pixel it was reached from.
 */
function buildRing(mask: Uint8Array, width: number, height: number) {
  const n = width * height;
  const ring = new Uint8Array(n);
  let frontier: number[] = [];
  for (let i = 0; i < n; i++) {
    if (mask[i]) {
      frontier.push(i);
    }
  }
  for (let step = 0; step < RING_WIDTH && frontier.length > 0; step++) {
    const next: number[] = [];
    for (const i of frontier) {
      const target = mask[i] || ring[i]!;
      const x = i % width;
      const y = (i - x) / width;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if ((dx === 0 && dy === 0) || nx < 0 || nx >= width) continue;
          const j = ny * width + nx;
          if (!mask[j] && !ring[j]) {
            ring[j] = target;
            next.push(j);
          }
        }
      }
    }
    frontier = next;
  }
  return ring;
}

/**
 * Splits an edge pixel into the background and the foreground it was blended
 * with. Anti-aliasing draws an edge pixel as a mix of the two, so the pixel
 * lies on the line from the background colour to the foreground colour, and
 * how far along it lies is its opacity. Removing the background's share from
 * the colour is what stops a white fringe showing on a dark page.
 *
 * Measured against a foreground sample rather than against the extremes of
 * the colour space (GIMP's "Color to Alpha"): that would read a pale pink
 * shape's hard edge as mostly transparent and shave it down.
 *
 * Returns the alpha (0–1) and writes the recovered colour into `out`.
 */
export function edgeAlpha(
  p: Rgb,
  background: Rgb,
  foreground: Rgb,
  out: [number, number, number],
): number {
  let dot = 0;
  let length = 0;
  for (let c = 0; c < 3; c++) {
    const f = foreground[c]! - background[c]!;
    dot += (p[c]! - background[c]!) * f;
    length += f * f;
  }
  const alpha = length === 0 ? 0 : Math.min(1, Math.max(0, dot / length));
  for (let c = 0; c < 3; c++) {
    out[c] =
      alpha === 0
        ? p[c]!
        : Math.round(
            Math.min(
              255,
              Math.max(0, background[c]! + (p[c]! - background[c]!) / alpha),
            ),
          );
  }
  return alpha;
}

/**
 * Returns a new buffer with the background cleared. The source is not
 * modified, so the preview can re-run on every settings change.
 */
export function removeBackground(
  pixels: Pixels,
  settings: RemoveSettings,
  background: Rgb | null,
  points: readonly Point[] = [],
): RemoveResult {
  const { data, width, height } = pixels;
  const n = width * height;
  const out = new Uint8ClampedArray(data);
  const limit = threshold(settings.tolerance);
  const targets = buildTargets(pixels, background, points, limit);
  if (targets.length === 0 || n === 0) {
    return { data: out, removed: 0 };
  }

  const mask = buildMask(pixels, targets, settings.mode, limit);
  let removed = 0;
  for (let i = 0; i < n; i++) {
    if (mask[i]) {
      out[i * 4 + 3] = 0;
      removed += 1;
    }
  }

  if (settings.smoothEdges && removed > 0) {
    // Only the ring, never the interior: applied everywhere, a pale part of
    // the subject would turn see-through along with the background.
    const ring = buildRing(mask, width, height);
    const rgb: [number, number, number] = [0, 0, 0];
    const reach = RING_WIDTH;
    for (let i = 0; i < n; i++) {
      const t = ring[i];
      if (!t) {
        continue;
      }
      const o = i * 4;
      const sourceAlpha = data[o + 3]!;
      if (sourceAlpha === 0) {
        continue;
      }
      const background = targets[t - 1]!.color;
      // The foreground sample is the neighbour least like the background: on a
      // thick shape that is its solid interior, and on a hairline it is the
      // line's own darkest pixel, which errs towards keeping it opaque.
      const x = i % width;
      const y = (i - x) / width;
      let best = o;
      let bestDistance = distanceSq(data, o, background);
      for (
        let ny = Math.max(0, y - reach);
        ny <= Math.min(height - 1, y + reach);
        ny++
      ) {
        for (
          let nx = Math.max(0, x - reach);
          nx <= Math.min(width - 1, x + reach);
          nx++
        ) {
          const j = ny * width + nx;
          const q = j * 4;
          if (mask[j] || data[q + 3]! < OPAQUE_ALPHA) {
            continue;
          }
          const d = distanceSq(data, q, background);
          if (d > bestDistance) {
            best = q;
            bestDistance = d;
          }
        }
      }
      const alpha = edgeAlpha(
        [data[o]!, data[o + 1]!, data[o + 2]!],
        background,
        [data[best]!, data[best + 1]!, data[best + 2]!],
        rgb,
      );
      out[o] = rgb[0];
      out[o + 1] = rgb[1];
      out[o + 2] = rgb[2];
      out[o + 3] = Math.round(alpha * sourceAlpha);
    }
  }

  return { data: out, removed: removed / n };
}

/** `#rrggbb` for showing the detected colour; not for analytics. */
export function toHex(color: Rgb): string {
  return `#${color.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
