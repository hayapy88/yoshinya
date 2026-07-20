import { Link } from 'react-router'
import { useLocale } from '~/i18n/locale'

export function SiteFooter() {
  const { locale, t } = useLocale()

  return (
    <footer className="border-t border-[#d9d7de] dark:border-[#3a3841]">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-[color:var(--muted,#6f6b78)]">
        <p className="m-0">{t.footer.copyright(new Date().getFullYear())}</p>
        <nav className="flex flex-wrap gap-4">
          <Link
            to={`/${locale}/privacy`}
            className="text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {t.footer.privacy}
          </Link>
          <Link
            to={`/${locale}/terms`}
            className="text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {t.footer.terms}
          </Link>
          <a
            href={t.site.xUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {t.footer.followX}
          </a>
        </nav>
      </div>
    </footer>
  )
}
