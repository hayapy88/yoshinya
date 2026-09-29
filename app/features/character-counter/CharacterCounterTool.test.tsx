/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router';
import { LocaleProvider } from '~/i18n/LocaleContext';
import type { Locale } from '~/i18n/locale';
import CharacterCounterTool from './CharacterCounterTool';

// The shared guide below the tool links to the other tools, so the component
// needs a router context.
function renderTool(locale: Locale = 'en') {
  return render(
    <MemoryRouter>
      <LocaleProvider locale={locale}>
        <CharacterCounterTool />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

function type(text: string) {
  fireEvent.change(screen.getByLabelText('Text to count'), {
    target: { value: text },
  });
}

/** The number shown on the tile with this label. */
function tile(label: string): string {
  const found = screen
    .getAllByText(label)
    .map((node) => node.parentElement)
    .find((parent) => parent?.classList.contains('cc-tile'));
  if (!found) {
    throw new Error(`no tile labelled ${label}`);
  }
  return found.querySelector('.cc-tile-value')?.textContent ?? '';
}

function detail(rowHeading: string): string {
  const row = screen.getByRole('row', { name: new RegExp(rowHeading) });
  return within(row).getAllByRole('cell')[0].textContent ?? '';
}

function target(name: string): HTMLElement {
  const bar = screen.getByRole('progressbar', { name });
  const card = bar.closest('.cc-target');
  if (!(card instanceof HTMLElement)) {
    throw new Error(`no target card for ${name}`);
  }
  return card;
}

describe('CharacterCounterTool', () => {
  it('starts at zero', () => {
    renderTool();
    expect(tile('Characters')).toBe('0');
    expect(tile('Words')).toBe('0');
    expect(tile('Lines')).toBe('0');
  });

  it('counts as you type', () => {
    renderTool();
    type('Hello world');
    expect(tile('Characters')).toBe('11');
    expect(tile('Characters (no spaces)')).toBe('10');
    expect(tile('Words')).toBe('2');
    expect(tile('Lines')).toBe('1');
    expect(tile('Paragraphs')).toBe('1');
  });

  it('counts an emoji as one character, not as its code points', () => {
    renderTool();
    type('👨‍👩‍👧');
    expect(tile('Characters')).toBe('1');
  });

  it('separates the counts by thousands', () => {
    renderTool();
    type('a'.repeat(1500));
    expect(tile('Characters')).toBe('1,500');
  });

  it('shows the detail rows', () => {
    renderTool();
    type('こんにちは');
    expect(detail('Wide and narrow')).toBe('5 wide / 0 narrow');
    // Japanese weighs 2 each on X.
    expect(detail('X weighted length')).toBe('10');
    expect(detail('Manuscript pages')).toBe('1 sheets (1 rows)');
    expect(detail('UTF-8 bytes')).toBe('15');
  });

  it('counts manuscript rows per line rather than dividing by 400', () => {
    renderTool();
    type(Array.from({ length: 100 }, () => 'あ').join('\n'));
    expect(detail('Manuscript pages')).toBe('5 sheets (100 rows)');
  });

  it('shows what is left of a limit and flags going over', () => {
    renderTool();
    type('あ'.repeat(100));
    const x = target('X post');
    expect(x).toHaveTextContent('200 / 280');
    expect(x).toHaveTextContent('80 left');
    expect(x.className).not.toContain('cc-target-over');

    type('あ'.repeat(150));
    expect(target('X post')).toHaveTextContent('20 over');
    expect(target('X post').className).toContain('cc-target-over');
  });

  it('keeps the half in a full-width-equivalent limit', () => {
    renderTool();
    type('a'.repeat(61));
    expect(target('Title tag')).toHaveTextContent('30.5 / 30');
  });

  it('clears the text', () => {
    renderTool();
    type('something');
    const clear = screen.getByRole('button', { name: 'Clear the text' });
    expect(clear).toBeEnabled();
    fireEvent.click(clear);
    expect(screen.getByLabelText('Text to count')).toHaveValue('');
    expect(tile('Characters')).toBe('0');
    expect(clear).toBeDisabled();
  });

  it('copies the counts', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderTool();
    type('Hello world');
    fireEvent.click(screen.getByRole('button', { name: 'Copy the counts' }));
    expect(writeText).toHaveBeenCalledWith(
      'Characters: 11\nCharacters (no spaces): 10\nWords: 2\nLines: 1',
    );
    expect(
      await screen.findByRole('button', { name: 'Copied' }),
    ).toBeInTheDocument();
  });

  it('renders the Japanese page with its own copy', () => {
    renderTool('ja');
    expect(
      screen.getByRole('heading', {
        name: 'よしにゃに文字数カウント',
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'カウントをコピー' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Xのポスト' })).toBeVisible();
  });
});
