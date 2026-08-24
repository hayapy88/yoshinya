import type { Route } from './+types/split-bill';
import { dictionaries, isLocale } from '~/i18n/locale';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  isProductionHost,
  pageMeta,
  splitBillJsonLd,
} from '~/lib/seo';
import SplitBillTool from '~/features/split-bill/SplitBillTool';

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en';
  const t = dictionaries[locale];
  const rootData = matches[0]?.loaderData;
  return pageMeta({
    locale,
    path: '/split-bill',
    title: t.splitBillPage.metaTitle,
    description: t.splitBillPage.metaDescription,
    noindex: !isProductionHost(rootData?.host),
    jsonLd: [
      splitBillJsonLd(locale),
      // Mirrors the FAQ rendered below the tool, as required for FAQPage.
      faqJsonLd(t.splitBillGuide.faq),
      breadcrumbJsonLd(locale, [
        { name: t.splitBillPage.toolName, path: '/split-bill' },
      ]),
    ],
  });
}

export default function SplitBillPage() {
  return <SplitBillTool />;
}
