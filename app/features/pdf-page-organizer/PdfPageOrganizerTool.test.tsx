/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router';
import { PDFDocument, degrees } from 'pdf-lib';
import { LocaleProvider } from '~/i18n/LocaleContext';
import type { Locale } from '~/i18n/locale';

// pdf.js needs a real canvas and a worker, neither of which jsdom has, so the
// drawing half is stubbed here and covered by app/lib/pdf/render.test.ts and
// the e2e suite. What these tests are for is the editing: what the grid shows,
// what the buttons do to it, and when saving is allowed at all.
const renderPage = vi.fn(async (index: number) => ({
  url: `data:image/png;base64,page-${index}`,
  size: { width: 160, height: 226 },
}));
const destroy = vi.fn();

vi.mock('~/lib/pdf/render', () => ({
  RenderError: class RenderError extends Error {},
  createRenderer: vi.fn(async (bytes: Uint8Array) => ({
    pageCount: bytes.length,
    renderPage,
    destroy,
  })),
}));

const PdfPageOrganizerTool = (await import('./PdfPageOrganizerTool')).default;

function renderTool(locale: Locale = 'en') {
  return render(
    <MemoryRouter>
      <LocaleProvider locale={locale}>
        <PdfPageOrganizerTool />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

async function makePdf(pages = 4, rotations: number[] = []): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i += 1) {
    const page = doc.addPage([100 + i, 200]);
    const angle = rotations[i];
    if (angle !== undefined) {
      page.setRotation(degrees(angle));
    }
  }
  const bytes = await doc.save();
  return new File([bytes as BlobPart], 'report.pdf', {
    type: 'application/pdf',
  });
}

function fileInput(): HTMLInputElement {
  const input = document.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('file input not found');
  }
  return input;
}

async function openPdf(file: File) {
  fireEvent.change(fileInput(), { target: { files: [file] } });
  await waitFor(() =>
    expect(document.querySelectorAll('.ppo-card').length).toBeGreaterThan(0),
  );
}

function cards(): HTMLElement[] {
  return Array.from(document.querySelectorAll('.ppo-card'));
}

function positions(): string[] {
  return Array.from(document.querySelectorAll('.ppo-source')).map(
    (node) => node.textContent ?? '',
  );
}

function selectCard(index: number, options?: { shiftKey: boolean }) {
  const card = cards()[index]!;
  fireEvent.click(within(card).getByRole('button', { name: /Select page/ }), {
    shiftKey: options?.shiftKey ?? false,
  });
}

beforeEach(() => {
  renderPage.mockClear();
  destroy.mockClear();
});

describe('PdfPageOrganizerTool', () => {
  it('shows a card per page, numbered from the original document', async () => {
    renderTool();
    await openPdf(await makePdf(3));
    expect(cards()).toHaveLength(3);
    expect(positions()).toEqual([
      'Originally page 1',
      'Originally page 2',
      'Originally page 3',
    ]);
    expect(screen.getByText(/3 pages,/)).toBeInTheDocument();
  });

  it('selects a run of pages with shift-click', async () => {
    renderTool();
    await openPdf(await makePdf(4));
    selectCard(0);
    selectCard(2, { shiftKey: true });
    expect(screen.getByText('3 pages selected')).toBeInTheDocument();
  });

  it('deletes the selected pages and keeps the numbering of the rest', async () => {
    renderTool();
    await openPdf(await makePdf(4));
    selectCard(1);
    fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }));
    expect(cards()).toHaveLength(3);
    expect(positions()).toEqual([
      'Originally page 1',
      'Originally page 3',
      'Originally page 4',
    ]);
  });

  it('puts a deletion back with undo, and takes it away again with redo', async () => {
    renderTool();
    await openPdf(await makePdf(3));
    selectCard(0);
    fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }));
    expect(cards()).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(cards()).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(cards()).toHaveLength(2);
  });

  it('keeps only the selected pages', async () => {
    renderTool();
    await openPdf(await makePdf(5));
    selectCard(1);
    selectCard(3);
    fireEvent.click(screen.getByRole('button', { name: 'Keep selected only' }));
    expect(positions()).toEqual(['Originally page 2', 'Originally page 4']);
  });

  it('reorders with the move buttons', async () => {
    renderTool();
    await openPdf(await makePdf(3));
    fireEvent.click(
      within(cards()[0]!).getByRole('button', { name: 'Move forward' }),
    );
    expect(positions()).toEqual([
      'Originally page 2',
      'Originally page 1',
      'Originally page 3',
    ]);
  });

  it('disables moving back on the first card and forward on the last', async () => {
    renderTool();
    await openPdf(await makePdf(2));
    expect(
      within(cards()[0]!).getByRole('button', { name: 'Move back' }),
    ).toBeDisabled();
    expect(
      within(cards()[1]!).getByRole('button', { name: 'Move forward' }),
    ).toBeDisabled();
  });

  it('says how many pages the single output will have', async () => {
    renderTool();
    await openPdf(await makePdf(4));
    selectCard(0);
    fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }));
    expect(screen.getByText('4 pages → 3 pages.')).toBeInTheDocument();
  });

  it('stops at an empty document rather than saving nothing', async () => {
    renderTool();
    await openPdf(await makePdf(2));
    fireEvent.click(screen.getByRole('button', { name: 'Select all' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }));
    expect(cards()).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
  });

  it('will not split until something is actually cut', async () => {
    renderTool();
    await openPdf(await makePdf(4));
    fireEvent.click(
      screen.getByRole('radio', { name: 'Save as separate files (zip)' }),
    );
    expect(
      screen.getByRole('button', { name: 'Download as zip' }),
    ).toBeDisabled();
    expect(
      screen.getByText('Nothing is cut yet, so this would save one file.'),
    ).toBeInTheDocument();

    fireEvent.click(
      within(cards()[2]!).getByRole('button', {
        name: 'Cut before this page',
      }),
    );
    expect(screen.getByText('2 files (1-2 / 3-4).')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Download as zip' }),
    ).toBeEnabled();
  });

  it('refuses a pages-per-file value that is not a whole page', async () => {
    renderTool();
    await openPdf(await makePdf(4));
    fireEvent.click(
      screen.getByRole('radio', { name: 'Save as separate files (zip)' }),
    );
    fireEvent.change(screen.getByLabelText('Where to cut'), {
      target: { value: 'every-n' },
    });
    fireEvent.change(screen.getByLabelText('Pages per file'), {
      target: { value: '0' },
    });
    expect(
      screen.getByText(
        'Pages per file has to be a whole number of at least 1.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Download as zip' }),
    ).toBeDisabled();
  });

  it('splits every page into its own file at a size of one', async () => {
    renderTool();
    await openPdf(await makePdf(3));
    fireEvent.click(
      screen.getByRole('radio', { name: 'Save as separate files (zip)' }),
    );
    fireEvent.change(screen.getByLabelText('Where to cut'), {
      target: { value: 'every-n' },
    });
    expect(screen.getByText('3 files (1 / 2 / 3).')).toBeInTheDocument();
  });

  it('discloses a form rather than refusing the file', async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    doc.getForm().createTextField('applicant.name');
    const bytes = await doc.save();
    renderTool();
    await openPdf(
      new File([bytes as BlobPart], 'form.pdf', { type: 'application/pdf' }),
    );
    expect(
      screen.getByText(
        'This PDF has form fields. They will not survive editing.',
      ),
    ).toBeInTheDocument();
    expect(cards()).toHaveLength(1);
  });

  it('explains a password-protected file instead of failing silently', async () => {
    renderTool();
    const encrypted = new File(
      [new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])],
      'locked.pdf',
      { type: 'application/pdf' },
    );
    fireEvent.change(fileInput(), { target: { files: [encrypted] } });
    await waitFor(() =>
      expect(
        screen.getByText('This PDF could not be read.'),
      ).toBeInTheDocument(),
    );
  });

  it('names the output after the file that was opened', async () => {
    renderTool();
    await openPdf(await makePdf(2));
    expect(screen.getByLabelText('File name')).toHaveValue('report.pdf');
  });

  it('works in Japanese too', async () => {
    renderTool('ja');
    await openPdf(await makePdf(2));
    expect(screen.getByText('元の1ページ目')).toBeInTheDocument();
    expect(screen.getByText('未選択')).toBeInTheDocument();
  });
});
