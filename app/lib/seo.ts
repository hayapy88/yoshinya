import type { MetaDescriptor } from 'react-router'
import type { Locale } from '~/i18n/locale'

export const SITE_ORIGIN = 'https://yoshinya.com'
export const PRODUCTION_HOSTS = ['yoshinya.com', 'www.yoshinya.com']
export const X_HANDLE = '@yoshinya_com'

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
  jsonLd?: Record<string, unknown>[]
}

// Builds the full head for a localized page: title, description,
// self-referencing canonical, hreflang alternates (ja / en / x-default →
// language gateway), Open Graph, and X/Twitter card metadata.
export function pageMeta({
  locale,
  path,
  title,
  description,
  noindex = false,
  jsonLd = [],
}: PageMetaArgs): MetaDescriptor[] {
  const canonical = `${SITE_ORIGIN}/${locale}${path}`

  return [
    { title },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: canonical },
    { tagName: 'link', rel: 'alternate', hrefLang: 'ja', href: `${SITE_ORIGIN}/ja${path}` },
    { tagName: 'link', rel: 'alternate', hrefLang: 'en', href: `${SITE_ORIGIN}/en${path}` },
    { tagName: 'link', rel: 'alternate', hrefLang: 'x-default', href: `${SITE_ORIGIN}/` },
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
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:site', content: X_HANDLE },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
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
  }
}

export function fileRenamerJsonLd(locale: Locale): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name:
      locale === 'ja' ? 'よしにゃにファイルリネーム' : 'File Renamer by Yoshinya',
    url: `${SITE_ORIGIN}/${locale}/file-renamer`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    inLanguage: locale,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: locale === 'ja' ? 'JPY' : 'USD',
    },
  }
}
