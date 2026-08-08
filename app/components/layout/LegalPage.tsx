import type { LocalizedLegalDocument } from '~/legal/types'
import { useLocale } from '~/i18n/locale'

// One shared renderer for both legal pages in both languages.
export function LegalPage({ content }: { content: LocalizedLegalDocument }) {
  const { locale } = useLocale()
  const doc = content[locale]

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12">
      <div className="max-w-3xl">
      <h1 className="text-3xl font-bold">{doc.title}</h1>
      <p className="mt-2 text-sm text-[color:var(--muted,#6f6b78)]">
        {doc.updatedLabel}
      </p>
      {doc.intro.map((paragraph) => (
        <p key={paragraph} className="mt-4">
          {paragraph}
        </p>
      ))}
      {doc.sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="text-xl font-semibold">{section.heading}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph} className="mt-3">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      </div>
    </main>
  )
}
