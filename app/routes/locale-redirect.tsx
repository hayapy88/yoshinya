import { redirect } from 'react-router'
import type { Route } from './+types/locale-redirect'
import { negotiateLocale } from '~/i18n/locale'

// Redirects a locale-less page path (e.g. /file-renamer) to the same page under
// the visitor's negotiated locale (/ja/file-renamer or /en/file-renamer). Uses
// a temporary redirect because the destination depends on the visitor.
export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const locale = negotiateLocale(request)
  throw redirect(`/${locale}${url.pathname}${url.search}`)
}

export default function LocaleRedirect() {
  return null
}
