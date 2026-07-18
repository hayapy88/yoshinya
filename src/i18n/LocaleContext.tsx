import { useEffect, useState, type ReactNode } from 'react'
import {
  LocaleContext,
  STORAGE_KEY,
  dictionaries,
  type Locale,
} from './locale'

// Default is English; no browser-language detection (kept simple on purpose).
function readStoredLocale(): Locale {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'ja' ? 'ja' : 'en'
  } catch {
    return 'en'
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(readStoredLocale)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      // Persistence is best-effort (e.g. blocked storage).
    }
    const dict = dictionaries[locale]
    document.documentElement.lang = locale
    document.title = dict.meta.title
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', dict.meta.description)
  }, [locale])

  return (
    <LocaleContext.Provider
      value={{ locale, setLocale, t: dictionaries[locale] }}
    >
      {children}
    </LocaleContext.Provider>
  )
}
