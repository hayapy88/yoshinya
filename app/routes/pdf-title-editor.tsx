import { useEffect } from 'react'
import type { Route } from './+types/pdf-title-editor'
import { dictionaries, isLocale } from '~/i18n/locale'
import {
  breadcrumbJsonLd,
  faqJsonLd,
  isProductionHost,
  pageMeta,
  pdfTitleEditorJsonLd,
} from '~/lib/seo'
import { track } from '~/lib/analytics'
import PdfTitleEditorTool from '~/features/pdf-title-editor/PdfTitleEditorTool'

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const t = dictionaries[locale]
  const rootData = matches[0]?.loaderData
  return pageMeta({
    locale,
    path: '/pdf-title-editor',
    title: t.pdfTitleEditorPage.metaTitle,
    description: t.pdfTitleEditorPage.metaDescription,
    noindex: !isProductionHost(rootData?.host),
    ogImageSlug: 'pdf-title-editor',
    jsonLd: [
      pdfTitleEditorJsonLd(locale),
      // Mirrors the FAQ rendered below the tool, as required for FAQPage.
      faqJsonLd(t.pdfTitleEditorGuide.faq),
      breadcrumbJsonLd(locale, [
        { name: t.pdfTitleEditorPage.toolName, path: '/pdf-title-editor' },
      ]),
    ],
  })
}

export default function PdfTitleEditorPage() {
  useEffect(() => {
    track('tool_opened', { tool: 'pdf-title-editor' })
  }, [])

  return <PdfTitleEditorTool />
}
