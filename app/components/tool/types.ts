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

// Slugs of the tools that exist, used to build the related-tools list.
export type ToolSlug = 'file-renamer' | 'image-sorter' | 'pdf-title-editor'

export const TOOL_SLUGS: ToolSlug[] = [
  'file-renamer',
  'image-sorter',
  'pdf-title-editor',
]
