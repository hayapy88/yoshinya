/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { LocaleProvider } from '~/i18n/LocaleContext'
import type { Locale } from '~/i18n/locale'
import FileRenamerTool from './FileRenamerTool'

function renderTool(locale: Locale = 'en') {
  return render(
    <LocaleProvider locale={locale}>
      <FileRenamerTool />
    </LocaleProvider>,
  )
}

function getFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('file input not found')
  }
  return input
}

// Plain text files avoid URL.createObjectURL, which jsdom does not implement.
function makeFile(name: string): File {
  return new File(['content'], name, { type: 'text/plain' })
}

describe('FileRenamerTool (regression)', () => {
  it('renders the empty state with a disabled download button', () => {
    renderTool()
    expect(
      screen.getByRole('heading', { level: 1, name: 'File Renamer by Yoshinya' }),
    ).toBeInTheDocument()
    const download = screen.getByRole('button', {
      name: 'Confirm and download',
    })
    expect(download).toBeDisabled()
    expect(
      screen.getByText('Add files to enable the download'),
    ).toBeInTheDocument()
    expect(screen.getByText('Add files to see the preview')).toBeInTheDocument()
  })

  it('renders localized Japanese labels', () => {
    renderTool('ja')
    expect(
      screen.getByRole('heading', { level: 1, name: 'よしにゃにファイルリネーム' }),
    ).toBeInTheDocument()
    expect(screen.getByText('① ファイルのアップロード')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '確認してダウンロード' }),
    ).toBeDisabled()
  })

  it('lists added files, including Japanese and dotless names', () => {
    const { container } = renderTool()
    fireEvent.change(getFileInput(container), {
      target: {
        files: [makeFile('報告書 2026.txt'), makeFile('README')],
      },
    })
    expect(screen.getByText('報告書 2026.txt')).toBeInTheDocument()
    expect(screen.getByText('README')).toBeInTheDocument()
    // Files alone are not enough: a rename rule is still required.
    expect(
      screen.getByText('Build a rename rule to enable the download'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Confirm and download' }),
    ).toBeDisabled()
  })

  it('removes a file via its remove button', () => {
    const { container } = renderTool()
    fireEvent.change(getFileInput(container), {
      target: { files: [makeFile('a.txt'), makeFile('b.txt')] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Remove a.txt' }))
    expect(screen.queryByText('a.txt')).not.toBeInTheDocument()
    expect(screen.getByText('b.txt')).toBeInTheDocument()
  })

  it('keeps the empty state after adding and removing every file', () => {
    const { container } = renderTool()
    fireEvent.change(getFileInput(container), {
      target: { files: [makeFile('only.txt')] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Remove only.txt' }))
    expect(
      screen.getByText('Add files to enable the download'),
    ).toBeInTheDocument()
  })
})
