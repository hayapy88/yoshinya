import type { Route } from './+types/structured-data-generator';
import { dictionaries, isLocale } from '~/i18n/locale';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  isProductionHost,
  pageMeta,
  structuredDataGeneratorJsonLd,
} from '~/lib/seo';
import StructuredDataTool from '~/features/structured-data-generator/StructuredDataTool';

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en';
  const t = dictionaries[locale];
  const rootData = matches[0]?.loaderData;
  return pageMeta({
    locale,
    path: '/structured-data-generator',
    title: t.structuredDataPage.metaTitle,
    description: t.structuredDataPage.metaDescription,
    noindex: !isProductionHost(rootData?.host),
    ogImageSlug: 'structured-data-generator',
    jsonLd: [
      structuredDataGeneratorJsonLd(locale),
      // Mirrors the FAQ rendered below the tool, as required for FAQPage.
      faqJsonLd(t.structuredDataGuide.faq),
      breadcrumbJsonLd(locale, [
        {
          name: t.structuredDataPage.toolName,
          path: '/structured-data-generator',
        },
      ]),
    ],
  });
}

export default function StructuredDataGeneratorPage() {
  return <StructuredDataTool />;
}
