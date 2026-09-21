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
// `t.site.xUrl`. Glyphs are the brand marks from Simple Icons (CC0 1.0),
// inlined because Lucide dropped its brand icons.
const DEVELOPER_LINKS = [
  {
    key: 'github',
    href: 'https://github.com/hayapy88',
    path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  },
  {
    key: 'x',
    href: 'https://x.com/paya1681',
    path: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  },
  {
    key: 'linkedin',
    href: 'https://www.linkedin.com/in/hayatoyokoi/',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
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
            {
              slug: 'structured-data-generator',
              name: t.structuredDataPage.toolName,
              description: t.structuredDataPage.toolDescription,
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
                  aria-label={t.home.developer[link.key]}
                  title={t.home.developer[link.key]}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-navy text-navy transition-colors hover:bg-navy hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong dark:border-brand dark:text-brand dark:hover:bg-brand dark:hover:text-navy-strong"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d={link.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
