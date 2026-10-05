/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router';
import { LocaleProvider } from '~/i18n/LocaleContext';
import { ja } from '~/i18n/ja';
import { dictionaries, type Locale } from '~/i18n/locale';
import { faqJsonLd } from '~/lib/seo';
import { ToolGuide } from './ToolGuide';
import { TOOL_SLUGS } from './types';

// The guides quote button names with *asterisks*. Before ToolGuide interpreted
// them, every marker was printed on the page exactly as written — visible in
// the English guides of six shipped tools. These tests pin the two places the
// raw markers must never reach: the rendered page, and the structured data.

const GUIDE_KEY = {
  'file-renamer': 'fileRenamerGuide',
  'image-sorter': 'imageSorterGuide',
  'pdf-title-editor': 'pdfTitleEditorGuide',
  'image-compressor': 'imageCompressorGuide',
  'csv-encoding-fixer': 'csvEncodingFixerGuide',
  'split-bill': 'splitBillGuide',
  'icon-generator': 'iconGeneratorGuide',
  'pdf-merger': 'pdfMergerGuide',
  'pdf-page-organizer': 'pdfPageOrganizerGuide',
  'structured-data-generator': 'structuredDataGeneratorGuide',
  'character-counter': 'characterCounterGuide',
  'qr-code-generator': 'qrCodeGeneratorGuide',
} as const;

function renderGuide(slug: keyof typeof GUIDE_KEY, locale: Locale) {
  return render(
    <MemoryRouter>
      <LocaleProvider locale={locale}>
        <ToolGuide
          guide={dictionaries[locale][GUIDE_KEY[slug]]}
          current={slug}
        />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe.each(['en', 'ja'] as const)('%s guides', (locale) => {
  it.each(TOOL_SLUGS)('%s never prints a marker on the page', (slug) => {
    const { container, unmount } = renderGuide(slug, locale);
    expect(container.textContent).not.toContain('*');
    unmount();
  });

  it.each(TOOL_SLUGS)(
    '%s keeps markers out of the FAQ structured data',
    (slug) => {
      const jsonLd = faqJsonLd(dictionaries[locale][GUIDE_KEY[slug]].faq);
      expect(JSON.stringify(jsonLd)).not.toContain('*');
    },
  );
});

describe('an FAQ answer with illustrations', () => {
  it('shows both examples, with the alt text of each', () => {
    renderGuide('qr-code-generator', 'ja');
    expect(
      screen.getByAltText(
        'ネイビーのQRコードの中央によしにゃんのロゴが入った作成例',
      ),
    ).toHaveAttribute('src', '/examples/qr-code-yoshinya-logo-ja.png');
    expect(
      screen.getByAltText(
        'ネイビーのQRコードの中央に「よしにゃ」の文字が入った作成例',
      ),
    ).toHaveAttribute('src', '/examples/qr-code-yoshinya-text-ja.png');
  });

  it('shows each locale its own examples, which link to its own pages', () => {
    const { unmount } = renderGuide('qr-code-generator', 'en');
    for (const image of screen.getAllByRole('img')) {
      expect(image.getAttribute('src')).toContain('-en.png');
    }
    unmount();

    renderGuide('qr-code-generator', 'ja');
    for (const image of screen.getAllByRole('img')) {
      expect(image.getAttribute('src')).toContain('-ja.png');
    }
  });

  it('loads them lazily, below the fold as they are', () => {
    renderGuide('qr-code-generator', 'ja');
    for (const image of screen.getAllByRole('img')) {
      expect(image).toHaveAttribute('loading', 'lazy');
    }
  });

  it('keeps the pictures out of the FAQ structured data', () => {
    // schema.org answers are text; a picture there would describe the page as
    // something it is not.
    const jsonLd = JSON.stringify(faqJsonLd(ja.qrCodeGeneratorGuide.faq));
    expect(jsonLd).not.toContain('/examples/');
  });
});

describe('emphasis rendering', () => {
  it('sets the quoted button name in bold', () => {
    renderGuide('pdf-merger', 'en');
    const bold = screen.getAllByText('Merge and download');
    expect(bold.length).toBeGreaterThan(0);
    expect(bold[0]!.tagName).toBe('STRONG');
  });

  it('sets the Japanese button name in bold, brackets included', () => {
    renderGuide('pdf-merger', 'ja');
    const bold = screen.getAllByText('「結合してダウンロード」');
    expect(bold.length).toBeGreaterThan(0);
    expect(bold[0]!.tagName).toBe('STRONG');
  });
});
