/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router';
import { LocaleProvider } from '~/i18n/LocaleContext';
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
