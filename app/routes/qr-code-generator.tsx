import type { Route } from './+types/qr-code-generator';
import { dictionaries, isLocale } from '~/i18n/locale';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  isProductionHost,
  pageMeta,
  qrCodeGeneratorJsonLd,
} from '~/lib/seo';
import QrCodeGeneratorTool from '~/features/qr-code-generator/QrCodeGeneratorTool';

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en';
  const t = dictionaries[locale];
  const rootData = matches[0]?.loaderData;
  return pageMeta({
    locale,
    path: '/qr-code-generator',
    title: t.qrCodeGeneratorPage.metaTitle,
    description: t.qrCodeGeneratorPage.metaDescription,
    noindex: !isProductionHost(rootData?.host),
    ogImageSlug: 'qr-code-generator',
    jsonLd: [
      qrCodeGeneratorJsonLd(locale),
      // Mirrors the FAQ rendered below the tool, as required for FAQPage.
      faqJsonLd(t.qrCodeGeneratorGuide.faq),
      breadcrumbJsonLd(locale, [
        { name: t.qrCodeGeneratorPage.toolName, path: '/qr-code-generator' },
      ]),
    ],
  });
}

export default function QrCodeGeneratorPage() {
  return <QrCodeGeneratorTool />;
}
