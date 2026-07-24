import { Link, useLocation } from 'react-router'
import { otherLocale, storeLocaleChoice, useLocale } from '~/i18n/locale'
import { track } from '~/lib/analytics'

export function SiteHeader() {
  const { locale, t } = useLocale()
  const location = useLocation()
  const target = otherLocale(locale)
  // Switch languages on the equivalent page, not the homepage.
  const switchPath = location.pathname.replace(
    /^\/(ja|en)(?=\/|$)/,
    `/${target}`,
  )

  return (
    <header className="border-b border-[#d9d7de] dark:border-[#3a3841]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          to={`/${locale}`}
          className="no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong"
        >
          <img
            src="/brand/logo-yoshinya.png"
            alt={t.site.brand}
            width={720}
            height={174}
            className="h-8 w-auto dark:hidden"
          />
          <img
            src="/brand/logo-yoshinya-dark.png"
            alt={t.site.brand}
            width={720}
            height={174}
            className="hidden h-8 w-auto dark:block"
          />
        </Link>
        <Link
          to={switchPath}
          lang={target}
          hrefLang={target}
          title={t.nav.switchLocaleTitle}
          aria-label={t.nav.switchLocaleTitle}
          onClick={() => {
            storeLocaleChoice(target)
            track('language_changed', { to: target })
          }}
          className="rounded-lg border border-[#d9d7de] px-3 py-1.5 text-sm text-[color:var(--text)] no-underline transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong dark:border-[#3a3841]"
        >
          {t.nav.switchLocale}
        </Link>
      </div>
    </header>
  )
}
