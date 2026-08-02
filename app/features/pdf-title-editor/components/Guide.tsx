import { Link } from 'react-router'
import { useLocale } from '~/i18n/locale'

// Educational content below the tool: explains the distinction the tool exists
// for, and carries the FAQ that the FAQPage structured data mirrors.
export function Guide() {
  const { locale, t } = useLocale()
  const g = t.pdfTitleEditorGuide

  return (
    <section className="pte-guide" aria-labelledby="pte-guide-heading">
      {/* The sections below are all part of this one guide, so they sit a level
          underneath it rather than beside it. */}
      <h2 id="pte-guide-heading" className="pte-guide-title">
        {g.guideHeading}
      </h2>

      <h3>{g.whatIsTitle.heading}</h3>
      <p>{g.whatIsTitle.body}</p>

      <h3>{g.filenameVsTitle.heading}</h3>
      <p>{g.filenameVsTitle.body}</p>
      <dl>
        <dt>{g.filenameVsTitle.filenameTerm}</dt>
        <dd>{g.filenameVsTitle.filenameDefinition}</dd>
        <dt>{g.filenameVsTitle.titleTerm}</dt>
        <dd>{g.filenameVsTitle.titleDefinition}</dd>
      </dl>

      <h3>{g.howToUse.heading}</h3>
      <ol>
        {g.howToUse.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <h3>{g.whenUseful.heading}</h3>
      <ul>
        {g.whenUseful.cases.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h3>{g.privacy.heading}</h3>
      <p>{g.privacy.body}</p>

      <h3>{g.faqHeading}</h3>
      <dl>
        {g.faq.map((entry) => (
          <div key={entry.question}>
            <dt>{entry.question}</dt>
            <dd>{entry.answer}</dd>
          </div>
        ))}
      </dl>

      <h3>{g.relatedHeading}</h3>
      <ul>
        <li>
          <Link to={`/${locale}/file-renamer`}>{t.fileRenamerPage.toolName}</Link>
          {' — '}
          {t.fileRenamerPage.toolDescription}
        </li>
        <li>
          <Link to={`/${locale}/image-sorter`}>{t.imageSorterPage.toolName}</Link>
          {' — '}
          {t.imageSorterPage.toolDescription}
        </li>
      </ul>
    </section>
  )
}
