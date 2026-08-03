import { useEffect } from 'react'
import type { Route } from './+types/image-sorter'
import { dictionaries, isLocale } from '~/i18n/locale'
import {
  breadcrumbJsonLd,
  faqJsonLd,
  imageSorterJsonLd,
  isProductionHost,
  pageMeta,
} from '~/lib/seo'
import { track } from '~/lib/analytics'
import ImageSorterTool from '~/features/image-sorter/ImageSorterTool'

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const t = dictionaries[locale]
  const rootData = matches[0]?.loaderData
  return pageMeta({
    locale,
    path: '/image-sorter',
    title: t.imageSorterPage.metaTitle,
    description: t.imageSorterPage.metaDescription,
    noindex: !isProductionHost(rootData?.host),
    ogImageSlug: 'image-sorter',
    jsonLd: [
      imageSorterJsonLd(locale),
      // Mirrors the FAQ rendered below the tool, as required for FAQPage.
      faqJsonLd(t.imageSorterGuide.faq),
      breadcrumbJsonLd(locale, [
        { name: t.imageSorterPage.toolName, path: '/image-sorter' },
      ]),
    ],
  })
}

export default function ImageSorterPage() {
  useEffect(() => {
    track('tool_opened', { tool: 'image-sorter' })
  }, [])

  return <ImageSorterTool />
}
