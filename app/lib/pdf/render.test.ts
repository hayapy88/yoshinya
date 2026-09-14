/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// pdf.js draws to a real canvas in a real browser, which jsdom is not, so what
// is pinned here is the contract around the drawing: that the caller's bytes
// survive, that a cancelled thumbnail stops work, and that the worker is the
// one we ship. Whether a page looks right is an e2e concern.

const getDocument = vi.fn();
const workerOptions = { workerSrc: '' };

vi.mock('pdfjs-dist', () => ({
  getDocument: (...args: unknown[]) => getDocument(...args),
  GlobalWorkerOptions: workerOptions,
}));

vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({
  default: '/assets/pdf.worker.mjs',
}));

const { RenderError, createRenderer } = await import('./render');

const viewport = { width: 100, height: 140 };

function stubDocument() {
  // Left pending until a test lets it finish, the way a real draw is: a
  // thumbnail that has already finished has nothing to cancel.
  let finish = () => {};
  const render = {
    promise: new Promise<void>((resolve) => {
      finish = resolve;
    }),
    // The real one rejects the render promise; resolving it is enough here,
    // because what is under test is that the abort reaches pdf.js at all.
    cancel: vi.fn(() => finish()),
  };
  const page = {
    getViewport: () => viewport,
    render: vi.fn(() => render),
    cleanup: vi.fn(),
  };
  const destroy = vi.fn(async () => {});
  const done = () => finish();
  getDocument.mockReturnValue({
    promise: Promise.resolve({ numPages: 3, getPage: async () => page }),
    destroy,
  });
  return { page, render, destroy, done };
}

beforeEach(() => {
  vi.restoreAllMocks();
  getDocument.mockReset();
  workerOptions.workerSrc = '';
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
    'data:image/png;base64,AAAA',
  );
});

describe('createRenderer', () => {
  it('serves the worker from our own bundle, never a CDN', async () => {
    stubDocument();
    await createRenderer(new Uint8Array([1, 2, 3]));
    expect(workerOptions.workerSrc).toBe('/assets/pdf.worker.mjs');
  });

  it('hands pdf.js a copy, so the buffer pdf-lib writes from survives', async () => {
    stubDocument();
    const bytes = new Uint8Array([1, 2, 3, 4]);
    await createRenderer(bytes);

    // pdf.js transfers what it is given to its worker, which detaches it here.
    // Passing the same buffer twice leaves the save step with an empty array,
    // and only at the moment the user clicks download.
    const passed = getDocument.mock.calls[0]![0] as { data: Uint8Array };
    expect(passed.data).not.toBe(bytes);
    expect(passed.data.buffer).not.toBe(bytes.buffer);
    expect(Array.from(passed.data)).toEqual([1, 2, 3, 4]);
    expect(bytes.byteLength).toBe(4);
  });

  it('reports the page count', async () => {
    stubDocument();
    const renderer = await createRenderer(new Uint8Array([1]));
    expect(renderer.pageCount).toBe(3);
  });

  it('draws a page to a data URL', async () => {
    const { done } = stubDocument();
    const renderer = await createRenderer(new Uint8Array([1]));
    const drawing = renderer.renderPage(0, 100);
    done();
    const page = await drawing;
    expect(page.url).toContain('data:image/png');
    expect(page.size.width).toBeGreaterThan(0);
  });

  it('cancels the draw when the page scrolls out of view', async () => {
    const { render } = stubDocument();
    const renderer = await createRenderer(new Uint8Array([1]));
    const controller = new AbortController();
    const drawing = renderer.renderPage(0, 100, controller.signal);
    controller.abort();
    await expect(drawing).rejects.toBeInstanceOf(RenderError);
    expect(render.cancel).toHaveBeenCalled();
  });

  it('refuses to draw once the file has been replaced', async () => {
    const { destroy } = stubDocument();
    const renderer = await createRenderer(new Uint8Array([1]));
    renderer.destroy();
    await expect(renderer.renderPage(0, 100)).rejects.toBeInstanceOf(
      RenderError,
    );
    expect(destroy).toHaveBeenCalled();
  });
});
