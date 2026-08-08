import { describe, expect, it } from 'vitest'
import { compareSize, formatBytes, formatPercent, totalComparison } from './format'

describe('formatBytes', () => {
  it('scales through the units', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})

describe('compareSize', () => {
  it('reports a saving', () => {
    const result = compareSize(1000, 250)
    expect(result.savedBytes).toBe(750)
    expect(result.percent).toBe(75)
    expect(result.grew).toBe(false)
  })

  it('reports growth honestly instead of clamping to zero', () => {
    // Re-encoding an optimised JPEG at a higher quality really does grow it,
    // and hiding that would mislead someone into shipping a bigger file.
    const result = compareSize(1000, 1120)
    expect(result.savedBytes).toBe(-120)
    expect(result.percent).toBeCloseTo(-12)
    expect(result.grew).toBe(true)
  })

  it('survives a zero-byte source without dividing by zero', () => {
    expect(compareSize(0, 0).percent).toBe(0)
  })
})

describe('formatPercent', () => {
  it('prints the magnitude, leaving the direction to the caller', () => {
    expect(formatPercent(67.4)).toBe('67%')
    expect(formatPercent(-12)).toBe('12%')
  })
})

describe('totalComparison', () => {
  const item = (size: number, out: number | null) => ({
    sourceFile: { size },
    outputBlob: out === null ? null : ({ size: out } as Blob),
  })

  it('adds up only the images that produced an output', () => {
    // A queued or failed image has no result yet, and counting its source
    // would understate the saving.
    const result = totalComparison([item(1000, 400), item(2000, 600), item(5000, null)])
    expect(result.before).toBe(3000)
    expect(result.after).toBe(1000)
    expect(result.percent).toBeCloseTo(66.7, 1)
  })

  it('is empty before anything has been processed', () => {
    expect(totalComparison([item(1000, null)])).toMatchObject({ before: 0, after: 0 })
  })
})
