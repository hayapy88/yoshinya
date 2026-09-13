import type { Route } from './+types/pdf-page-organizer';
import { dictionaries, isLocale } from '~/i18n/locale';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  isProductionHost,
  pageMeta,
  pdfPageOrganizerJsonLd,
} from '~/lib/seo';
import PdfPageOrganizerTool from '~/features/pdf-page-organizer/PdfPageOrganizerTool';

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en';
  const t = dictionaries[locale];
  const rootData = matches[0]?.loaderData;
  return pageMeta({
    locale,
    path: '/pdf-page-organizer',
    title: t.pdfPageOrganizerPage.metaTitle,
    description: t.pdfPageOrganizerPage.metaDescription,
    noindex: !isProductionHost(rootData?.host),
    ogImageSlug: 'pdf-page-organizer',
    jsonLd: [
      pdfPageOrganizerJsonLd(locale),
      // Mirrors the FAQ rendered below the tool, as required for FAQPage.
      faqJsonLd(t.pdfPageOrganizerGuide.faq),
      breadcrumbJsonLd(locale, [
        {
          name: t.pdfPageOrganizerPage.toolName,
          path: '/pdf-page-organizer',
        },
      ]),
    ],
  });
}

export default function PdfPageOrganizerPage() {
  return <PdfPageOrganizerTool />;
}
