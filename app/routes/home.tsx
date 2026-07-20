import { Link } from 'react-router'
import { useLocale } from '~/i18n/locale'

export default function Home() {
  const { locale, t } = useLocale()

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t.home.primary}</h1>
      <p className="mt-3 text-[color:var(--muted,#6f6b78)]">
        {t.home.supporting}
      </p>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">{t.home.toolsHeading}</h2>
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
