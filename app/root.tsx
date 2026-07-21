import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
  useRouteLoaderData,
} from 'react-router'

import type { Route } from './+types/root'
import { isProductionHost } from '~/lib/seo'
import './app.css'

// Google Tag Manager container id. Overridable via VITE_GTM_ID (build-time);
// defaults to the site container. GTM only loads on the production domain so
// preview deployments and local development never pollute the measurement data.
const GTM_ID = (import.meta.env.VITE_GTM_ID as string | undefined) ?? 'GTM-KGRKPV2B'

function gtmEnabled(host: string | undefined): boolean {
  return GTM_ID.length > 0 && isProductionHost(host)
}

function GtmHeadScript() {
  // The standard GTM loader snippet, injected server-side so it runs on the
  // initial page load.
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
      }}
    />
  )
}

function GtmNoScript() {
  return (
    <noscript>
      <iframe
        title="Google Tag Manager"
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  )
}

export const links: Route.LinksFunction = () => [
  { rel: 'icon', href: '/favicon.ico' },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
    href: '/favicon-32x32.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
    href: '/favicon-16x16.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '192x192',
    href: '/icons/icon-192.png',
  },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
]

// Exposes the request host so page meta functions can mark non-production
// deployments (workers.dev previews, local dev) as noindex.
export function loader({ request }: Route.LoaderArgs) {
  return { host: new URL(request.url).host }
}

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

  const rootData = useRouteLoaderData('root') as { host?: string } | undefined
  const showGtm = gtmEnabled(rootData?.host)

  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {showGtm && <GtmHeadScript />}
        <Meta />
        <Links />
      </head>
      <body>
        {showGtm && <GtmNoScript />}
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
