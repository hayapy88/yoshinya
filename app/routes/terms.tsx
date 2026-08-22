import type { Route } from './+types/terms';
import { LegalPage } from '~/components/layout/LegalPage';
import { termsContent } from '~/legal/terms-content';
import { isLocale } from '~/i18n/locale';
import { isProductionHost, pageMeta } from '~/lib/seo';

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en';
  const doc = termsContent[locale];
  const rootData = matches[0]?.loaderData;
  return pageMeta({
    locale,
    path: '/terms',
    title:
      locale === 'ja' ? `${doc.title}｜よしにゃ` : `${doc.title} | YOSHINYA`,
    description: doc.intro[0],
    noindex: !isProductionHost(rootData?.host),
  });
}

export default function TermsPage() {
  return <LegalPage content={termsContent} />;
}
