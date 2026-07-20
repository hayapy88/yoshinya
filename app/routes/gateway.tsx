import { Link, redirect } from 'react-router'
import type { Route } from './+types/gateway'
import {
  LOCALE_COOKIE,
  isLocale,
  storeLocaleChoice,
  type Locale,
} from '~/i18n/locale'

// Language gateway. Visitors who already made an explicit choice (cookie) are
// sent straight to their language. Everyone else sees both options, with the
// browser language used only as a recommendation — never a forced redirect.
export function loader({ request }: Route.LoaderArgs) {
  const cookies = request.headers.get('cookie') ?? ''
  const stored = new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=(\\w+)`).exec(
    cookies,
  )?.[1]
  if (isLocale(stored)) {
    throw redirect(`/${stored}`)
  }

  const acceptLanguage = request.headers.get('accept-language') ?? ''
  const firstTag = acceptLanguage.split(',')[0]?.trim().toLowerCase() ?? ''
  const recommended: Locale = firstTag.startsWith('ja') ? 'ja' : 'en'
  return { recommended }
}

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'YOSHINYA｜よしにゃ' },
    {
      name: 'description',
      content:
        'よしにゃ — 面倒なことは、よしにゃに。 / YOSHINYA — handy browser tools, a new one every week.',
    },
  ]
}

const OPTIONS: {
  locale: Locale
  brand: string
  message: string
  action: string
}[] = [
  {
    locale: 'ja',
    brand: 'よしにゃ',
    message: '面倒なことは、よしにゃに。',
    action: '日本語で続ける',
  },
  {
    locale: 'en',
    brand: 'YOSHINYA',
    message: 'Let Yoshinya handle the little hassles.',
    action: 'Continue in English',
  },
]

export default function Gateway({ loaderData }: Route.ComponentProps) {
  const { recommended } = loaderData

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-10 px-4 py-16">
      <h1 className="text-center">
        <span className="block text-4xl font-bold tracking-wide">よしにゃ</span>
        <span className="mt-2 block text-lg font-semibold tracking-[0.3em] text-[color:var(--muted,#6f6b78)]">
          YOSHINYA
        </span>
      </h1>
      <div className="grid w-full gap-4 sm:grid-cols-2">
        {OPTIONS.map((option) => (
          <Link
            key={option.locale}
            to={`/${option.locale}`}
            lang={option.locale}
            hrefLang={option.locale}
            onClick={() => storeLocaleChoice(option.locale)}
            className="group relative block rounded-2xl border border-[#d9d7de] p-6 no-underline transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:border-[#3a3841]"
          >
            {option.locale === recommended && (
              <span className="absolute -top-3 right-4 rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-white">
                {option.locale === 'ja' ? 'おすすめ' : 'Recommended'}
              </span>
            )}
            <span className="block text-xl font-bold text-[color:var(--text)]">
              {option.brand}
            </span>
            <span className="mt-1 block text-sm text-[color:var(--muted,#6f6b78)]">
              {option.message}
            </span>
            <span className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-brand-strong">
              {option.action}
            </span>
          </Link>
        ))}
      </div>
    </main>
  )
}
