/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LocaleProvider } from '~/i18n/LocaleContext';
import type { ImageItem, SortingState } from '../lib/types';
import { ReviewView } from './ReviewView';

function img(id: string, folderId: string | null): ImageItem {
  return {
    id,
    file: new File(['x'], `${id}.jpg`, { type: 'image/png' }),
    name: `${id}.jpg`,
    mimeType: 'image/png',
    previewUrl: `blob:${id}`,
    folderId,
    error: false,
  };
}

function baseState(): SortingState {
  return {
    images: [img('a', 'f1'), img('b', 'f2'), img('c', null)],
    folders: [
      { id: 'f1', name: 'Main', order: 0 },
      { id: 'f2', name: 'Detail', order: 1 },
    ],
    currentIndex: 0,
    history: [],
  };
}

function renderReview(
  overrides: Partial<Parameters<typeof ReviewView>[0]> = {},
) {
  const props = {
    state: baseState(),
    onMove: vi.fn(),
    onBackToSorting: vi.fn(),
    onDownload: vi.fn(),
    isZipping: false,
    zipError: null,
    ...overrides,
  };
  render(
    <LocaleProvider locale="en">
      <ReviewView {...props} />
    </LocaleProvider>,
  );
  return props;
}

describe('ReviewView', () => {
  it('shows every file name', () => {
    renderReview();
    expect(screen.getByText('a.jpg')).toBeInTheDocument();
    expect(screen.getByText('b.jpg')).toBeInTheDocument();
    expect(screen.getByText('c.jpg')).toBeInTheDocument();
  });

  it('groups images by folder and always shows the unsorted group', () => {
    renderReview();
    expect(screen.getByRole('heading', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Detail' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Unsorted' }),
    ).toBeInTheDocument();
  });

  it('moves the selected images to the chosen folder', () => {
    const { onMove } = renderReview();
    fireEvent.click(screen.getByText('a.jpg'));
    fireEvent.change(screen.getByLabelText('Move to…'), {
      target: { value: 'f2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Move' }));
    expect(onMove).toHaveBeenCalledWith(['a'], 'f2');
  });

  it('can move images back to unsorted', () => {
    const { onMove } = renderReview();
    fireEvent.click(screen.getByText('a.jpg'));
    fireEvent.change(screen.getByLabelText('Move to…'), {
      target: { value: '__unsorted__' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Move' }));
    expect(onMove).toHaveBeenCalledWith(['a'], null);
  });

  it('disables download until at least one image is sorted', () => {
    render(
      <LocaleProvider locale="en">
        <ReviewView
          state={{
            images: [img('c', null)],
            folders: [{ id: 'f1', name: 'Main', order: 0 }],
            currentIndex: 0,
            history: [],
          }}
          onMove={vi.fn()}
          onBackToSorting={vi.fn()}
          onDownload={vi.fn()}
          isZipping={false}
          zipError={null}
        />
      </LocaleProvider>,
    );
    expect(screen.getByRole('button', { name: 'Download zip' })).toBeDisabled();
  });
});
