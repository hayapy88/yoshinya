/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LocaleProvider } from '~/i18n/LocaleContext';
import type { ImageItem, SortingState } from '../lib/types';
import { SortingView } from './SortingView';

function img(id: string): ImageItem {
  return {
    id,
    file: new File(['x'], `${id}.jpg`, { type: 'image/png' }),
    name: `${id}.jpg`,
    mimeType: 'image/png',
    previewUrl: `blob:${id}`,
    folderId: null,
    error: false,
  };
}

function baseState(): SortingState {
  return {
    images: [img('a'), img('b')],
    folders: [
      { id: 'f1', name: 'Main', order: 0 },
      { id: 'f2', name: 'Detail', order: 1 },
    ],
    currentIndex: 0,
    history: [],
  };
}

function renderSorting(
  overrides: Partial<Parameters<typeof SortingView>[0]> = {},
) {
  const props = {
    state: baseState(),
    onSort: vi.fn(),
    onRepeatLast: vi.fn(),
    onNav: vi.fn(),
    onUndo: vi.fn(),
    onReview: vi.fn(),
    onSkipCurrent: vi.fn(),
    onImageError: vi.fn(),
    ...overrides,
  };
  render(
    <LocaleProvider locale="en">
      <SortingView {...props} />
    </LocaleProvider>,
  );
  return props;
}

describe('SortingView keyboard shortcuts', () => {
  it('sorts into the matching folder on a number key', () => {
    const { onSort } = renderSorting();
    fireEvent.keyDown(window, { key: '1' });
    expect(onSort).toHaveBeenCalledWith('f1');
    fireEvent.keyDown(window, { key: '2' });
    expect(onSort).toHaveBeenCalledWith('f2');
  });

  it('ignores number keys beyond the number of folders', () => {
    const { onSort } = renderSorting();
    fireEvent.keyDown(window, { key: '3' });
    expect(onSort).not.toHaveBeenCalled();
  });

  it('repeats the last sort on Space', () => {
    const { onRepeatLast } = renderSorting();
    fireEvent.keyDown(window, { key: ' ' });
    expect(onRepeatLast).toHaveBeenCalled();
  });

  it('navigates with the arrow keys', () => {
    const { onNav } = renderSorting();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(onNav).toHaveBeenCalledWith(1);
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(onNav).toHaveBeenCalledWith(-1);
  });

  it('undoes on Backspace and Cmd/Ctrl+Z', () => {
    const { onUndo } = renderSorting();
    fireEvent.keyDown(window, { key: 'Backspace' });
    fireEvent.keyDown(window, { key: 'z', metaKey: true });
    expect(onUndo).toHaveBeenCalledTimes(2);
  });

  it('does not fire shortcuts while typing in a field', () => {
    const { onSort } = renderSorting();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    fireEvent.keyDown(input, { key: '1' });
    expect(onSort).not.toHaveBeenCalled();
    input.remove();
  });

  it('shows the current filename and progress', () => {
    renderSorting();
    expect(screen.getByText('a.jpg')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });
});
