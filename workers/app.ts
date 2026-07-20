import { createRequestHandler } from 'react-router'

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
)

export default {
  async fetch(request) {
    // www redirects permanently to the canonical apex domain.
    const url = new URL(request.url)
    if (url.hostname === 'www.yoshinya.com') {
      url.hostname = 'yoshinya.com'
      return Response.redirect(url.toString(), 301)
    }
    return requestHandler(request)
  },
} satisfies ExportedHandler<Env>
