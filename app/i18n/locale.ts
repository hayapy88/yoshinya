import { createContext, useContext } from 'react'
import { en } from './en'
import { ja } from './ja'

export type Locale = 'en' | 'ja'
export type Dictionary = typeof en

export const LOCALES: Locale[] = ['en', 'ja']

// Cookie that stores the visitor's explicit language choice. Read by the
// gateway route (/) to send returning visitors straight to their language.
export const LOCALE_COOKIE = 'yoshinya_locale'

export const dictionaries: Record<Locale, Dictionary> = { en, ja }

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'ja'
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'ja' : 'en'
}

// Chooses a locale for a request that has no locale in the URL: the stored
// cookie choice if valid, otherwise the browser's preferred language, falling
// back to English. Used by the gateway and the locale-less redirect routes.
export function negotiateLocale(request: Request): Locale {
  const cookies = request.headers.get('cookie') ?? ''
  const stored = new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=(\\w+)`).exec(
    cookies,
  )?.[1]
  if (isLocale(stored)) {
    return stored
  }
  const acceptLanguage = request.headers.get('accept-language') ?? ''
  const firstTag = acceptLanguage.split(',')[0]?.trim().toLowerCase() ?? ''
  return firstTag.startsWith('ja') ? 'ja' : 'en'
}

// Best-effort persistence of the language choice (client-side only).
export function storeLocaleChoice(locale: Locale) {
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
  } catch {
    // Ignore blocked cookies; the choice simply won't be remembered.
  }
}

export type LocaleContextValue = {
  locale: Locale
  t: Dictionary
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}
