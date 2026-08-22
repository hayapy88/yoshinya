import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
  useRouteLoaderData,
} from 'react-router';

import type { Route } from './+types/root';
import { isProductionHost } from '~/lib/seo';
import { isLocale } from '~/i18n/locale';
import './app.css';

// GA4 measurement id. Overridable via VITE_GA4_ID (build-time); defaults to the
// site's property. Analytics only loads on the production domain so preview
// deployments and local development never pollute the measurement data.
//
// Loaded directly rather than through Tag Manager: with no one outside the repo
// needing to add tags, keeping the configuration in code means it is reviewable,
// versioned, and visible to whoever reads this file — and it is one script
// lighter, since a Tag Manager container loads this same library on top of
// itself. See docs/analytics.md.
const GA4_ID =
  (import.meta.env.VITE_GA4_ID as string | undefined) ?? 'G-5M9ZWGZJ0J';

function analyticsEnabled(host: string | undefined): boolean {
  return GA4_ID.length > 0 && isProductionHost(host);
}

function AnalyticsScripts() {
  // The stub half of the standard snippet must come first and must be inline:
  // it defines the queue that gtag() writes into, so an event fired before the
  // library finishes downloading is replayed rather than dropped.
  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA4_ID}');`,
        }}
      />
    </>
  );
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
];

// Exposes the request host so page meta functions can mark non-production
// deployments (workers.dev previews, local dev) as noindex.
export function loader({ request }: Route.LoaderArgs) {
  return { host: new URL(request.url).host };
}

// Fallback document head. Every real page exports its own meta (which takes
// precedence), so this only surfaces on error/404 pages, giving them a valid
// title and keeping them out of the search index.
export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Page not found | YOSHINYA' },
    { name: 'robots', content: 'noindex' },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  // Routes under /:locale expose their locale via handle so the html lang
  // attribute always matches the page language. Non-localized routes (the
  // redirects and 404) fall back to "en".
  const matches = useMatches();
  const localeMatch = matches.find(
    (match) =>
      typeof match.handle === 'object' &&
      match.handle !== null &&
      'locale' in match.handle,
  );
  // Only trust the locale param when it is actually a supported locale;
  // otherwise (e.g. a 404 like /foobar matching :locale) fall back to English
  // so the html lang attribute is always a valid BCP 47 code.
  const lang = isLocale(localeMatch?.params.locale)
    ? localeMatch.params.locale
    : 'en';

  const rootData = useRouteLoaderData('root') as { host?: string } | undefined;
  const showAnalytics = analyticsEnabled(rootData?.host);

  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {showAnalytics && <AnalyticsScripts />}
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found. / お探しのページは見つかりませんでした。'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
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
  );
}
