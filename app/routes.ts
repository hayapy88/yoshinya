import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/gateway.tsx'),
  route(':locale', 'routes/locale-layout.tsx', [
    index('routes/home.tsx'),
    route('file-renamer', 'routes/file-renamer.tsx'),
  ]),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig
