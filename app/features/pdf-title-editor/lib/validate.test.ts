import { describe, expect, it } from 'vitest'
import { classifyFiles, isPdfCandidate } from './validate'
import { LIMITS } from './types'

const file = (name: string, type = 'application/pdf', size = 1024) => ({
  name,
  type,
  size,
})

let counter = 0
const makeId = () => `id-${(counter += 1)}`

describe('isPdfCandidate', () => {
  it('accepts a .pdf with the right MIME type', () => {
    expect(isPdfCandidate(file('a.pdf'))).toBe(true)
  })

  it('accepts a .pdf with an empty MIME type, which some drop sources send', () => {
    expect(isPdfCandidate(file('a.pdf', ''))).toBe(true)
  })

  it('is case-insensitive about the extension', () => {
    expect(isPdfCandidate(file('A.PDF'))).toBe(true)
  })

  it('rejects a non-pdf extension', () => {
    expect(isPdfCandidate(file('a.docx'))).toBe(false)
  })

  it('rejects a .pdf whose MIME type contradicts it', () => {
    expect(isPdfCandidate(file('a.pdf', 'image/png'))).toBe(false)
  })
})

describe('classifyFiles', () => {
  const empty = { count: 0, bytes: 0 }

  it('separates accepted from rejected and explains why', () => {
    const result = classifyFiles(
      [file('a.pdf'), file('b.txt'), file('c.pdf')],
      empty,
      makeId,
    )
    expect(result.accepted.map((f) => f.name)).toEqual(['a.pdf', 'c.pdf'])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]?.errorCode).toBe('not_pdf')
  })

  it('rejects a zero-byte file', () => {
    const result = classifyFiles(
      [file('a.pdf', 'application/pdf', 0)],
      empty,
      makeId,
    )
    expect(result.rejected[0]?.errorCode).toBe('empty_file')
  })

  it('rejects a file over the per-file limit', () => {
    const result = classifyFiles(
      [file('a.pdf', 'application/pdf', LIMITS.maxFileBytes + 1)],
      empty,
      makeId,
    )
    expect(result.rejected[0]?.errorCode).toBe('file_too_large')
  })

  it('counts already-loaded files toward the file-count limit', () => {
    const result = classifyFiles(
      [file('a.pdf')],
      { count: LIMITS.maxFiles, bytes: 0 },
      makeId,
    )
    expect(result.rejected[0]?.errorCode).toBe('too_many_files')
  })

  it('accumulates sizes across the batch so a drop cannot pass in aggregate', () => {
    // Room for exactly one more full-size file: the first fits, the next byte
    // does not.
    const result = classifyFiles(
      [
        file('a.pdf', 'application/pdf', LIMITS.maxFileBytes),
        file('b.pdf', 'application/pdf', 1),
      ],
      { count: 0, bytes: LIMITS.maxTotalBytes - LIMITS.maxFileBytes },
      makeId,
    )
    expect(result.accepted.map((f) => f.name)).toEqual(['a.pdf'])
    expect(result.rejected[0]?.errorCode).toBe('total_too_large')
  })
})
