import { describe, expect, it } from 'vitest';
import { PDFDocument, degrees } from 'pdf-lib';
import { OrganizeError, buildOutputs, inspectPdf } from './organize';
import { createPages, deletePages, movePage, rotatePages } from './pages';
import { boundariesToSegments } from './split';
import type { PageItem } from './types';

// Integration coverage against the real pdf-lib. What this tool has to get
// right — which pages come out, in which order, turned which way — is not
// visible in a unit test of the page list alone.

// Each page is given a unique width, so an output can be read back and checked
// page by page. Reading text out of a PDF would need a second library.
async function makePdf(
  widths: number[],
  rotations: number[] = [],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  widths.forEach((width, index) => {
    const page = doc.addPage([width, 800]);
    const angle = rotations[index];
    if (angle !== undefined) {
      page.setRotation(degrees(angle));
    }
  });
  return doc.save();
}

async function read(blob: Blob) {
  const doc = await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()));
  return {
    widths: doc.getPages().map((page) => Math.round(page.getSize().width)),
    rotations: doc.getPages().map((page) => page.getRotation().angle),
    title: doc.getTitle(),
  };
}

function pagesFor(inspection: { rotations: number[] }): PageItem[] {
  return createPages(inspection.rotations, (index) => `p${index}`);
}

const whole = (pages: PageItem[]) => boundariesToSegments(pages.length, []);
const options = { outputName: 'report.pdf' };

describe('inspectPdf', () => {
  it('reads the page count and the rotation each page already has', async () => {
    const result = await inspectPdf(await makePdf([100, 200], [0, 90]));
    expect(result.pageCount).toBe(2);
    expect(result.rotations).toEqual([0, 90]);
    expect(result.warnings).toEqual([]);
  });

  it('rejects an empty file', async () => {
    await expect(inspectPdf(new Uint8Array())).rejects.toMatchObject({
      code: 'empty_file',
    });
  });

  it('reports a file it cannot parse as corrupted', async () => {
    await expect(
      inspectPdf(new Uint8Array([1, 2, 3, 4])),
    ).rejects.toBeInstanceOf(OrganizeError);
  });

  it('refuses a document with more pages than the grid can hold', async () => {
    const doc = await PDFDocument.create();
    for (let i = 0; i < 1001; i += 1) {
      doc.addPage([10, 10]);
    }
    await expect(inspectPdf(await doc.save())).rejects.toMatchObject({
      code: 'too_many_pages',
    });
  });

  it('warns about an interactive form rather than blocking it', async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    doc.getForm().createTextField('applicant.name');
    const result = await inspectPdf(await doc.save());
    expect(result.warnings).toContain('has_form');
  });
});

describe('buildOutputs', () => {
  it('writes the whole document back when nothing was changed', async () => {
    const bytes = await makePdf([100, 200, 300]);
    const pages = pagesFor(await inspectPdf(bytes));
    const [entry] = await buildOutputs(bytes, pages, whole(pages), options);
    expect(entry!.name).toBe('report.pdf');
    expect((await read(entry!.blob)).widths).toEqual([100, 200, 300]);
  });

  it('leaves out the pages that were deleted', async () => {
    const bytes = await makePdf([100, 200, 300, 400]);
    const pages = deletePages(pagesFor(await inspectPdf(bytes)), ['p1', 'p3']);
    const [entry] = await buildOutputs(bytes, pages, whole(pages), options);
    expect((await read(entry!.blob)).widths).toEqual([100, 300]);
  });

  it('writes the pages in the order the grid shows them', async () => {
    const bytes = await makePdf([100, 200, 300]);
    const pages = movePage(pagesFor(await inspectPdf(bytes)), 2, 0);
    const [entry] = await buildOutputs(bytes, pages, whole(pages), options);
    expect((await read(entry!.blob)).widths).toEqual([300, 100, 200]);
  });

  it('writes a rotation as an absolute angle, added to what the page had', async () => {
    // The second page is already at 90: setting 90 on it would look like it
    // did nothing, which is the trap this tool has to avoid.
    const bytes = await makePdf([100, 200], [0, 90]);
    let pages = pagesFor(await inspectPdf(bytes));
    pages = rotatePages(pages, ['p0', 'p1'], 90);
    const [entry] = await buildOutputs(bytes, pages, whole(pages), options);
    expect((await read(entry!.blob)).rotations).toEqual([90, 180]);
  });

  it('turns left into 270 rather than -90, which pdf-lib will not store', async () => {
    const bytes = await makePdf([100]);
    const pages = rotatePages(pagesFor(await inspectPdf(bytes)), ['p0'], -90);
    const [entry] = await buildOutputs(bytes, pages, whole(pages), options);
    expect((await read(entry!.blob)).rotations).toEqual([270]);
  });

  it('splits into one file per segment, numbered and titled', async () => {
    const bytes = await makePdf([100, 200, 300, 400, 500]);
    const pages = pagesFor(await inspectPdf(bytes));
    const entries = await buildOutputs(
      bytes,
      pages,
      boundariesToSegments(5, [2, 4]),
      options,
    );
    expect(entries.map((entry) => entry.name)).toEqual([
      'report-1.pdf',
      'report-2.pdf',
      'report-3.pdf',
    ]);
    expect((await read(entries[0]!.blob)).widths).toEqual([100, 200]);
    expect((await read(entries[1]!.blob)).widths).toEqual([300, 400]);
    expect((await read(entries[2]!.blob)).widths).toEqual([500]);
    expect((await read(entries[1]!.blob)).title).toBe('report-2');
  });

  it('titles a single output with the name it is saved under', async () => {
    const bytes = await makePdf([100]);
    const pages = pagesFor(await inspectPdf(bytes));
    const [entry] = await buildOutputs(bytes, pages, whole(pages), options);
    expect((await read(entry!.blob)).title).toBe('report');
  });

  it('reports progress once per file', async () => {
    const bytes = await makePdf([100, 200, 300]);
    const pages = pagesFor(await inspectPdf(bytes));
    const seen: number[] = [];
    await buildOutputs(bytes, pages, boundariesToSegments(3, [1, 2]), {
      ...options,
      onProgress: ({ done, total }) => {
        expect(total).toBe(3);
        seen.push(done);
      },
    });
    expect(seen).toEqual([1, 2, 3]);
  });

  it('refuses to write a document with no pages left', async () => {
    const bytes = await makePdf([100]);
    await expect(
      buildOutputs(bytes, [], [{ start: 0, end: 0 }], options),
    ).rejects.toMatchObject({ code: 'no_pages_left' });
  });
});
