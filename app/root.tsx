import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from 'react-router'

import type { Route } from './+types/root'
import './app.css'

export const links: Route.LinksFunction = () => [
  { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  // Routes under /:locale expose their locale via handle so the html lang
  // attribute always matches the page language. The gateway defaults to "en".
  const matches = useMatches()
  const localeMatch = matches.find(
    (match) =>
      typeof match.handle === 'object' &&
      match.handle !== null &&
      'locale' in match.handle,
  )
  const lang =
    localeMatch && typeof localeMatch.params.locale === 'string'
      ? localeMatch.params.locale
      : 'en'

  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404
        ? 'The requested page could not be found. / お探しのページは見つかりませんでした。'
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="error-page">
      <h1>{message}</h1>
      <p>{details}</p>
      <p>
        <a href="/">YOSHINYA — yoshinya.com</a>
      </p>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
