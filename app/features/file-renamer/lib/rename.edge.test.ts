import { describe, expect, it } from 'vitest'
import { applyRename } from './rename'
import type { RenameToken } from './types'

const NOW = new Date(2026, 6, 20, 12, 0, 0)

function textToken(value: string): RenameToken {
  return { id: `text-${value}`, kind: 'text', value }
}

const INDEX3: RenameToken = {
  id: 'idx',
  kind: 'index',
  style: { type: 'numeric', padding: 3 },
  start: 1,
}

// Edge cases from the launch checklist that were not covered elsewhere.
describe('applyRename (edge cases)', () => {
  it('returns an empty list for empty input', () => {
    expect(applyRename([], [textToken('a')], { now: NOW })).toEqual([])
  })

  it('handles Japanese file names and Japanese text tokens', () => {
    const results = applyRename(
      [{ originalName: '報告書 2026.txt', lastModified: 0 }],
      [textToken('旅行'), { id: 's', kind: 'separator', char: '_' }, INDEX3],
      { now: NOW },
    )
    expect(results[0].newName).toBe('旅行_001.txt')
    expect(results[0].originalName).toBe('報告書 2026.txt')
  })

  it('keeps only the last dot as the extension for multi-dot names', () => {
    const results = applyRename(
      [{ originalName: 'archive.backup.2026.tar.gz', lastModified: 0 }],
      [textToken('data'), INDEX3],
      { now: NOW },
    )
    expect(results[0].newName).toBe('data001.gz')
  })

  it('handles very long file names', () => {
    const longBase = 'x'.repeat(240)
    const results = applyRename(
      [{ originalName: `${longBase}.txt`, lastModified: 0 }],
      [textToken('y'.repeat(200)), INDEX3],
      { now: NOW },
    )
    expect(results[0].newName).toBe(`${'y'.repeat(200)}001.txt`)
  })

  it('handles names with special characters and no extension', () => {
    const results = applyRename(
      [
        { originalName: 'photo (1) [final] #2', lastModified: 0 },
        { originalName: '🎉 party', lastModified: 0 },
      ],
      [textToken('out'), INDEX3],
      { now: NOW },
    )
    expect(results.map((r) => r.newName)).toEqual(['out001', 'out002'])
    expect(results.every((r) => !r.isDuplicate)).toBe(true)
  })

  it('flags every duplicate in a larger batch, not just the first pair', () => {
    const results = applyRename(
      [
        { originalName: 'a.txt', lastModified: 0 },
        { originalName: 'b.txt', lastModified: 0 },
        { originalName: 'c.png', lastModified: 0 },
      ],
      [textToken('same')],
      { now: NOW },
    )
    expect(results.filter((r) => r.isDuplicate)).toHaveLength(2)
    expect(results[2].isDuplicate).toBe(false)
  })
})
