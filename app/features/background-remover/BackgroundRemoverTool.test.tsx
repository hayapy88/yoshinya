/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router';
import { LocaleProvider } from '~/i18n/LocaleContext';
import type { Locale } from '~/i18n/locale';
import BackgroundRemoverTool from './BackgroundRemoverTool';
import { STORAGE_KEY } from './lib/settings';

// The shared guide below the tool links to the other tools, so the component
// needs a router context.
function renderTool(locale: Locale = 'en') {
  return render(
    <MemoryRouter>
      <LocaleProvider locale={locale}>
        <BackgroundRemoverTool />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  window.localStorage.clear();
});

describe('BackgroundRemoverTool', () => {
  it('starts with the drop zone and the default settings', () => {
    renderTool();
    expect(
      screen.getByRole('button', {
        name: /Drop images here, or click to choose/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', {
        name: /Only the background around the edges/,
      }),
    ).toBeChecked();
    expect(screen.getByRole('slider', { name: /Tolerance/ })).toHaveValue('12');
    expect(screen.getByLabelText('Smooth the edges')).toBeChecked();
    expect(
      screen.getByRole('button', { name: 'Reset to the defaults' }),
    ).toBeDisabled();
  });

  it('lists a file it cannot use, with the reason', () => {
    renderTool();
    fireEvent.change(screen.getByTestId('br-file-input'), {
      target: {
        files: [
          new File(['%PDF'], 'contract.pdf', { type: 'application/pdf' }),
        ],
      },
    });
    expect(screen.getByText('contract.pdf')).toBeInTheDocument();
    expect(
      screen.getByText('Not a JPEG, PNG or WebP image.'),
    ).toBeInTheDocument();
  });

  it('remembers the settings, and only the settings', () => {
    const { unmount } = renderTool();
    fireEvent.click(
      screen.getByRole('radio', { name: /That colour everywhere/ }),
    );
    fireEvent.change(screen.getByRole('slider', { name: /Tolerance/ }), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByLabelText('Smooth the edges'));
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toEqual({
      mode: 'global',
      tolerance: 30,
      smoothEdges: false,
    });
    unmount();

    renderTool();
    expect(
      screen.getByRole('radio', { name: /That colour everywhere/ }),
    ).toBeChecked();
    expect(screen.getByRole('slider', { name: /Tolerance/ })).toHaveValue('30');
    expect(
      screen.getByText(/Your last settings have been restored/),
    ).toBeInTheDocument();
  });

  it('resets to the defaults', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mode: 'global', tolerance: 40, smoothEdges: false }),
    );
    renderTool();
    fireEvent.click(
      screen.getByRole('button', { name: 'Reset to the defaults' }),
    );
    expect(screen.getByRole('slider', { name: /Tolerance/ })).toHaveValue('12');
    expect(screen.getByLabelText('Smooth the edges')).toBeChecked();
  });

  it('renders in Japanese', () => {
    renderTool('ja');
    expect(
      screen.getByRole('heading', { level: 1, name: 'よしにゃに背景透過' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '② 消し方を調整' }),
    ).toBeVisible();
  });
});
