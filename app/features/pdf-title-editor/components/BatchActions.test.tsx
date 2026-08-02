/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { BatchActions } from './BatchActions'
import { LocaleContext } from '~/i18n/locale'
import { en } from '~/i18n/en'
import type { PdfItem, PdfMetadataForm } from '../lib/types'

const metadata = (over: Partial<PdfMetadataForm> = {}): PdfMetadataForm => ({
  title: '',
  author: '',
  subject: '',
  keywords: [],
  ...over,
})

const item = (id: string, over: Partial<PdfItem> = {}): PdfItem => {
  const original = over.originalMetadata ?? metadata()
  return {
    id,
    sourceFile: new File([], `${id}.pdf`),
    originalFileName: `${id}.pdf`,
    outputFileName: `${id}.pdf`,
    size: 10,
    pageCount: 1,
    originalMetadata: original,
    editedMetadata: original,
    status: 'ready',
    ...over,
  }
}

function renderBatch(items: PdfItem[], props: Partial<Parameters<typeof BatchActions>[0]> = {}) {
  const onApply = vi.fn()
  render(
    <LocaleContext.Provider value={{ locale: 'en', t: en }}>
      <BatchActions
        items={items}
        disabled={false}
        onApply={onApply}
        onTitleFromFileName={vi.fn()}
        onFileNameFromTitle={vi.fn()}
        onResetAll={vi.fn()}
        onRemoveAll={vi.fn()}
        {...props}
      />
    </LocaleContext.Provider>,
  )
  return { onApply }
}

describe('BatchActions', () => {
  it('shows how many files a bulk action would touch', () => {
    renderBatch([item('a'), item('b')])
    expect(
      screen.getByRole('button', { name: 'Apply to 2 files' }),
    ).toBeInTheDocument()
  })

  it('counts only blank fields in "blank fields only" mode', () => {
    renderBatch([
      item('a', { originalMetadata: metadata({ author: 'Set' }) }),
      item('b'),
    ])
    fireEvent.click(screen.getByLabelText('Blank fields only'))
    expect(
      screen.getByRole('button', { name: 'Apply to 1 file' }),
    ).toBeInTheDocument()
  })

  it('excludes files that failed to load from the count', () => {
    renderBatch([
      item('a'),
      item('b', { status: 'error', errorCode: 'corrupted', editedMetadata: undefined }),
    ])
    expect(
      screen.getByRole('button', { name: 'Apply to 1 file' }),
    ).toBeInTheDocument()
  })

  it('disables apply when nothing would change', () => {
    renderBatch([
      item('a', { status: 'error', errorCode: 'corrupted', editedMetadata: undefined }),
    ])
    expect(screen.getByRole('button', { name: /Apply to/ })).toBeDisabled()
  })

  it('passes the chosen field, value, and mode to the caller', () => {
    const { onApply } = renderBatch([item('a'), item('b')])
    fireEvent.change(screen.getByLabelText('Field'), {
      target: { value: 'subject' },
    })
    fireEvent.change(screen.getByLabelText('Value'), {
      target: { value: 'Quarterly' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Apply to/ }))
    expect(onApply).toHaveBeenCalledWith('subject', 'Quarterly', 'all')
  })

  it('disables every control while a run is in progress', () => {
    renderBatch([item('a'), item('b')], { disabled: true })
    expect(
      screen.getByRole('button', { name: 'Use filename as title' }),
    ).toBeDisabled()
    expect(screen.getByLabelText('Value')).toBeDisabled()
  })
})
