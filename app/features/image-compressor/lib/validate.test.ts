import { describe, expect, it } from 'vitest'
import { classifyFiles, isSupportedImage } from './validate'
import { LIMITS } from './types'

const file = (name: string, type = 'image/jpeg', size = 1024) => ({ name, type, size })

let counter = 0
const makeId = () => `id-${(counter += 1)}`

describe('isSupportedImage', () => {
  it('accepts the three decodable formats', () => {
    expect(isSupportedImage(file('a.jpg', 'image/jpeg'))).toBe(true)
    expect(isSupportedImage(file('a.png', 'image/png'))).toBe(true)
    expect(isSupportedImage(file('a.webp', 'image/webp'))).toBe(true)
  })

  it('falls back to the extension when the drop source reports no type', () => {
    expect(isSupportedImage(file('a.png', ''))).toBe(true)
    expect(isSupportedImage(file('A.JPEG', ''))).toBe(true)
  })

  it('rejects formats that are out of scope', () => {
    // These decode in a browser but are excluded by the spec, so they must be
    // refused with a reason rather than silently mangled.
    expect(isSupportedImage(file('a.gif', 'image/gif'))).toBe(false)
    expect(isSupportedImage(file('a.svg', 'image/svg+xml'))).toBe(false)
    expect(isSupportedImage(file('a.heic', 'image/heic'))).toBe(false)
  })

  it('rejects a non-image', () => {
    expect(isSupportedImage(file('a.pdf', 'application/pdf'))).toBe(false)
  })
})

describe('classifyFiles', () => {
  const empty = { count: 0, bytes: 0 }

  it('adds what it can and explains what it refused', () => {
    const result = classifyFiles(
      [file('a.jpg'), file('b.gif', 'image/gif'), file('c.png', 'image/png')],
      empty,
      makeId,
    )
    expect(result.accepted.map((f) => f.name)).toEqual(['a.jpg', 'c.png'])
    expect(result.rejected[0]?.errorCode).toBe('unsupported_type')
  })

  it('refuses an empty file', () => {
    const result = classifyFiles([file('a.jpg', 'image/jpeg', 0)], empty, makeId)
    expect(result.rejected[0]?.errorCode).toBe('empty_file')
  })

  it('refuses a file over the per-file limit', () => {
    const result = classifyFiles(
      [file('a.jpg', 'image/jpeg', LIMITS.maxFileBytes + 1)],
      empty,
      makeId,
    )
    expect(result.rejected[0]?.errorCode).toBe('file_too_large')
  })

  it('counts images already loaded toward the file-count limit', () => {
    const result = classifyFiles([file('a.jpg')], { count: LIMITS.maxFiles, bytes: 0 }, makeId)
    expect(result.rejected[0]?.errorCode).toBe('too_many_files')
  })

  it('accumulates sizes so a batch cannot pass in aggregate', () => {
    const result = classifyFiles(
      [file('a.jpg', 'image/jpeg', LIMITS.maxFileBytes), file('b.jpg', 'image/jpeg', 1)],
      { count: 0, bytes: LIMITS.maxTotalBytes - LIMITS.maxFileBytes },
      makeId,
    )
    expect(result.accepted.map((f) => f.name)).toEqual(['a.jpg'])
    expect(result.rejected[0]?.errorCode).toBe('total_too_large')
  })

  it('never fails a whole drop because one file was bad', () => {
    const result = classifyFiles(
      [file('big.jpg', 'image/jpeg', LIMITS.maxFileBytes + 1), file('ok.jpg')],
      empty,
      makeId,
    )
    expect(result.accepted).toHaveLength(1)
    expect(result.rejected).toHaveLength(1)
  })
})
