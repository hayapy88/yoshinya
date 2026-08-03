import { describe, expect, it } from 'vitest'
import { en } from './en'
import { ja } from './ja'
import type { Dictionary } from './locale'

// The guides tell people which buttons to press. When a label is reworded, the
// guide silently becomes wrong — nothing else in the suite would notice, and a
// user following stale instructions looks for a control that is not there.
// These tests pin every button name a guide quotes to the string the UI
// actually renders.

function guideText(dictionary: Dictionary, key: keyof Dictionary): string {
  const guide = dictionary[key] as {
    sections: {
      body?: string
      steps?: string[]
      items?: string[]
      terms?: { definition: string }[]
    }[]
    faq: { answer: string }[]
  }
  const parts: string[] = []
  for (const section of guide.sections) {
    if (section.body) parts.push(section.body)
    parts.push(...(section.steps ?? []), ...(section.items ?? []))
    parts.push(...(section.terms ?? []).map((t) => t.definition))
  }
  parts.push(...guide.faq.map((entry) => entry.answer))
  return parts.join('\n')
}

describe.each([
  ['en', en],
  ['ja', ja],
])('%s guides quote labels the UI actually renders', (_locale, t) => {
  it('file renamer names the download button correctly', () => {
    const text = guideText(t, 'fileRenamerGuide')
    expect(text).toContain(t.download.confirm)
  })

  it('file renamer names its tokens correctly', () => {
    const text = guideText(t, 'fileRenamerGuide')
    for (const token of [
      t.tokens.text,
      t.tokens.separator,
      t.tokens.date,
      t.tokens.time,
      t.tokens.index,
      t.tokens.dimensions,
    ]) {
      expect(text).toContain(token)
    }
  })

  it('image sorter names the buttons it tells people to press', () => {
    const text = guideText(t, 'imageSorterGuide')
    for (const label of [
      t.imageSorter.startSorting,
      t.imageSorter.goToReview,
      t.imageSorter.download,
      t.imageSorter.unsortedLabel,
    ]) {
      expect(text).toContain(label)
    }
  })

  it('pdf title editor names the buttons it tells people to press', () => {
    const text = guideText(t, 'pdfTitleEditorGuide')
    for (const label of [
      t.pdfTitleEditor.otherMetadata,
      t.pdfTitleEditor.batchHeading,
      t.pdfTitleEditor.createAndDownload,
      t.pdfTitleEditor.createAll,
    ]) {
      expect(text).toContain(label)
    }
  })
})

describe('every guide has the same shape in both locales', () => {
  const keys = [
    'fileRenamerGuide',
    'imageSorterGuide',
    'pdfTitleEditorGuide',
  ] as const

  it.each(keys)('%s has matching section and FAQ counts', (key) => {
    const enGuide = en[key]
    const jaGuide = ja[key]
    expect(jaGuide.sections).toHaveLength(enGuide.sections.length)
    expect(jaGuide.faq).toHaveLength(enGuide.faq.length)
  })

  it.each(keys)('%s carries the five common sections', (key) => {
    // Tool-specific sections may come first; the shared ones always close it.
    const headings = en[key].sections.map((section) => section.heading)
    expect(headings.slice(-3)).toEqual([
      'How to use the tool',
      'When is it useful?',
      'Privacy and security',
    ])
    expect(en[key].faqHeading).toBe('Frequently asked questions')
    expect(en[key].relatedHeading).toBe('Related tools')
  })
})
