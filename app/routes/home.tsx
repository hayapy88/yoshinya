import { Link } from 'react-router';
import type { Route } from './+types/home';
import { dictionaries, isLocale, useLocale } from '~/i18n/locale';
import {
  isProductionHost,
  organizationJsonLd,
  pageMeta,
  websiteJsonLd,
} from '~/lib/seo';

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en';
  const t = dictionaries[locale];
  const rootData = matches[0]?.loaderData;
  return pageMeta({
    locale,
    path: '',
    title: t.home.metaTitle,
    description: t.home.metaDescription,
    noindex: !isProductionHost(rootData?.host),
    jsonLd: [organizationJsonLd(locale), websiteJsonLd(locale)],
  });
}

// The developer's own profiles, as opposed to the Yoshinya account in
// `t.site.xUrl`.
const DEVELOPER_LINKS = [
  { key: 'github', href: 'https://github.com/hayapy88' },
  { key: 'x', href: 'https://x.com/paya1681' },
  { key: 'linkedin', href: 'https://www.linkedin.com/in/hayatoyokoi/' },
] as const;

export default function Home() {
  const { locale, t } = useLocale();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12">
      <section
        aria-labelledby="hero-heading"
        className="flex flex-wrap items-center gap-8"
      >
        <div className="min-w-[16rem] flex-1">
          <p className="text-sm font-semibold tracking-[0.25em] text-navy uppercase dark:text-brand">
            {t.home.kicker}
          </p>
          <h1 id="hero-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
            {t.home.primary}
          </h1>
          <p className="mt-4 text-[color:var(--muted,#6f6b78)]">
            {t.home.supporting}
          </p>
          <p className="mt-2 text-sm text-[color:var(--muted,#6f6b78)]">
            {t.home.privacyNote}
          </p>
        </div>
        <picture className="flex w-full justify-center sm:w-auto">
          <source type="image/webp" srcSet="/brand/yoshinyan-eyes-open.webp" />
          <img
            src="/brand/yoshinyan-eyes-open.png"
            alt={t.site.mascotAlt}
            width={902}
            height={1155}
            decoding="async"
            className="w-32 h-auto sm:w-40"
          />
        </picture>
      </section>

      <section aria-labelledby="tools-heading" className="mt-12">
        <h2 id="tools-heading" className="text-xl font-semibold">
          {t.home.toolsHeading}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            {
              slug: 'file-renamer',
              name: t.fileRenamerPage.toolName,
              description: t.fileRenamerPage.toolDescription,
            },
            {
              slug: 'image-sorter',
              name: t.imageSorterPage.toolName,
              description: t.imageSorterPage.toolDescription,
            },
            {
              slug: 'pdf-title-editor',
              name: t.pdfTitleEditorPage.toolName,
              description: t.pdfTitleEditorPage.toolDescription,
            },
            {
              slug: 'image-compressor',
              name: t.imageCompressorPage.toolName,
              description: t.imageCompressorPage.toolDescription,
            },
            {
              slug: 'csv-encoding-fixer',
              name: t.csvEncodingFixerPage.toolName,
              description: t.csvEncodingFixerPage.toolDescription,
            },
            {
              slug: 'split-bill',
              name: t.splitBillPage.toolName,
              description: t.splitBillPage.toolDescription,
            },
            {
              slug: 'icon-generator',
              name: t.iconGeneratorPage.toolName,
              description: t.iconGeneratorPage.toolDescription,
            },
            {
              slug: 'pdf-merger',
              name: t.pdfMergerPage.toolName,
              description: t.pdfMergerPage.toolDescription,
            },
            {
              slug: 'pdf-page-organizer',
              name: t.pdfPageOrganizerPage.toolName,
              description: t.pdfPageOrganizerPage.toolDescription,
            },
          ].map((tool) => (
            <Link
              key={tool.slug}
              to={`/${locale}/${tool.slug}`}
              className="group flex flex-col rounded-2xl border border-[#d9d7de] p-6 no-underline transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong dark:border-[#3a3841]"
            >
              <span className="block text-lg font-bold text-[color:var(--text)]">
                {tool.name}
              </span>
              <span className="mt-1 block text-sm text-[color:var(--muted,#6f6b78)]">
                {tool.description}
              </span>
              {/* Navy on light, orange on dark: each theme uses the colour that
                  separates from its own background. Navy sits at 1.38:1 against
                  the dark page and would all but vanish, while white on this
                  orange is 2.79:1 and fails AA — so neither pairing survives
                  being used everywhere. Orange stays the accent on light, in
                  the card border that lights up alongside this. */}
              <span className="mt-4 inline-block self-start rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-navy-strong dark:bg-brand dark:text-navy-strong dark:group-hover:bg-brand-strong">
                {t.home.cta}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="developer-heading" className="mt-12">
        <h2 id="developer-heading" className="text-xl font-semibold">
          {t.home.developer.heading}
        </h2>
        <div className="mt-4 rounded-2xl border border-[#d9d7de] p-6 dark:border-[#3a3841]">
          <p className="m-0 text-[color:var(--text)]">{t.home.developer.intro}</p>
          <p className="mt-3 text-[color:var(--muted,#6f6b78)]">
            {t.home.developer.current}
          </p>
          <p className="mt-5 text-sm font-semibold text-[color:var(--muted,#6f6b78)]">
            {t.home.developer.linksLabel}
          </p>
          <ul className="m-0 mt-2 flex list-none flex-wrap gap-3 p-0">
            {DEVELOPER_LINKS.map((link) => (
              <li key={link.key}>
                {/* rel="me" marks these as the developer's own profiles, which
                    is the signal search engines use to tie the site to them. */}
                <a
                  href={link.href}
                  target="_blank"
                  rel="me noopener noreferrer"
                  className="inline-block rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy no-underline transition-colors hover:bg-navy hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong dark:border-brand dark:text-brand dark:hover:bg-brand dark:hover:text-navy-strong"
                >
                  {t.home.developer[link.key]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
