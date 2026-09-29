import type { Route } from './+types/character-counter';
import { dictionaries, isLocale } from '~/i18n/locale';
import {
  breadcrumbJsonLd,
  characterCounterJsonLd,
  faqJsonLd,
  isProductionHost,
  pageMeta,
} from '~/lib/seo';
import CharacterCounterTool from '~/features/character-counter/CharacterCounterTool';

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en';
  const t = dictionaries[locale];
  const rootData = matches[0]?.loaderData;
  return pageMeta({
    locale,
    path: '/character-counter',
    title: t.characterCounterPage.metaTitle,
    description: t.characterCounterPage.metaDescription,
    noindex: !isProductionHost(rootData?.host),
    ogImageSlug: 'character-counter',
    jsonLd: [
      characterCounterJsonLd(locale),
      // Mirrors the FAQ rendered below the tool, as required for FAQPage.
      faqJsonLd(t.characterCounterGuide.faq),
      breadcrumbJsonLd(locale, [
        { name: t.characterCounterPage.toolName, path: '/character-counter' },
      ]),
    ],
  });
}

export default function CharacterCounterPage() {
  return <CharacterCounterTool />;
}
