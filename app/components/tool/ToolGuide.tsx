import { Link } from 'react-router'
import { useLocale, type Dictionary } from '~/i18n/locale'
import {
  TOOL_SLUGS,
  type GuideSection,
  type ToolGuideContent,
  type ToolSlug,
} from './types'
import './tool-shared.css'

// Maps a slug to the dictionary entry that names and describes it, so the
// related-tools list stays correct without each tool repeating the others.
const PAGE_KEY: Record<ToolSlug, keyof Dictionary> = {
  'file-renamer': 'fileRenamerPage',
  'image-sorter': 'imageSorterPage',
  'pdf-title-editor': 'pdfTitleEditorPage',
  'image-compressor': 'imageCompressorPage',
  'csv-encoding-fixer': 'csvEncodingFixerPage',
}

function Section({ section }: { section: GuideSection }) {
  return (
    <>
      <h3>{section.heading}</h3>
      {section.body && <p>{section.body}</p>}
      {section.terms && (
        <dl>
          {section.terms.map((entry) => (
            <div key={entry.term}>
              <dt>{entry.term}</dt>
              <dd>{entry.definition}</dd>
            </div>
          ))}
        </dl>
      )}
      {section.steps && (
        <ol>
          {section.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
      {section.items && (
        <ul>
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </>
  )
}

/**
 * The explanatory content below every tool. Sections sit one level under the
 * guide's own heading so the page outline nests properly, and the FAQ rendered
 * here is the same data the FAQPage structured data is built from.
 */
export function ToolGuide({
  guide,
  current,
}: {
  guide: ToolGuideContent
  // Excluded from the related-tools list: a tool should not link to itself.
  current: ToolSlug
}) {
  const { locale, t } = useLocale()

  return (
    <section className="tool-guide" aria-labelledby="tool-guide-heading">
      <h2 id="tool-guide-heading" className="tool-guide-title">
        {guide.heading}
      </h2>

      {guide.sections.map((section) => (
        <Section key={section.heading} section={section} />
      ))}

      <h3>{guide.faqHeading}</h3>
      <dl>
        {guide.faq.map((entry) => (
          <div key={entry.question}>
            <dt>{entry.question}</dt>
            <dd>{entry.answer}</dd>
          </div>
        ))}
      </dl>

      <h3>{guide.relatedHeading}</h3>
      <ul className="tool-related">
        {TOOL_SLUGS.filter((slug) => slug !== current).map((slug) => {
          const page = t[PAGE_KEY[slug]] as {
            toolName: string
            toolDescription: string
          }
          return (
            <li key={slug}>
              <Link to={`/${locale}/${slug}`}>{page.toolName}</Link>
              {' — '}
              {page.toolDescription}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
