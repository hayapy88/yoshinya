/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router';
import { LocaleProvider } from '~/i18n/LocaleContext';
import type { Locale } from '~/i18n/locale';
import WidthConverterTool from './WidthConverterTool';
import { STORAGE_KEY } from './lib/settings';

// The shared guide below the tool links to the other tools, so the component
// needs a router context.
function renderTool(locale: Locale = 'en') {
  return render(
    <MemoryRouter>
      <LocaleProvider locale={locale}>
        <WidthConverterTool />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

function type(text: string) {
  fireEvent.change(screen.getByLabelText('Text to convert'), {
    target: { value: text },
  });
}

function output(): HTMLElement {
  return screen.getByRole('region', { name: 'Converted text' });
}

afterEach(() => {
  window.localStorage.clear();
});

describe('WidthConverterTool', () => {
  it('converts with the default rules as soon as text arrives', () => {
    renderTool();
    type('ＡＢＣ１２３ ｶﾞｲﾄﾞ');
    expect(output()).toHaveTextContent('ABC123 ガイド');
    expect(screen.getByText('9 characters converted')).toBeInTheDocument();
  });

  it('highlights only what changed', () => {
    renderTool();
    type('値段はＡＢ円');
    const marks = output().querySelectorAll('mark');
    expect([...marks].map((mark) => mark.textContent)).toEqual(['AB']);
  });

  it('says so when nothing needs converting', () => {
    renderTool();
    type('ABC カタカナ');
    expect(
      screen.getByText(
        'Nothing to convert — the text already follows these rules.',
      ),
    ).toBeInTheDocument();
  });

  it('applies a changed rule and remembers it, but not the text', () => {
    renderTool();
    type('ABC');
    const alnum = screen.getByRole('group', { name: /Letters and digits/ });
    fireEvent.click(
      Array.from(alnum.querySelectorAll('input')).find(
        (input) => input.value === 'full',
      )!,
    );
    expect(output()).toHaveTextContent('ＡＢＣ');
    const stored = window.localStorage.getItem(STORAGE_KEY) ?? '';
    expect(JSON.parse(stored).alnum).toBe('full');
    expect(stored).not.toContain('ABC');
  });

  it('leaves listed characters alone', () => {
    renderTool();
    const symbols = screen.getByRole('group', { name: /Symbols/ });
    fireEvent.click(
      Array.from(symbols.querySelectorAll('input')).find(
        (input) => input.value === 'half',
      )!,
    );
    fireEvent.change(screen.getByLabelText('Characters to leave as they are'), {
      target: { value: '（）' },
    });
    type('（注）！');
    expect(output()).toHaveTextContent('（注）!');
  });

  it('restores stored rules after mount and resets them', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ kana: 'half' }));
    renderTool();
    type('カナ');
    expect(output()).toHaveTextContent('ｶﾅ');
    expect(
      screen.getByText(/Your last rules have been restored/),
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole('button', { name: 'Reset to the defaults' }),
    );
    expect(output()).toHaveTextContent('カナ');
    expect(
      screen.getByRole('button', { name: 'Reset to the defaults' }),
    ).toBeDisabled();
  });

  it('copies the converted text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderTool();
    type('ＡＢ');
    fireEvent.click(screen.getByRole('button', { name: 'Copy the result' }));
    expect(writeText).toHaveBeenCalledWith('AB');
    expect(
      await screen.findByRole('button', { name: 'Copied' }),
    ).toBeInTheDocument();
  });

  it('renders in Japanese', () => {
    renderTool('ja');
    fireEvent.change(screen.getByLabelText('変換する文章'), {
      target: { value: 'ｶﾞ' },
    });
    expect(screen.getByText('1文字を変換しました')).toBeInTheDocument();
  });
});
