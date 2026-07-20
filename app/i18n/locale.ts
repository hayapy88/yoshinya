import { createContext, useContext } from 'react'
import { en } from './en'
import { ja } from './ja'

export type Locale = 'en' | 'ja'
export type Dictionary = typeof en

export const STORAGE_KEY = 'file-renamer:locale'
export const dictionaries: Record<Locale, Dictionary> = { en, ja }

export type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
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
