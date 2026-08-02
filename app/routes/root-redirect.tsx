import { redirect } from 'react-router'
import type { Route } from './+types/root-redirect'
import { negotiateLocale } from '~/i18n/locale'

// Sends the bare root to the visitor's language: an explicit earlier choice
// (cookie) wins, otherwise the browser's Accept-Language decides. The header
// language switcher is always one click away, so this is a starting point
// rather than a lock-in.
//
// Temporary redirect on purpose — the destination is per-visitor, and a 301
// would both pin the root to one locale for search engines and stick in the
// browser cache forever. For the same reason the response must never be shared
// by a cache: Vary lists what it depends on, and no-store keeps an edge cache
// from pinning one locale for every visitor.
export function loader({ request }: Route.LoaderArgs) {
  throw redirect(`/${negotiateLocale(request)}`, {
    headers: {
      Vary: 'Accept-Language, Cookie',
      'Cache-Control': 'private, no-store',
    },
  })
}

export default function RootRedirect() {
  return null
}
