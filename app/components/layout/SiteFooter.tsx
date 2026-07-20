import { useLocale } from '~/i18n/locale'

export function SiteFooter() {
  const { t } = useLocale()

  return (
    <footer className="border-t border-[#d9d7de] dark:border-[#3a3841]">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-[color:var(--muted,#6f6b78)]">
        <p className="m-0">{t.footer.copyright(new Date().getFullYear())}</p>
        <nav className="flex flex-wrap gap-4">
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
