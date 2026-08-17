// Product analytics for the tools, sent to GA4 through gtag.js.
//
// The gtag library and its config live in app/root.tsx and load only on the
// production domain. This module is the typed front door: every event a tool
// can send is named in AnalyticsEvent, so a typo is a compile error rather than
// a silently missing metric.
//
// Privacy rules, non-negotiable and enforced by the parameter type below:
// no file names, no file contents, no free-form user input. Counts, tool slugs,
// and fixed enum-like values only. Everything the tools process stays on the
// device, and nothing about it may leak through an event.

export type AnalyticsEvent =
  | 'tool_opened'
  | 'files_added'
  | 'rename_preview_generated'
  | 'download_completed'
  // Which bulk action was used and how many rows it touched — never the value
  // that was applied, which is user input.
  | 'batch_action'
  | 'language_changed'

// Re-exported from the tool registry rather than repeated. Two copies of this
// union drifted apart the moment a tool was added, and the failure mode is a
// tool whose events silently do not typecheck.
export type { ToolSlug } from '~/components/tool/types'
import type { ToolSlug } from '~/components/tool/types'

// Deliberately narrow. Adding a free-form string field here would be the way a
// filename eventually ends up in an event, so new keys need a deliberate edit.
export type AnalyticsParams = {
  tool?: ToolSlug
  file_count?: number
  action?: string
  mode?: string
  to?: string
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function isAnalyticsEnabled(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

/**
 * Records one event. A no-op during server rendering, in development, and on
 * preview hosts, because the library is only injected on the production domain.
 *
 * Safe to call before gtag.js has finished downloading: the inline stub in
 * root.tsx queues the call and the library replays it on load.
 */
export function track(event: AnalyticsEvent, params?: AnalyticsParams): void {
  if (!isAnalyticsEnabled()) {
    return
  }
  window.gtag?.('event', event, params)
}
