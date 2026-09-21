/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router';
import { LocaleProvider } from '~/i18n/LocaleContext';
import type { Locale } from '~/i18n/locale';
import StructuredDataTool from './StructuredDataTool';
import { STORAGE_KEY } from './lib/storage';

// The shared guide below the tool links to the other tools, so the component
// needs a router context.
function renderTool(locale: Locale = 'en') {
  return render(
    <MemoryRouter>
      <LocaleProvider locale={locale}>
        <StructuredDataTool />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

function code(): string {
  const pre = document.querySelector('.sd-code');
  if (!(pre instanceof HTMLElement)) {
    throw new Error('code block not found');
  }
  return pre.textContent ?? '';
}

// The script tag is on by default; strip it to read the JSON back.
function parsed(): Record<string, unknown> {
  const text = code()
    .replace(/^<script[^>]*>\n/, '')
    .replace(/\n<\/script>$/, '');
  return JSON.parse(text);
}

beforeEach(() => {
  localStorage.clear();
});

describe('StructuredDataTool', () => {
  it('starts on Article with nothing but the context and type', () => {
    renderTool();
    expect(screen.getByRole('radio', { name: /^Article/ })).toBeChecked();
    expect(parsed()).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Article',
    });
  });

  it('puts typed values into the code and leaves blanks out', () => {
    renderTool();
    fireEvent.change(screen.getByLabelText(/^Headline/), {
      target: { value: 'Hello world' },
    });
    fireEvent.change(screen.getByLabelText(/^Author name/), {
      target: { value: 'Yoshinyan' },
    });
    expect(parsed()).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Hello world',
      author: { '@type': 'Person', name: 'Yoshinyan' },
    });
  });

  it('switches the form and the code when another type is chosen', () => {
    renderTool();
    fireEvent.click(screen.getByRole('radio', { name: /^FAQ page/ }));
    expect(screen.getByLabelText(/^Question/)).toBeInTheDocument();
    expect(parsed()['@type']).toBe('FAQPage');

    fireEvent.change(screen.getByLabelText(/^Question/), {
      target: { value: 'Is it free?' },
    });
    fireEvent.change(screen.getByLabelText(/^Answer/), {
      target: { value: 'Yes.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add another' }));
    expect(screen.getAllByLabelText(/^Question/)).toHaveLength(2);
    // The blank second row is not emitted.
    expect(parsed().mainEntity).toEqual([
      {
        '@type': 'Question',
        name: 'Is it free?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes.' },
      },
    ]);
  });

  it('keeps each type’s entries when switching back and forth', () => {
    renderTool();
    fireEvent.change(screen.getByLabelText(/^Headline/), {
      target: { value: 'Kept' },
    });
    fireEvent.click(screen.getByRole('radio', { name: /^Product/ }));
    expect(parsed()['@type']).toBe('Product');
    fireEvent.click(screen.getByRole('radio', { name: /^Article/ }));
    expect(parsed().headline).toBe('Kept');
  });

  it('drops the script tag when asked', () => {
    renderTool();
    expect(code()).toMatch(/^<script type="application\/ld\+json">/);
    fireEvent.click(screen.getByRole('checkbox', { name: /script/ }));
    expect(code()).toMatch(/^\{/);
  });

  it('copies the code to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderTool();
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(writeText).toHaveBeenCalledWith(code());
    expect(
      await screen.findByRole('button', { name: 'Copied' }),
    ).toBeInTheDocument();
  });

  it('remembers entries and restores them on the next visit', () => {
    const first = renderTool();
    fireEvent.change(screen.getByLabelText(/^Headline/), {
      target: { value: 'Saved' },
    });
    expect(localStorage.getItem(STORAGE_KEY)).toContain('Saved');
    first.unmount();

    renderTool();
    expect(screen.getByLabelText(/^Headline/)).toHaveValue('Saved');
    expect(screen.getByRole('status')).toHaveTextContent(/restored/);
  });

  it('clears the current form only', () => {
    renderTool();
    fireEvent.change(screen.getByLabelText(/^Headline/), {
      target: { value: 'Gone' },
    });
    fireEvent.click(screen.getByRole('radio', { name: /^Product/ }));
    fireEvent.change(screen.getByLabelText(/^Name/), {
      target: { value: 'Mug' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Clear this form' }));
    expect(screen.getByLabelText(/^Name/)).toHaveValue('');
    fireEvent.click(screen.getByRole('radio', { name: /^Article/ }));
    expect(screen.getByLabelText(/^Headline/)).toHaveValue('Gone');
  });

  it('renders the Japanese page with its own copy', () => {
    renderTool('ja');
    expect(
      screen.getByRole('heading', { name: 'よしにゃに構造化データ作成', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /^記事/ })).toBeChecked();
    expect(screen.getByRole('button', { name: 'コードをコピー' })).toBeInTheDocument();
  });
});
