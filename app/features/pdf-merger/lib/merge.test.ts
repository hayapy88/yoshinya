import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  MergeError,
  inspectPdf,
  mergePdfs,
  totalOutputPages,
} from './merge';
import type { MergeItem } from './types';

// Integration coverage against the real pdf-lib. Page order and page selection
// are the two things this tool exists to get right, and neither is visible in a
// unit test of the parser alone.

// Each page is given a unique width, so a merged document can be read back and
// checked page by page. Reading text out of a PDF would need a second library.
async function makePdf(widths: number[], name = 'source.pdf'): Promise<File> {
  const doc = await PDFDocument.create();
  for (const width of widths) {
    doc.addPage([width, 800]);
  }
  const bytes = await doc.save();
  return new File([bytes as BlobPart], name, { type: 'application/pdf' });
}

function item(file: File, pageCount: number, pageRange = ''): MergeItem {
  return {
    id: file.name,
    sourceFile: file,
    fileName: file.name,
    size: file.size,
    pageCount,
    pageRange,
    warnings: [],
    status: 'ready',
  };
}

async function widthsOf(blob: Blob): Promise<number[]> {
  const doc = await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()));
  return doc.getPages().map((page) => Math.round(page.getSize().width));
}

describe('inspectPdf', () => {
  it('reads the page count', async () => {
    const result = await inspectPdf(await makePdf([100, 200, 300]));
    expect(result.pageCount).toBe(3);
    expect(result.warnings).toEqual([]);
  });

  it('rejects an empty file', async () => {
    const empty = new File([], 'empty.pdf', { type: 'application/pdf' });
    await expect(inspectPdf(empty)).rejects.toMatchObject({
      code: 'empty_file',
    });
  });

  it('reports a file it cannot parse as corrupted', async () => {
    const junk = new File([new Uint8Array([1, 2, 3, 4])], 'junk.pdf', {
      type: 'application/pdf',
    });
    await expect(inspectPdf(junk)).rejects.toBeInstanceOf(MergeError);
  });

  it('warns about an interactive form rather than blocking it', async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    doc.getForm().createTextField('applicant.name');
    const bytes = await doc.save();
    const file = new File([bytes as BlobPart], 'form.pdf', {
      type: 'application/pdf',
    });
    const result = await inspectPdf(file);
    expect(result.warnings).toContain('has_form');
    expect(result.pageCount).toBe(1);
  });
});

describe('totalOutputPages', () => {
  it('adds up whole documents', async () => {
    const a = item(await makePdf([1, 2, 3]), 3);
    const b = item(await makePdf([4, 5]), 2);
    expect(totalOutputPages([a, b])).toBe(5);
  });

  it('counts only the selected pages', async () => {
    const a = item(await makePdf([1, 2, 3, 4, 5]), 5, '1-2');
    const b = item(await makePdf([6, 7]), 2, '2');
    expect(totalOutputPages([a, b])).toBe(3);
  });

  it('skips items whose range does not parse', async () => {
    const a = item(await makePdf([1, 2]), 2);
    const b = item(await makePdf([3, 4]), 2, 'nonsense');
    expect(totalOutputPages([a, b])).toBe(2);
  });

  it('skips items that failed to load', async () => {
    const a = item(await makePdf([1, 2]), 2);
    const broken: MergeItem = { ...a, id: 'x', status: 'error' };
    expect(totalOutputPages([a, broken])).toBe(2);
  });
});

describe('mergePdfs', () => {
  it('concatenates whole documents in list order', async () => {
    const a = item(await makePdf([101, 102], 'a.pdf'), 2);
    const b = item(await makePdf([201], 'b.pdf'), 1);
    const merged = await mergePdfs([a, b], { outputName: 'out.pdf' });
    expect(await widthsOf(merged)).toEqual([101, 102, 201]);
  });

  it('follows the order of the list, not the order of the files', async () => {
    const a = item(await makePdf([101], 'a.pdf'), 1);
    const b = item(await makePdf([201], 'b.pdf'), 1);
    const merged = await mergePdfs([b, a], { outputName: 'out.pdf' });
    expect(await widthsOf(merged)).toEqual([201, 101]);
  });

  it('takes only the requested pages', async () => {
    const a = item(await makePdf([101, 102, 103, 104], 'a.pdf'), 4, '2-3');
    const merged = await mergePdfs([a], { outputName: 'out.pdf' });
    expect(await widthsOf(merged)).toEqual([102, 103]);
  });

  it('honours a descending range as a reversal', async () => {
    const a = item(await makePdf([101, 102, 103], 'a.pdf'), 3, '3-1');
    const merged = await mergePdfs([a], { outputName: 'out.pdf' });
    expect(await widthsOf(merged)).toEqual([103, 102, 101]);
  });

  it('repeats a page listed twice', async () => {
    const a = item(await makePdf([101, 102], 'a.pdf'), 2, '1,1,2');
    const merged = await mergePdfs([a], { outputName: 'out.pdf' });
    expect(await widthsOf(merged)).toEqual([101, 101, 102]);
  });

  it('sets the title from the output file name', async () => {
    const a = item(await makePdf([101], 'a.pdf'), 1);
    const merged = await mergePdfs([a], { outputName: '2026 決算報告.pdf' });
    const doc = await PDFDocument.load(
      new Uint8Array(await merged.arrayBuffer()),
    );
    expect(doc.getTitle()).toBe('2026 決算報告');
  });

  it('does not carry metadata over from the sources', async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    doc.setAuthor('Someone Else');
    doc.setSubject('Internal');
    const bytes = await doc.save();
    const file = new File([bytes as BlobPart], 'a.pdf', {
      type: 'application/pdf',
    });
    const merged = await mergePdfs([item(file, 1)], {
      outputName: 'out.pdf',
    });
    const result = await PDFDocument.load(
      new Uint8Array(await merged.arrayBuffer()),
    );
    expect(result.getAuthor()).toBeUndefined();
    expect(result.getSubject()).toBeUndefined();
  });

  it('reports progress once per source file', async () => {
    const a = item(await makePdf([101], 'a.pdf'), 1);
    const b = item(await makePdf([201], 'b.pdf'), 1);
    const seen: string[] = [];
    await mergePdfs([a, b], {
      outputName: 'out.pdf',
      onProgress: (p) => seen.push(`${p.done}/${p.total}`),
    });
    expect(seen).toEqual(['1/2', '2/2']);
  });

  it('skips items with an unparseable range instead of failing the merge', async () => {
    const a = item(await makePdf([101], 'a.pdf'), 1);
    const b = item(await makePdf([201], 'b.pdf'), 1, 'nonsense');
    const merged = await mergePdfs([a, b], { outputName: 'out.pdf' });
    expect(await widthsOf(merged)).toEqual([101]);
  });

  it('refuses to produce an empty document', async () => {
    await expect(mergePdfs([], { outputName: 'out.pdf' })).rejects.toMatchObject(
      { code: 'merge_failed' },
    );
  });
});
