import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/root-redirect.tsx'),
  route(':locale', 'routes/locale-layout.tsx', [
    index('routes/home.tsx'),
    route('file-renamer', 'routes/file-renamer.tsx'),
    route('image-sorter', 'routes/image-sorter.tsx'),
    route('pdf-title-editor', 'routes/pdf-title-editor.tsx'),
    route('privacy', 'routes/privacy.tsx'),
    route('terms', 'routes/terms.tsx'),
  ]),
  // Locale-less page paths redirect to the negotiated locale. Static segments
  // take precedence over the :locale route, so these win the match.
  route('file-renamer', 'routes/locale-redirect.tsx', {
    id: 'redirect-file-renamer',
  }),
  route('image-sorter', 'routes/locale-redirect.tsx', {
    id: 'redirect-image-sorter',
  }),
  route('pdf-title-editor', 'routes/locale-redirect.tsx', {
    id: 'redirect-pdf-title-editor',
  }),
  route('privacy', 'routes/locale-redirect.tsx', { id: 'redirect-privacy' }),
  route('terms', 'routes/locale-redirect.tsx', { id: 'redirect-terms' }),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig
