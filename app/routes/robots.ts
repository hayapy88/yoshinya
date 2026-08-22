import type { Route } from './+types/robots';
import { SITE_ORIGIN, isProductionHost } from '~/lib/seo';

// Production allows crawling; preview/staging hosts are fully disallowed.
export function loader({ request }: Route.LoaderArgs) {
  const host = new URL(request.url).host;
  const body = isProductionHost(host)
    ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
