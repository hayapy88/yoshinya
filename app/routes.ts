import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/gateway.tsx'),
  route(':locale', 'routes/locale-layout.tsx', [
    index('routes/home.tsx'),
    route('file-renamer', 'routes/file-renamer.tsx'),
    route('privacy', 'routes/privacy.tsx'),
    route('terms', 'routes/terms.tsx'),
  ]),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig
