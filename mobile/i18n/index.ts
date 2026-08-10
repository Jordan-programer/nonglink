import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import pt from './locales/pt.json'
import en from './locales/en.json'
import fr from './locales/fr.json'
import zh from './locales/zh.json'

export const supportedLanguages = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'zh', label: '中文' },
]

const LANGUAGE_STORAGE_KEY = 'agrilink.language'

i18n.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
    fr: { translation: fr },
    zh: { translation: zh },
  },
  lng: 'pt',
  fallbackLng: 'pt',
  supportedLngs: ['pt', 'en', 'fr', 'zh'],
  interpolation: { escapeValue: false },
})

AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((saved) => {
  if (saved) i18n.changeLanguage(saved)
})

export function setLanguage(code: string) {
  i18n.changeLanguage(code)
  AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code)
}

export default i18n
