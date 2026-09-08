/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router';
import { PDFDocument } from 'pdf-lib';
import { LocaleProvider } from '~/i18n/LocaleContext';
import type { Locale } from '~/i18n/locale';
import PdfMergerTool from './PdfMergerTool';

// The shared guide below the tool links to the other tools, so the component
// needs a router context.
function renderTool(locale: Locale = 'en') {
  return render(
    <MemoryRouter>
      <LocaleProvider locale={locale}>
        <PdfMergerTool />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

async function makePdf(name: string, pages = 2): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i += 1) {
    doc.addPage();
  }
  const bytes = await doc.save();
  return new File([bytes as BlobPart], name, { type: 'application/pdf' });
}

function fileInput(): HTMLInputElement {
  const input = document.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('file input not found');
  }
  return input;
}

async function addFiles(files: File[]) {
  fireEvent.change(fileInput(), { target: { files } });
  // Each card is parsed in turn, and the page-range field only appears once its
  // file is ready. Waiting on the class rather than the label keeps this usable
  // from the Japanese test too.
  await waitFor(() =>
    expect(document.querySelectorAll('.pdm-card .pdm-field')).toHaveLength(
      files.length,
    ),
  );
}

function cardNames(): string[] {
  return Array.from(document.querySelectorAll('.pdm-filename')).map(
    (node) => node.textContent ?? '',
  );
}

describe('PdfMergerTool', () => {
  it('lists what was added, in the order it was added', async () => {
    renderTool();
    await addFiles([await makePdf('b.pdf'), await makePdf('a.pdf')]);
    expect(cardNames()).toEqual(['b.pdf', 'a.pdf']);
    expect(screen.getByText('2 files, 4 pages')).toBeInTheDocument();
  });

  it('reorders with the up and down buttons', async () => {
    renderTool();
    await addFiles([await makePdf('a.pdf'), await makePdf('b.pdf')]);
    fireEvent.click(screen.getAllByLabelText('Move down')[0]!);
    expect(cardNames()).toEqual(['b.pdf', 'a.pdf']);
    fireEvent.click(screen.getAllByLabelText('Move up')[1]!);
    expect(cardNames()).toEqual(['a.pdf', 'b.pdf']);
  });

  it('disables the up button on the first card and down on the last', async () => {
    renderTool();
    await addFiles([await makePdf('a.pdf'), await makePdf('b.pdf')]);
    expect(screen.getAllByLabelText('Move up')[0]).toBeDisabled();
    expect(screen.getAllByLabelText('Move down')[1]).toBeDisabled();
  });

  it('sorts by name using numeric order', async () => {
    renderTool();
    await addFiles([await makePdf('10.pdf'), await makePdf('2.pdf')]);
    fireEvent.click(screen.getByRole('button', { name: 'Name order' }));
    expect(cardNames()).toEqual(['2.pdf', '10.pdf']);
  });

  it('reverses the list', async () => {
    renderTool();
    await addFiles([await makePdf('a.pdf'), await makePdf('b.pdf')]);
    fireEvent.click(screen.getByRole('button', { name: 'Reverse' }));
    expect(cardNames()).toEqual(['b.pdf', 'a.pdf']);
  });

  it('reports the page count the merge will produce', async () => {
    renderTool();
    await addFiles([await makePdf('a.pdf', 3), await makePdf('b.pdf', 2)]);
    expect(
      screen.getByText('The merged file will have 5 pages.'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getAllByLabelText('Pages to use')[0]!, {
      target: { value: '1-2' },
    });
    expect(
      screen.getByText('The merged file will have 4 pages.'),
    ).toBeInTheDocument();
  });

  it('explains what a page range resolves to', async () => {
    renderTool();
    await addFiles([await makePdf('a.pdf', 5)]);
    expect(screen.getByText('Using all pages')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Pages to use'), {
      target: { value: '2-4' },
    });
    expect(screen.getByText('Using 3 pages')).toBeInTheDocument();
  });

  it('flags a page range it cannot read and stops the merge', async () => {
    renderTool();
    await addFiles([await makePdf('a.pdf', 2)]);
    fireEvent.change(screen.getByLabelText('Pages to use'), {
      target: { value: 'nope' },
    });
    expect(
      screen.getByText('This page range cannot be read.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Merge and download' }),
    ).toBeDisabled();
  });

  it('flags a page past the end of the document', async () => {
    renderTool();
    await addFiles([await makePdf('a.pdf', 2)]);
    fireEvent.change(screen.getByLabelText('Pages to use'), {
      target: { value: '5' },
    });
    expect(
      screen.getByText('That page does not exist in this file.'),
    ).toBeInTheDocument();
  });

  it('keeps merging when only one of several ranges is broken', async () => {
    renderTool();
    await addFiles([await makePdf('a.pdf', 2), await makePdf('b.pdf', 2)]);
    fireEvent.change(screen.getAllByLabelText('Pages to use')[1]!, {
      target: { value: 'nope' },
    });
    expect(
      screen.getByRole('button', { name: 'Merge and download' }),
    ).toBeEnabled();
    expect(
      screen.getByText('The merged file will have 2 pages.'),
    ).toBeInTheDocument();
  });

  it('refuses a file that is not a PDF and says why', async () => {
    renderTool();
    const notPdf = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(fileInput(), { target: { files: [notPdf] } });
    const rejected = await screen.findByText('Files that could not be added');
    const panel = rejected.closest('.pdm-rejected');
    expect(panel).not.toBeNull();
    expect(
      within(panel as HTMLElement).getByText('notes.txt'),
    ).toBeInTheDocument();
    expect(
      within(panel as HTMLElement).getByText('Not a PDF file.'),
    ).toBeInTheDocument();
  });

  it('warns that a form will not survive the merge, without blocking it', async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    doc.getForm().createTextField('applicant.name');
    const bytes = await doc.save();
    renderTool();
    await addFiles([
      new File([bytes as BlobPart], 'form.pdf', { type: 'application/pdf' }),
    ]);
    expect(
      screen.getByText('Has form fields. They will not survive the merge.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Merge and download' }),
    ).toBeEnabled();
  });

  it('renders the Japanese labels', async () => {
    renderTool('ja');
    await addFiles([await makePdf('a.pdf', 2)]);
    expect(screen.getByText('② 順番とページを決める')).toBeInTheDocument();
    expect(screen.getByText('全ページを使用')).toBeInTheDocument();
  });
});
