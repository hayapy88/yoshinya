// @vitest-environment jsdom
// jsdom, not for the DOM: importing the worker module registers a listener on
// `self`, which does not exist in the node environment.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { encode, type EncodeRequest } from './encode.worker'

/**
 * Stands in for the encoder. `produces` is the type the fake browser is willing
 * to write, which is what makes a silent fallback expressible.
 */
function stubCanvas(produces: string) {
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ width: 100, height: 50, close: vi.fn() })),
  )
  vi.stubGlobal(
    'OffscreenCanvas',
    class {
      constructor(
        public width: number,
        public height: number,
      ) {}
      getContext() {
        return { fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: '' }
      }
      async convertToBlob() {
        return new Blob([new Uint8Array([1])], { type: produces })
      }
    },
  )
}

function request(mimeType: string): EncodeRequest {
  return {
    jobId: 'job-1',
    file: new File([new Uint8Array([1])], 'photo.png', { type: 'image/png' }),
    mimeType,
    quality: 80,
    useQuality: true,
    png: null,
    resize: {
      resizeEnabled: false,
      width: null,
      height: null,
      keepAspectRatio: true,
      preventUpscale: true,
    },
    background: null,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('encode', () => {
  it('returns the blob when the encoder produced what was asked for', async () => {
    stubCanvas('image/webp')

    const response = await encode(request('image/webp'))

    expect(response.ok).toBe(true)
    expect(response.ok && response.blob.type).toBe('image/webp')
  })

  // A browser that cannot encode the requested type does not throw — it falls
  // back to PNG. Without this check the tool would hand back PNG bytes under a
  // .webp name, which looks like success. Older WebKit is the real case.
  it('reports a failure when the encoder silently fell back to another type', async () => {
    stubCanvas('image/png')

    const response = await encode(request('image/webp'))

    expect(response.ok).toBe(false)
    expect(response.ok === false && response.reason).toBe('format')
  })

  it('does not mistake a matching png request for a fallback', async () => {
    stubCanvas('image/png')

    const response = await encode(request('image/png'))

    expect(response.ok).toBe(true)
  })

  it('separates a decode failure from an encode failure', async () => {
    stubCanvas('image/webp')
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        throw new Error('broken file')
      }),
    )

    const response = await encode(request('image/webp'))

    expect(response.ok === false && response.reason).toBe('decode')
  })

  it('recognises an allocation failure so the message can suggest fewer images', async () => {
    stubCanvas('image/webp')
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        throw new Error('Out of memory allocating bitmap')
      }),
    )

    const response = await encode(request('image/webp'))

    expect(response.ok === false && response.reason).toBe('memory')
  })
})
