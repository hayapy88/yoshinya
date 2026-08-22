import type { MetaDescriptor } from 'react-router'
import type { Locale } from '~/i18n/locale'

export const SITE_ORIGIN = 'https://yoshinya.com'
export const PRODUCTION_HOSTS = ['yoshinya.com', 'www.yoshinya.com']
export const X_HANDLE = '@yoshinya_com'
export const OGP_IMAGE = `${SITE_ORIGIN}/brand/ogp/ogp-default.png`
export const BRAND_ICON = `${SITE_ORIGIN}/brand/yoshinyan-face-512.png`

export function isProductionHost(host: string | undefined): boolean {
  return host !== undefined && PRODUCTION_HOSTS.includes(host)
}

type PageMetaArgs = {
  locale: Locale
  // Path without the locale prefix, e.g. '' or '/file-renamer'.
  path: string
  title: string
  description: string
  // Preview/staging hosts set this to keep non-production URLs unindexed.
  noindex?: boolean
  // Tool slug for a per-tool OGP image at
  // /brand/ogp/ogp-<slug>-<locale>.png. Falls back to the shared image.
  ogImageSlug?: string
  jsonLd?: Record<string, unknown>[]
}

// Builds the full head for a localized page: title, description,
// self-referencing canonical, hreflang alternates (ja / en / x-default → the
// root, which redirects to the visitor's language), Open Graph, and X/Twitter
// card metadata.
export function pageMeta({
  locale,
  path,
  title,
  description,
  noindex = false,
  ogImageSlug,
  jsonLd = [],
}: PageMetaArgs): MetaDescriptor[] {
  const canonical = `${SITE_ORIGIN}/${locale}${path}`
  const ogImage = ogImageSlug
    ? `${SITE_ORIGIN}/brand/ogp/ogp-${ogImageSlug}-${locale}.png`
    : OGP_IMAGE

  return [
    { title },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: canonical },
    {
      tagName: 'link',
      rel: 'alternate',
      hrefLang: 'ja',
      href: `${SITE_ORIGIN}/ja${path}`,
    },
    {
      tagName: 'link',
      rel: 'alternate',
      hrefLang: 'en',
      href: `${SITE_ORIGIN}/en${path}`,
    },
    {
      tagName: 'link',
      rel: 'alternate',
      hrefLang: 'x-default',
      href: `${SITE_ORIGIN}/`,
    },
    { property: 'og:site_name', content: 'YOSHINYA' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:locale', content: locale === 'ja' ? 'ja_JP' : 'en_US' },
    {
      property: 'og:locale:alternate',
      content: locale === 'ja' ? 'en_US' : 'ja_JP',
    },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: 'よしにゃ YOSHINYA' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: X_HANDLE },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: ogImage },
    ...(noindex ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
    ...jsonLd.map((data) => ({ 'script:ld+json': data })),
  ]
}

export function websiteJsonLd(locale: Locale): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: locale === 'ja' ? 'よしにゃ' : 'YOSHINYA',
    alternateName: locale === 'ja' ? 'YOSHINYA' : 'よしにゃ',
    url: `${SITE_ORIGIN}/${locale}`,
    inLanguage: locale,
    image: BRAND_ICON,
  }
}

function toolJsonLd(
  locale: Locale,
  name: string,
  path: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url: `${SITE_ORIGIN}/${locale}${path}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    inLanguage: locale,
    image: BRAND_ICON,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: locale === 'ja' ? 'JPY' : 'USD',
    },
  }
}

export function fileRenamerJsonLd(locale: Locale): Record<string, unknown> {
  return toolJsonLd(
    locale,
    locale === 'ja' ? 'よしにゃにファイルリネーム' : 'File Renamer by Yoshinya',
    '/file-renamer',
  )
}

export function imageSorterJsonLd(locale: Locale): Record<string, unknown> {
  return toolJsonLd(
    locale,
    locale === 'ja' ? 'よしにゃに画像仕分け' : 'Image Sorter by Yoshinya',
    '/image-sorter',
  )
}

export function pdfTitleEditorJsonLd(locale: Locale): Record<string, unknown> {
  return toolJsonLd(
    locale,
    locale === 'ja'
      ? 'よしにゃにPDFタイトル変更'
      : 'PDF Title Editor by Yoshinya',
    '/pdf-title-editor',
  )
}

export function imageCompressorJsonLd(locale: Locale): Record<string, unknown> {
  return toolJsonLd(
    locale,
    locale === 'ja'
      ? 'よしにゃにまとめて画像圧縮'
      : 'Batch Image Compressor by Yoshinya',
    '/image-compressor',
  )
}

export function csvEncodingFixerJsonLd(
  locale: Locale,
): Record<string, unknown> {
  return toolJsonLd(
    locale,
    locale === 'ja'
      ? 'よしにゃにCSV文字化け修復'
      : 'CSV Encoding Fixer by Yoshinya',
    '/csv-encoding-fixer',
  )
}

// Only ever call this with questions and answers that are also rendered on the
// page — structured data that is not visible is a manual-action risk.
export function faqJsonLd(
  faq: readonly { question: string; answer: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  }
}

export function breadcrumbJsonLd(
  locale: Locale,
  trail: { name: string; path: string }[],
): Record<string, unknown> {
  const home = {
    '@type': 'ListItem',
    position: 1,
    name: locale === 'ja' ? 'よしにゃ' : 'YOSHINYA',
    item: `${SITE_ORIGIN}/${locale}`,
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      home,
      ...trail.map((entry, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: entry.name,
        item: `${SITE_ORIGIN}/${locale}${entry.path}`,
      })),
    ],
  }
}
