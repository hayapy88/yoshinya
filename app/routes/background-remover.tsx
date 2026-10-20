import type { Route } from './+types/background-remover';
import { dictionaries, isLocale } from '~/i18n/locale';
import {
  backgroundRemoverJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  isProductionHost,
  pageMeta,
} from '~/lib/seo';
import BackgroundRemoverTool from '~/features/background-remover/BackgroundRemoverTool';

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en';
  const t = dictionaries[locale];
  const rootData = matches[0]?.loaderData;
  return pageMeta({
    locale,
    path: '/background-remover',
    title: t.backgroundRemoverPage.metaTitle,
    description: t.backgroundRemoverPage.metaDescription,
    noindex: !isProductionHost(rootData?.host),
    ogImageSlug: 'background-remover',
    jsonLd: [
      backgroundRemoverJsonLd(locale),
      // Mirrors the FAQ rendered below the tool, as required for FAQPage.
      faqJsonLd(t.backgroundRemoverGuide.faq),
      breadcrumbJsonLd(locale, [
        { name: t.backgroundRemoverPage.toolName, path: '/background-remover' },
      ]),
    ],
  });
}

export default function BackgroundRemoverPage() {
  return <BackgroundRemoverTool />;
}
