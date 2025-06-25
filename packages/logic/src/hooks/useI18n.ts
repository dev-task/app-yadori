import { useTranslation } from 'react-i18next'

export const useI18n = () => {
  const { t, i18n } = useTranslation()

  const changeLanguage = async (lng: string) => {
    try {
      await i18n.changeLanguage(lng)
      // ローカルストレージに保存
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('i18nextLng', lng)
      }
    } catch (error) {
      console.error('Language change failed:', error)
    }
  }

  return {
    t,
    language: i18n.language,
    changeLanguage,
    isLoading: false
  }
}