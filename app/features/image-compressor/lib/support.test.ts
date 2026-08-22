import { afterEach, describe, expect, it, vi } from 'vitest';
import { probeEncodableFormats } from './support';

/** Fakes a browser that will only ever write the types it is told to write. */
function stubEncoder(writable: string[]) {
  vi.stubGlobal(
    'OffscreenCanvas',
    class {
      constructor(
        public width: number,
        public height: number,
      ) {}
      getContext() {
        return { fillRect: vi.fn() };
      }
      async convertToBlob({ type }: { type: string }) {
        // The fallback that makes this whole probe necessary: an unwritable
        // type comes back as PNG rather than as an error.
        return new Blob([new Uint8Array([1])], {
          type: writable.includes(type) ? type : 'image/png',
        });
      }
    },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('probeEncodableFormats', () => {
  it('reports every format a modern browser writes', async () => {
    stubEncoder(['image/jpeg', 'image/webp']);

    const available = await probeEncodableFormats();

    expect([...available].sort()).toEqual(['jpeg', 'png', 'webp']);
  });

  it('leaves out a format the browser silently substitutes', async () => {
    stubEncoder(['image/jpeg']);

    const available = await probeEncodableFormats();

    expect(available.has('webp')).toBe(false);
    expect(available.has('jpeg')).toBe(true);
  });

  it('still reports png, which every canvas is required to write', async () => {
    stubEncoder([]);

    const available = await probeEncodableFormats();

    expect([...available]).toEqual(['png']);
  });

  it('does not reject when the browser has no OffscreenCanvas at all', async () => {
    vi.stubGlobal('OffscreenCanvas', undefined);

    await expect(probeEncodableFormats()).resolves.toEqual(new Set(['png']));
  });
});
