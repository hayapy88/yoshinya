import type { Locale } from '~/i18n/locale'

export type LegalSection = {
  heading: string
  body: string[]
}

export type LegalDocument = {
  title: string
  // ISO date of the last revision, shown on the page.
  updated: string
  updatedLabel: string
  intro: string[]
  sections: LegalSection[]
}

export type LocalizedLegalDocument = Record<Locale, LegalDocument>
