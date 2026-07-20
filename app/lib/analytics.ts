// Analytics scaffolding for GA4, prepared but deliberately inactive.
//
// Activation requires ALL of the following:
//   1. A GA4 measurement ID provided via the VITE_GA4_ID environment variable
//      (never hard-coded).
//   2. A consent mechanism: hasAnalyticsConsent() must be backed by a real
//      user-facing consent flow before it may return true.
//   3. Calling initAnalytics() after consent is granted.
//
// Privacy rules for every event: no file names, no file contents, no free-form
// user input. Only counts, locales, and tool identifiers are allowed.

export type AnalyticsEvent =
  | 'tool_opened'
  | 'files_added'
  | 'rename_preview_generated'
  | 'download_completed'
  | 'language_changed'

export type AnalyticsParams = Record<string, string | number>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const GA4_ID: string | undefined = import.meta.env.VITE_GA4_ID

// Placeholder until a real consent flow exists. Keeping this hard-coded to
// false guarantees analytics cannot activate even if an ID is configured.
export function hasAnalyticsConsent(): boolean {
  return false
}

export function isAnalyticsEnabled(): boolean {
  return (
    typeof window !== 'undefined' && Boolean(GA4_ID) && hasAnalyticsConsent()
  )
}

// Injects gtag.js. Safe to call unconditionally: it is a no-op unless an ID
// is configured and consent has been granted.
export function initAnalytics(): void {
  if (!isAnalyticsEnabled() || window.gtag) {
    return
  }
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`
  document.head.appendChild(script)
  window.dataLayer = window.dataLayer ?? []
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA4_ID)
}

export function track(event: AnalyticsEvent, params?: AnalyticsParams): void {
  if (!isAnalyticsEnabled() || typeof window.gtag !== 'function') {
    return
  }
  window.gtag('event', event, params)
}
