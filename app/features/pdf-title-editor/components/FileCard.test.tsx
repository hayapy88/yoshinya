/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { FileCard } from './FileCard'
import { LocaleContext } from '~/i18n/locale'
import { en } from '~/i18n/en'
import { withField, withOutputName } from '../lib/edits'
import type { PdfItem, PdfMetadataForm } from '../lib/types'

const metadata = (over: Partial<PdfMetadataForm> = {}): PdfMetadataForm => ({
  title: 'Original',
  author: '',
  subject: '',
  keywords: [],
  ...over,
})

const item = (over: Partial<PdfItem> = {}): PdfItem => {
  const original = over.originalMetadata ?? metadata()
  return {
    id: 'a',
    sourceFile: new File([], 'a.pdf'),
    originalFileName: 'a.pdf',
    outputFileName: 'a.pdf',
    size: 2048,
    pageCount: 2,
    originalMetadata: original,
    editedMetadata: original,
    status: 'ready',
    ...over,
  }
}

function renderCard(value: PdfItem, props: Partial<Parameters<typeof FileCard>[0]> = {}) {
  render(
    <LocaleContext.Provider value={{ locale: 'en', t: en }}>
      <ul>
        <FileCard
          item={value}
          disabled={false}
          showCreate
          onField={vi.fn()}
          onOutputName={vi.fn()}
          onReset={vi.fn()}
          onRemove={vi.fn()}
          onCreate={vi.fn()}
          {...props}
        />
      </ul>
    </LocaleContext.Provider>,
  )
}

const markers = () => screen.queryAllByRole('img', { name: 'Changed' })

describe('FileCard change markers', () => {
  it('shows no marker on an untouched file', () => {
    renderCard(item())
    expect(markers()).toHaveLength(0)
  })

  it('marks the title label when the title changed', () => {
    renderCard(withField(item(), 'title', 'New'))
    const label = screen.getByText('New PDF title')
    expect(within(label).getByRole('img', { name: 'Changed' })).toBeVisible()
    expect(markers()).toHaveLength(1)
  })

  it('marks the download filename label independently', () => {
    renderCard(withOutputName(item(), 'renamed.pdf'))
    const label = screen.getByText('Download as')
    expect(within(label).getByRole('img', { name: 'Changed' })).toBeVisible()
  })

  it('repeats the marker on the collapsed section when a hidden field changed', () => {
    renderCard(withField(item(), 'author', 'Yoshinya'))
    // One on the Author label, one on the "Other metadata" summary.
    expect(markers()).toHaveLength(2)
    const summary = screen.getByText('Other metadata')
    expect(within(summary).getByRole('img', { name: 'Changed' })).toBeVisible()
  })

  it('does not mark the collapsed section for a title-only change', () => {
    renderCard(withField(item(), 'title', 'New'))
    const summary = screen.getByText('Other metadata')
    expect(within(summary).queryByRole('img', { name: 'Changed' })).toBeNull()
  })
})

describe('FileCard create button', () => {
  it('is hidden when this is the only file', () => {
    renderCard(item(), { showCreate: false })
    expect(
      screen.queryByRole('button', { name: 'Create this one' }),
    ).toBeNull()
  })

  it('is shown when there are several files', () => {
    renderCard(item())
    expect(
      screen.getByRole('button', { name: 'Create this one' }),
    ).toBeVisible()
  })

  it('is not offered for a file that failed to load', () => {
    renderCard(
      item({ status: 'error', errorCode: 'corrupted', editedMetadata: undefined }),
    )
    expect(screen.queryByRole('button', { name: 'Create this one' })).toBeNull()
    expect(
      screen.getByText('This PDF could not be read. The file may be corrupted.'),
    ).toBeVisible()
  })
})
