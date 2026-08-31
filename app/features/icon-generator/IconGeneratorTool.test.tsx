/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router';
import { LocaleProvider } from '~/i18n/LocaleContext';
import type { Locale } from '~/i18n/locale';
import IconGeneratorTool from './IconGeneratorTool';
import { ICONS } from './lib/icon-data';
import { STORAGE_KEY } from './lib/settings';

// The shared guide below the tool links to the other tools, so the component
// needs a router context.
function renderTool(locale: Locale = 'en') {
  return render(
    <MemoryRouter>
      <LocaleProvider locale={locale}>
        <IconGeneratorTool />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

function grid(): HTMLElement {
  const list = document.querySelector('.ig-grid');
  if (!(list instanceof HTMLElement)) {
    throw new Error('icon grid not found');
  }
  return list;
}

function cards(): HTMLElement[] {
  return Array.from(grid().querySelectorAll('.ig-card'));
}

beforeEach(() => {
  localStorage.clear();
});

describe('IconGeneratorTool', () => {
  it('shows every icon in the set', () => {
    renderTool();
    expect(cards()).toHaveLength(ICONS.length);
    expect(screen.getByText(`${ICONS.length} icons`)).toBeInTheDocument();
  });

  it('narrows the grid by search and puts it back', () => {
    renderTool();
    const search = screen.getByRole('searchbox');


    // The two folders, plus the briefcase, which Lucide tags as one.
    fireEvent.change(search, { target: { value: 'folder' } });
    expect(cards()).toHaveLength(3);
    expect(within(grid()).getByText('Folder')).toBeInTheDocument();
    expect(within(grid()).getByText('Open folder')).toBeInTheDocument();

    fireEvent.change(search, { target: { value: '' } });
    expect(cards()).toHaveLength(ICONS.length);
  });

  it('finds an icon by a keyword its name does not contain', () => {
    renderTool();
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'envelope' },
    });
    expect(within(grid()).getByText('Mail')).toBeInTheDocument();
  });

  it('offers a way out when nothing matches', () => {
    renderTool();
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'zzzz' },
    });
    expect(document.querySelector('.ig-grid')).toBeNull();
    expect(screen.getByText('No icon matches that.')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Clear the search' }));
    expect(cards()).toHaveLength(ICONS.length);
  });

  it('narrows the grid by category', () => {
    renderTool();
    fireEvent.click(screen.getByRole('button', { name: 'Arrows' }));
    expect(cards()).toHaveLength(
      ICONS.filter((icon) => icon.category === 'arrow').length,
    );
  });

  // The point of the tool: the change has to reach every icon, not just the
  // preview, or there is no way to see how a set will look together.
  it('recolours the preview and the whole grid at once', () => {
    renderTool();
    fireEvent.change(screen.getByRole('textbox', { name: 'Colour' }), {
      target: { value: '#fb713c' },
    });

    const recoloured = document.querySelectorAll('g[stroke="#fb713c"]');
    // Every card plus the preview.
    expect(recoloured).toHaveLength(ICONS.length + 1);
  });

  it('keeps a half-typed colour from wiping the current one', () => {
    renderTool();
    const hex = screen.getByRole('textbox', { name: 'Colour' });
    fireEvent.change(hex, { target: { value: '#1' } });
    expect(document.querySelectorAll('g[stroke="#000000"]').length).toBe(
      ICONS.length + 1,
    );
    expect(screen.getAllByText('Enter a colour like #1a2b3c.').length).toBe(1);
  });

  it('adds a background only when one is chosen', () => {
    renderTool();
    expect(document.querySelector('.ig-preview-icon rect')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Rounded square' }));
    expect(document.querySelector('.ig-preview-icon rect')).not.toBeNull();
  });

  it('counts what will be exported as icons are selected', () => {
    renderTool();
    expect(
      screen.getByRole('button', { name: 'Download as a ZIP' }),
    ).toBeDisabled();
    expect(screen.getByText('Tick at least one icon above.')).toBeVisible();

    const [first, second] = cards();
    fireEvent.click(within(first).getByRole('checkbox'));
    fireEvent.click(within(second).getByRole('checkbox'));

    expect(screen.getByText('2 icons selected')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Download 2 files as a ZIP' }),
    ).toBeEnabled();
  });

  it('multiplies the file count by the PNG sizes', () => {
    renderTool();
    fireEvent.click(within(cards()[0]).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('checkbox', { name: 'PNG' }));
    fireEvent.click(screen.getByRole('checkbox', { name: '32' }));

    // One SVG plus two PNG sizes.
    expect(
      screen.getByRole('button', { name: 'Download 3 files as a ZIP' }),
    ).toBeInTheDocument();
  });

  it('blocks the export when neither format is ticked', () => {
    renderTool();
    fireEvent.click(within(cards()[0]).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('checkbox', { name: 'SVG' }));

    expect(
      screen.getByRole('button', { name: 'Download as a ZIP' }),
    ).toBeDisabled();
    expect(screen.getByText('Choose SVG, PNG, or both.')).toBeVisible();
  });

  it('selects and clears the whole grid', () => {
    renderTool();
    fireEvent.click(screen.getByRole('button', { name: 'Select all' }));
    expect(
      screen.getByText(`${ICONS.length} icons selected`),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear the selection' }));
    expect(screen.queryByText(/icons selected/)).not.toBeInTheDocument();
  });

  it('remembers the look and restores it next time', () => {
    const first = renderTool();
    fireEvent.change(screen.getByRole('textbox', { name: 'Colour' }), {
      target: { value: '#162e64' },
    });
    expect(localStorage.getItem(STORAGE_KEY)).toContain('#162e64');
    first.unmount();

    renderTool();
    expect(document.querySelectorAll('g[stroke="#162e64"]').length).toBe(
      ICONS.length + 1,
    );
  });

  // localStorage survives deploys, so a value from an older build must not be
  // able to leave the tool in a state it cannot draw.
  it('ignores saved settings that make no sense', () => {
    localStorage.setItem(STORAGE_KEY, '{"style":{"color":"not a colour"}}');
    renderTool();
    expect(document.querySelectorAll('g[stroke="#000000"]').length).toBe(
      ICONS.length + 1,
    );
  });

  it('credits the icon set it ships', () => {
    renderTool();
    const credit = screen.getByRole('link', {
      name: 'Icons: Lucide (ISC License)',
    });
    expect(credit).toHaveAttribute('href', 'https://lucide.dev');
  });

  it('renders in Japanese too', () => {
    renderTool('ja');
    expect(
      screen.getByRole('heading', { level: 1, name: 'よしにゃにアイコン作成' }),
    ).toBeInTheDocument();
    expect(within(grid()).getByText('フォルダ')).toBeInTheDocument();
  });
});
