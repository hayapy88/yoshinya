import { mimeForFormat } from './settings'
import type { EncodableFormat } from './types'

// Which output formats this browser can actually write.
//
// Asking is the only way to know. An encoder that cannot produce a type does
// not throw — the specification has it fall back to PNG — so the answer is the
// type on the Blob that comes back. Support genuinely differs: canvas WebP
// encoding arrived in Safari 16, and the Linux WebKit build used on CI has it
// while some real iOS versions do not.
//
// The probe runs on the main thread rather than in the encode worker, but uses
// the same OffscreenCanvas encoder the worker uses, so it is measuring the
// thing it claims to measure and needs none of the queue's job plumbing.

/** PNG is required of every canvas implementation, so it is never in doubt. */
const ALWAYS_AVAILABLE: EncodableFormat = 'png'

const PROBED: EncodableFormat[] = ['jpeg', 'webp']

async function canEncode(mimeType: string): Promise<boolean> {
  try {
    // 1×1: the question is whether the encoder exists, not how it performs.
    const canvas = new OffscreenCanvas(1, 1)
    const context = canvas.getContext('2d')
    if (!context) {
      return false
    }
    context.fillRect(0, 0, 1, 1)
    const blob = await canvas.convertToBlob({ type: mimeType })
    return blob.type === mimeType
  } catch {
    // A browser without OffscreenCanvas cannot run this tool at all, so there
    // is nothing useful to report beyond "not this format".
    return false
  }
}

/**
 * Resolves to the formats this browser can write. Never rejects: a probe that
 * fails leaves the format merely unlisted, and encoding still reports its own
 * error if the answer was wrong.
 */
export async function probeEncodableFormats(): Promise<Set<EncodableFormat>> {
  const available = new Set<EncodableFormat>([ALWAYS_AVAILABLE])
  const results = await Promise.all(
    PROBED.map(
      async (format) =>
        [format, await canEncode(mimeForFormat(format))] as const,
    ),
  )
  for (const [format, ok] of results) {
    if (ok) {
      available.add(format)
    }
  }
  return available
}
