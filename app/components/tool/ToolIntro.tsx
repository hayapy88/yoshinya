import { useLocale } from '~/i18n/locale'
import './tool-shared.css'

/**
 * The heading block every tool page opens with: title, one-paragraph lead, the
 * three promises as badges, and the privacy note. Shared so the three claims
 * are worded identically everywhere — they are the product's core promise, and
 * a tool that phrases them differently reads like a different site.
 */
export function ToolIntro({
  heading,
  lead,
  privacyNote,
}: {
  heading: string
  lead: string
  // Each tool names what it processes ("your PDFs", "your images"), so the
  // sentence itself stays per-tool while the presentation is shared.
  privacyNote: string
}) {
  const { t } = useLocale()

  return (
    <header className="tool-intro">
      <h1>{heading}</h1>
      <p className="tool-lead">{lead}</p>
      <ul className="tool-badges">
        <li>{t.toolBadges.free}</li>
        <li>{t.toolBadges.noSignup}</li>
        <li>{t.toolBadges.local}</li>
      </ul>
      <p className="tool-privacy">🔒 {privacyNote}</p>
    </header>
  )
}
