import { useEffect } from 'react'
import type { Route } from './+types/file-renamer'
import { dictionaries, isLocale } from '~/i18n/locale'
import {
  breadcrumbJsonLd,
  faqJsonLd,
  fileRenamerJsonLd,
  isProductionHost,
  pageMeta,
} from '~/lib/seo'
import { track } from '~/lib/analytics'
import FileRenamerTool from '~/features/file-renamer/FileRenamerTool'

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const t = dictionaries[locale]
  const rootData = matches[0]?.loaderData
  return pageMeta({
    locale,
    path: '/file-renamer',
    title: t.fileRenamerPage.metaTitle,
    description: t.fileRenamerPage.metaDescription,
    noindex: !isProductionHost(rootData?.host),
    ogImageSlug: 'file-renamer',
    jsonLd: [
      fileRenamerJsonLd(locale),
      // Mirrors the FAQ rendered below the tool, as required for FAQPage.
      faqJsonLd(t.fileRenamerGuide.faq),
      breadcrumbJsonLd(locale, [
        { name: t.fileRenamerPage.toolName, path: '/file-renamer' },
      ]),
    ],
  })
}

export default function FileRenamerPage() {
  useEffect(() => {
    track('tool_opened', { tool: 'file-renamer' })
  }, [])

  return <FileRenamerTool />
}
