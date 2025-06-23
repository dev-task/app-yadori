import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 翻訳リソースのインポート
import ja from './locales/ja.json'
import en from './locales/en.json'

const resources = {
  ja: {
    translation: ja
  },
  en: {
    translation: en
  }
}

i18n
  // 言語検出プラグイン
  .use(LanguageDetector)
  // React i18nextプラグイン
  .use(initReactI18next)
  // 初期化
  .init({
    resources,
    fallbackLng: 'ja', // デフォルト言語
    debug: process.env.NODE_ENV === 'development',

    // 言語検出の設定
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false, // Reactは既にXSS対策済み
    },

    // 翻訳キーが見つからない場合の設定
    returnKeyIfNotFound: true,
    returnEmptyString: false,
  })

export default i18n