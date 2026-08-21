/// <reference lib="webworker" />

import { encodeIndexedPng } from './png'
import { quantize } from './quantize'
import { targetDimensions } from './resize'
import type { CompressionSettings } from './types'

// Encoding runs here, off the main thread. Decoding a 30 MB photo and painting
// it into a canvas takes tens to hundreds of milliseconds; doing that on the
// main thread while someone drags a quality slider makes the page stutter.
//
// The image never leaves this worker except as the finished Blob handed back to
// the tab. Nothing is uploaded — no network call happens here at all.

export type ResizeRequest = Pick<
  CompressionSettings,
  'resizeEnabled' | 'width' | 'height' | 'keepAspectRatio' | 'preventUpscale'
>

export type EncodeRequest = {
  jobId: string
  file: File
  mimeType: string
  quality: number
  useQuality: boolean
  /** Colour reduction for PNG output; null leaves the canvas encoder to it. */
  png: { colors: number; dither: boolean } | null
  // Resolved here rather than by the caller: the true pixel size is only known
  // once the image is decoded, and on the first pass the caller does not have it.
  resize: ResizeRequest
  background: string | null
}

export type EncodeResponse =
  | {
      jobId: string
      ok: true
      blob: Blob
      width: number
      height: number
      sourceWidth: number
      sourceHeight: number
    }
  | {
      jobId: string
      ok: false
      reason: 'decode' | 'encode' | 'memory' | 'format'
    }

function isMemoryError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /memory|allocation/i.test(message)
}

// Exported for tests. The message plumbing below is trivial; the branches worth
// pinning are all in here.
export async function encode(request: EncodeRequest): Promise<EncodeResponse> {
  let bitmap: ImageBitmap
  try {
    // imageOrientation: 'from-image' applies EXIF rotation during decode, so the
    // output comes out the way the photo looks, without parsing EXIF ourselves.
    bitmap = await createImageBitmap(request.file, {
      imageOrientation: 'from-image',
    })
  } catch (error) {
    return {
      jobId: request.jobId,
      ok: false,
      reason: isMemoryError(error) ? 'memory' : 'decode',
    }
  }

  try {
    const target = targetDimensions(
      { width: bitmap.width, height: bitmap.height },
      request.resize,
    )
    const canvas = new OffscreenCanvas(target.width, target.height)
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('no 2d context')
    }
    // JPEG has no alpha, so transparency has to land on something. Painting the
    // chosen colour first stops transparent areas turning black.
    if (request.background) {
      context.fillStyle = request.background
      context.fillRect(0, 0, target.width, target.height)
    }
    context.drawImage(bitmap, 0, 0, target.width, target.height)

    // PNG takes its own path. The canvas encoder always writes 8-bit RGBA with
    // no palette, which on an already-optimised source produces a bigger file
    // than the one it started from — measured at 192% on this site's own OGP
    // images. Reducing the colours and writing a palette PNG is the only thing
    // that actually makes a PNG smaller.
    if (request.png) {
      const source = context.getImageData(0, 0, target.width, target.height)
      const { indices, palette } = quantize(
        source.data,
        target.width,
        target.height,
        request.png.colors,
        request.png.dither,
      )
      const bytes = await encodeIndexedPng(
        indices,
        palette,
        target.width,
        target.height,
      )
      return {
        jobId: request.jobId,
        ok: true,
        blob: new Blob([bytes as BlobPart], { type: 'image/png' }),
        width: target.width,
        height: target.height,
        sourceWidth: bitmap.width,
        sourceHeight: bitmap.height,
      }
    }

    const blob = await canvas.convertToBlob(
      // Quality is omitted for PNG rather than passed and ignored: the encoder
      // has no use for it, and sending it would imply it did something.
      request.useQuality
        ? { type: request.mimeType, quality: request.quality / 100 }
        : { type: request.mimeType },
    )
    // An encoder that cannot produce the requested type does not throw: the
    // specification has it fall back to PNG, and the only evidence is the type
    // on the returned Blob. Left unchecked that ships a PNG named .webp, which
    // is worse than an error because it looks like it worked. Engine support
    // differs here — Chromium and Gecko encode WebP, older WebKit does not —
    // so the check is the only portable way to know.
    if (blob.type !== request.mimeType) {
      return { jobId: request.jobId, ok: false, reason: 'format' }
    }
    return {
      jobId: request.jobId,
      ok: true,
      blob,
      width: target.width,
      height: target.height,
      sourceWidth: bitmap.width,
      sourceHeight: bitmap.height,
    }
  } catch (error) {
    return {
      jobId: request.jobId,
      ok: false,
      reason: isMemoryError(error) ? 'memory' : 'encode',
    }
  } finally {
    // Frees the decoded pixels now instead of waiting for GC, which matters
    // when a queue is working through a hundred photos.
    bitmap.close()
  }
}

self.addEventListener('message', (event: MessageEvent<EncodeRequest>) => {
  void encode(event.data).then((response) => {
    ;(self as unknown as Worker).postMessage(response)
  })
})
