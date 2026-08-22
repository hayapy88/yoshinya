import { Outlet, data } from 'react-router';
import type { Route } from './+types/locale-layout';
import { isLocale, type Locale } from '~/i18n/locale';
import { LocaleProvider } from '~/i18n/LocaleContext';
import { SiteHeader } from '~/components/layout/SiteHeader';
import { SiteFooter } from '~/components/layout/SiteFooter';

// Lets the root layout read the active locale for the html lang attribute.
export const handle = { locale: true };

export function loader({ params }: Route.LoaderArgs) {
  if (!isLocale(params.locale)) {
    throw data(null, { status: 404 });
  }
  return null;
}

export default function LocaleLayout({ params }: Route.ComponentProps) {
  // The loader rejects invalid locales, so the cast is safe here.
  const locale = params.locale as Locale;

  return (
    <LocaleProvider locale={locale}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex-1">
          <Outlet />
        </div>
        <SiteFooter />
      </div>
    </LocaleProvider>
  );
}
