import type { Route } from './+types/csv-encoding-fixer';
import { dictionaries, isLocale } from '~/i18n/locale';
import {
  breadcrumbJsonLd,
  csvEncodingFixerJsonLd,
  faqJsonLd,
  isProductionHost,
  pageMeta,
} from '~/lib/seo';
import CsvEncodingFixerTool from '~/features/csv-encoding-fixer/CsvEncodingFixerTool';

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en';
  const t = dictionaries[locale];
  const rootData = matches[0]?.loaderData;
  return pageMeta({
    locale,
    path: '/csv-encoding-fixer',
    title: t.csvEncodingFixerPage.metaTitle,
    description: t.csvEncodingFixerPage.metaDescription,
    noindex: !isProductionHost(rootData?.host),
    ogImageSlug: 'csv-encoding-fixer',
    jsonLd: [
      csvEncodingFixerJsonLd(locale),
      // Mirrors the FAQ rendered below the tool, as required for FAQPage.
      faqJsonLd(t.csvEncodingFixerGuide.faq),
      breadcrumbJsonLd(locale, [
        { name: t.csvEncodingFixerPage.toolName, path: '/csv-encoding-fixer' },
      ]),
    ],
  });
}

export default function CsvEncodingFixerPage() {
  return <CsvEncodingFixerTool />;
}
