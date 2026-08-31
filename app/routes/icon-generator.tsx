import type { Route } from './+types/icon-generator';
import { dictionaries, isLocale } from '~/i18n/locale';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  iconGeneratorJsonLd,
  isProductionHost,
  pageMeta,
} from '~/lib/seo';
import IconGeneratorTool from '~/features/icon-generator/IconGeneratorTool';

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en';
  const t = dictionaries[locale];
  const rootData = matches[0]?.loaderData;
  return pageMeta({
    locale,
    path: '/icon-generator',
    title: t.iconGeneratorPage.metaTitle,
    description: t.iconGeneratorPage.metaDescription,
    noindex: !isProductionHost(rootData?.host),
    ogImageSlug: 'icon-generator',
    jsonLd: [
      iconGeneratorJsonLd(locale),
      // Mirrors the FAQ rendered below the tool, as required for FAQPage.
      faqJsonLd(t.iconGeneratorGuide.faq),
      breadcrumbJsonLd(locale, [
        { name: t.iconGeneratorPage.toolName, path: '/icon-generator' },
      ]),
    ],
  });
}

export default function IconGeneratorPage() {
  return <IconGeneratorTool />;
}
