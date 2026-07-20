import { Link } from 'react-router'
import type { Route } from './+types/home'
import { dictionaries, isLocale, useLocale } from '~/i18n/locale'
import { isProductionHost, pageMeta, websiteJsonLd } from '~/lib/seo'

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const t = dictionaries[locale]
  const rootData = matches[0]?.loaderData
  return pageMeta({
    locale,
    path: '',
    title: t.home.metaTitle,
    description: t.home.metaDescription,
    noindex: !isProductionHost(rootData?.host),
    jsonLd: [websiteJsonLd(locale)],
  })
}

export default function Home() {
  const { locale, t } = useLocale()

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <section aria-labelledby="hero-heading">
        <p className="text-sm font-semibold tracking-[0.25em] text-brand uppercase">
          {t.site.brand}
        </p>
        <h1 id="hero-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
          {t.home.primary}
        </h1>
        <p className="mt-4 text-[color:var(--muted,#6f6b78)]">
          {t.home.supporting}
        </p>
        <p className="mt-2 text-sm text-[color:var(--muted,#6f6b78)]">
          {t.home.privacyNote}
        </p>
      </section>

      <section aria-labelledby="tools-heading" className="mt-12">
        <h2 id="tools-heading" className="text-xl font-semibold">
          {t.home.toolsHeading}
        </h2>
        <Link
          to={`/${locale}/file-renamer`}
          className="mt-4 block rounded-2xl border border-[#d9d7de] p-6 no-underline transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:border-[#3a3841]"
        >
          <span className="block text-lg font-bold text-[color:var(--text)]">
            {t.fileRenamerPage.toolName}
          </span>
          <span className="mt-1 block text-sm text-[color:var(--muted,#6f6b78)]">
            {t.fileRenamerPage.toolDescription}
          </span>
          <span className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">
            {t.home.cta}
          </span>
        </Link>
      </section>
    </main>
  )
}
