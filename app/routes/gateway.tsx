import { Link, redirect } from 'react-router'
import type { Route } from './+types/gateway'
import {
  LOCALE_COOKIE,
  isLocale,
  storeLocaleChoice,
  type Locale,
} from '~/i18n/locale'
import { OGP_IMAGE, SITE_ORIGIN, X_HANDLE, isProductionHost } from '~/lib/seo'

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

export function meta({ matches }: Route.MetaArgs) {
  const rootData = matches[0]?.loaderData
  const description =
    'よしにゃ — 面倒なことは、よしにゃに。 / YOSHINYA — handy browser tools, a new one every week.'
  return [
    { title: 'YOSHINYA｜よしにゃ' },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: `${SITE_ORIGIN}/` },
    { tagName: 'link', rel: 'alternate', hrefLang: 'ja', href: `${SITE_ORIGIN}/ja` },
    { tagName: 'link', rel: 'alternate', hrefLang: 'en', href: `${SITE_ORIGIN}/en` },
    { tagName: 'link', rel: 'alternate', hrefLang: 'x-default', href: `${SITE_ORIGIN}/` },
    { property: 'og:site_name', content: 'YOSHINYA' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'YOSHINYA｜よしにゃ' },
    { property: 'og:description', content: description },
    { property: 'og:url', content: `${SITE_ORIGIN}/` },
    { property: 'og:image', content: OGP_IMAGE },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: 'よしにゃ YOSHINYA' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: X_HANDLE },
    { name: 'twitter:image', content: OGP_IMAGE },
    ...(isProductionHost(rootData?.host)
      ? []
      : [{ name: 'robots', content: 'noindex, nofollow' }]),
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
      <img
        src="/brand/img_yoshinyan-structured-data-512.png"
        alt="よしにゃん / Yoshinyan"
        width={512}
        height={512}
        className="h-24 w-24"
      />
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
            className="group relative block rounded-2xl border border-[#d9d7de] p-6 no-underline transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong dark:border-[#3a3841]"
          >
            {option.locale === recommended && (
              <span className="absolute -top-3 right-4 rounded-full bg-navy px-3 py-0.5 text-xs font-semibold text-white">
                {option.locale === 'ja' ? 'おすすめ' : 'Recommended'}
              </span>
            )}
            <span className="block text-xl font-bold text-[color:var(--text)]">
              {option.brand}
            </span>
            <span className="mt-1 block text-sm text-[color:var(--muted,#6f6b78)]">
              {option.message}
            </span>
            <span className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-navy-strong transition-colors group-hover:bg-brand-strong">
              {option.action}
            </span>
          </Link>
        ))}
      </div>
    </main>
  )
}
