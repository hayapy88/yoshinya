import { useEffect } from 'react'
import type { Route } from './+types/image-compressor'
import { dictionaries, isLocale } from '~/i18n/locale'
import {
  breadcrumbJsonLd,
  faqJsonLd,
  imageCompressorJsonLd,
  isProductionHost,
  pageMeta,
} from '~/lib/seo'
import { track } from '~/lib/analytics'
import ImageCompressorTool from '~/features/image-compressor/ImageCompressorTool'

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const t = dictionaries[locale]
  const rootData = matches[0]?.loaderData
  return pageMeta({
    locale,
    path: '/image-compressor',
    title: t.imageCompressorPage.metaTitle,
    description: t.imageCompressorPage.metaDescription,
    noindex: !isProductionHost(rootData?.host),
    ogImageSlug: 'image-compressor',
    jsonLd: [
      imageCompressorJsonLd(locale),
      // Mirrors the FAQ rendered below the tool, as required for FAQPage.
      faqJsonLd(t.imageCompressorGuide.faq),
      breadcrumbJsonLd(locale, [
        { name: t.imageCompressorPage.toolName, path: '/image-compressor' },
      ]),
    ],
  })
}

export default function ImageCompressorPage() {
  useEffect(() => {
    track('tool_opened', { tool: 'image-compressor' })
  }, [])

  return <ImageCompressorTool />
}
