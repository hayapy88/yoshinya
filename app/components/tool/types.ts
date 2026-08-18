// Shape every tool's guide content follows. Keeping one shape means the guide
// component, the FAQ structured data, and the dictionaries stay in step as more
// tools are added, instead of each tool inventing its own.

// A section is prose, an ordered procedure, a list of cases, or a set of terms.
// Exactly one of the content fields is set.
export type GuideSection = {
  heading: string
  body?: string
  steps?: string[]
  items?: string[]
  terms?: { term: string; definition: string }[]
}

export type FaqEntry = { question: string; answer: string }

export type ToolGuideContent = {
  heading: string
  sections: GuideSection[]
  faqHeading: string
  faq: FaqEntry[]
  relatedHeading: string
}

// Every tool slug, including any not yet finished. Analytics events and the
// slug-to-dictionary map are typed against this.
export type ToolSlug =
  | 'file-renamer'
  | 'image-sorter'
  | 'pdf-title-editor'
  | 'image-compressor'
  | 'csv-encoding-fixer'

// The published tools, in release order: what the related-tools list offers and
// what the sitemap carries. A slug is added here when its page is complete —
// linking to a tool that has no guide yet would advertise an unfinished page.
export const TOOL_SLUGS: ToolSlug[] = [
  'file-renamer',
  'image-sorter',
  'pdf-title-editor',
  'image-compressor',
  'csv-encoding-fixer',
]
