// Page thumbnails, drawn with pdf.js.
//
// pdf-lib reads and writes PDFs but cannot draw them, so anything that shows a
// page needs a second library. pdf.js costs 494 KB gzipped (128 KB for the
// library, 366 KB for its worker) against pdf-lib's 201 KB, which is why it is
// loaded only once a file has actually been dropped — opening the tool page
// downloads none of it.
//
// Nothing here talks to the network: the worker is bundled and served from our
// own origin. Left at its default pdf.js fetches a worker from a CDN, which for
// this project would be a privacy incident rather than a slow load.
import type { PDFDocumentProxy } from 'pdfjs-dist';

export type ThumbnailSize = { width: number; height: number };

export type RenderedPage = {
  // A data URL rather than an ImageBitmap: it can be handed straight to an
  // <img> in every browser, and the caller caps how many it keeps.
  url: string;
  size: ThumbnailSize;
};

export type PdfRenderer = {
  pageCount: number;
  /** Draws one page, 0-indexed, at roughly the given CSS width. */
  renderPage(
    index: number,
    widthPx: number,
    signal?: AbortSignal,
  ): Promise<RenderedPage>;
  destroy(): void;
};

export class RenderError extends Error {
  constructor(readonly reason: 'failed' | 'aborted' | 'destroyed' = 'failed') {
    super(reason);
    this.name = 'RenderError';
  }
}

let pdfjs: Promise<typeof import('pdfjs-dist')> | undefined;

// Loaded once per page load and shared by every renderer, so replacing the
// open file does not re-download the library.
async function loadPdfJs() {
  pdfjs ??= (async () => {
    const [lib, worker] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]);
    lib.GlobalWorkerOptions.workerSrc = worker.default;
    return lib;
  })();
  return pdfjs;
}

// Retina thumbnails are worth the memory; past 2x they are not, and at several
// hundred pages this is what decides whether the tab survives.
const MAX_PIXEL_RATIO = 2;

function pixelRatio(): number {
  const ratio = typeof window === 'undefined' ? 1 : window.devicePixelRatio;
  return Math.min(Math.max(ratio || 1, 1), MAX_PIXEL_RATIO);
}

/**
 * Opens a document for drawing.
 *
 * The bytes are copied first, and the copy is not optional: pdf.js transfers
 * the buffer it is given to its worker, which detaches it on this side. Handing
 * it the same buffer the writing half of the tool holds leaves pdf-lib with an
 * empty array — a failure that only shows up when the user clicks download.
 */
export async function createRenderer(bytes: Uint8Array): Promise<PdfRenderer> {
  const lib = await loadPdfJs();
  const task = lib.getDocument({
    data: bytes.slice(0),
    // Served from our own origin by scripts/copy-pdfjs-assets.mjs. Without the
    // CMaps, a Japanese PDF that relies on a system font — an everyday case
    // here — draws its pages with the text missing. The default is to fetch
    // none of them; the common alternative is a CDN, which would tell someone
    // else's server which documents a visitor opened.
    cMapUrl: '/pdfjs/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/pdfjs/standard_fonts/',
    wasmUrl: '/pdfjs/wasm/',
    iccUrl: '/pdfjs/iccs/',
  });

  let doc: PDFDocumentProxy;
  try {
    doc = await task.promise;
  } catch (error) {
    void task.destroy();
    throw error;
  }
  let destroyed = false;

  return {
    pageCount: doc.numPages,

    async renderPage(index, widthPx, signal) {
      if (destroyed) {
        throw new RenderError('destroyed');
      }
      if (signal?.aborted) {
        throw new RenderError('aborted');
      }
      const page = await doc.getPage(index + 1);
      const ratio = pixelRatio();
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: (widthPx * ratio) / base.width,
      });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(viewport.width));
      canvas.height = Math.max(1, Math.round(viewport.height));

      const render = page.render({
        canvas,
        viewport,
        // A PDF page rarely paints its own background, and on a transparent
        // canvas black text on a dark theme disappears into the card.
        background: '#ffffff',
      });
      // Scrolling past a page mid-draw has to stop the work, or a long document
      // spends its time drawing thumbnails nobody is looking at any more.
      const abort = () => render.cancel();
      signal?.addEventListener('abort', abort, { once: true });
      // An abort that landed while the page was still being fetched has
      // already fired its event, and a listener added afterwards never hears
      // it — the draw would then run to completion with nobody waiting for it.
      if (signal?.aborted) {
        abort();
      }
      try {
        await render.promise;
      } catch (error) {
        if (signal?.aborted) {
          throw new RenderError('aborted');
        }
        throw error;
      } finally {
        signal?.removeEventListener('abort', abort);
        page.cleanup();
      }
      if (signal?.aborted) {
        throw new RenderError('aborted');
      }

      return {
        url: canvas.toDataURL('image/png'),
        size: { width: canvas.width / ratio, height: canvas.height / ratio },
      };
    },

    destroy() {
      destroyed = true;
      void task.destroy();
    },
  };
}
