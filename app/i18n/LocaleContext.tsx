import type { ReactNode } from 'react';
import { LocaleContext, dictionaries, type Locale } from './locale';

// The locale is driven by the URL (/:locale), so the provider simply receives
// it from the route. Document title, meta tags, and the html lang attribute
// are handled by route meta functions and the root layout.
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ locale, t: dictionaries[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}
