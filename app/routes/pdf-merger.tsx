import type { Route } from './+types/pdf-merger';
import { dictionaries, isLocale } from '~/i18n/locale';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  isProductionHost,
  pageMeta,
  pdfMergerJsonLd,
} from '~/lib/seo';
import PdfMergerTool from '~/features/pdf-merger/PdfMergerTool';

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en';
  const t = dictionaries[locale];
  const rootData = matches[0]?.loaderData;
  return pageMeta({
    locale,
    path: '/pdf-merger',
    title: t.pdfMergerPage.metaTitle,
    description: t.pdfMergerPage.metaDescription,
    noindex: !isProductionHost(rootData?.host),
    ogImageSlug: 'pdf-merger',
    jsonLd: [
      pdfMergerJsonLd(locale),
      // Mirrors the FAQ rendered below the tool, as required for FAQPage.
      faqJsonLd(t.pdfMergerGuide.faq),
      breadcrumbJsonLd(locale, [
        { name: t.pdfMergerPage.toolName, path: '/pdf-merger' },
      ]),
    ],
  });
}

export default function PdfMergerPage() {
  return <PdfMergerTool />;
}
