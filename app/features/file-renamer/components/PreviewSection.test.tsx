/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { LocaleProvider } from '~/i18n/LocaleContext'
import type { RenameResult } from '../lib/types'
import type { LoadedFile } from './FilesSection'
import { PreviewSection } from './PreviewSection'

function loaded(name: string): LoadedFile {
  return {
    id: name,
    file: new File(['x'], name, { type: 'text/plain' }),
    previewUrl: null,
  }
}

function renderPreview(props: {
  files: LoadedFile[]
  hasTokens: boolean
  results: RenameResult[] | null
}) {
  return render(
    <LocaleProvider locale="en">
      <PreviewSection {...props} />
    </LocaleProvider>,
  )
}

describe('PreviewSection (regression)', () => {
  it('guides the user when no files are added', () => {
    renderPreview({ files: [], hasTokens: false, results: null })
    expect(screen.getByText('Add files to see the preview')).toBeInTheDocument()
  })

  it('guides the user when files exist but no rule is built', () => {
    renderPreview({ files: [loaded('a.txt')], hasTokens: false, results: null })
    expect(
      screen.getByText('Build a rename rule to see the preview'),
    ).toBeInTheDocument()
  })

  it('shows original and new names in the preview table', () => {
    renderPreview({
      files: [loaded('a.txt')],
      hasTokens: true,
      results: [
        { originalName: 'a.txt', newName: 'trip_001.txt', isDuplicate: false },
      ],
    })
    expect(screen.getByText('a.txt')).toBeInTheDocument()
    expect(screen.getByText('trip_001.txt')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('warns when the rename results contain duplicates', () => {
    renderPreview({
      files: [loaded('a.txt'), loaded('b.txt')],
      hasTokens: true,
      results: [
        { originalName: 'a.txt', newName: 'same.txt', isDuplicate: true },
        { originalName: 'b.txt', newName: 'same.txt', isDuplicate: true },
      ],
    })
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Duplicate file names will occur',
    )
  })
})
