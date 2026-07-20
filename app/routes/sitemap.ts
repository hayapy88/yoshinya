import type { Route } from './+types/sitemap'
import { SITE_ORIGIN } from '~/lib/seo'

// Localized page paths (without the locale prefix). Add new tools here.
const PATHS = ['', '/file-renamer', '/privacy', '/terms']

function urlEntry(path: string): string {
  const ja = `${SITE_ORIGIN}/ja${path}`
  const en = `${SITE_ORIGIN}/en${path}`
  const alternates = [
    `    <xhtml:link rel="alternate" hreflang="ja" href="${ja}"/>`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${en}"/>`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}/"/>`,
  ].join('\n')
  return [ja, en]
    .map((loc) => `  <url>\n    <loc>${loc}</loc>\n${alternates}\n  </url>`)
    .join('\n')
}

export function loader(_: Route.LoaderArgs) {
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    `  <url>\n    <loc>${SITE_ORIGIN}/</loc>\n  </url>`,
    ...PATHS.map(urlEntry),
    '</urlset>',
    '',
  ].join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
