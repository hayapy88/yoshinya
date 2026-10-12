import type { Route } from './+types/width-converter';
import { dictionaries, isLocale } from '~/i18n/locale';
import {
  breadcrumbJsonLd,
  widthConverterJsonLd,
  faqJsonLd,
  isProductionHost,
  pageMeta,
} from '~/lib/seo';
import WidthConverterTool from '~/features/width-converter/WidthConverterTool';

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en';
  const t = dictionaries[locale];
  const rootData = matches[0]?.loaderData;
  return pageMeta({
    locale,
    path: '/width-converter',
    title: t.widthConverterPage.metaTitle,
    description: t.widthConverterPage.metaDescription,
    noindex: !isProductionHost(rootData?.host),
    ogImageSlug: 'width-converter',
    jsonLd: [
      widthConverterJsonLd(locale),
      // Mirrors the FAQ rendered below the tool, as required for FAQPage.
      faqJsonLd(t.widthConverterGuide.faq),
      breadcrumbJsonLd(locale, [
        { name: t.widthConverterPage.toolName, path: '/width-converter' },
      ]),
    ],
  });
}

export default function WidthConverterPage() {
  return <WidthConverterTool />;
}
