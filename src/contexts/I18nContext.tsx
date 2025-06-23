import React, { createContext, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface I18nContextType {
  language: string
  changeLanguage: (lng: string) => void
  t: (key: string, options?: any) => string
  isLoading: boolean
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

interface I18nProviderProps {
  children: React.ReactNode
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const { t, i18n } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)

  const changeLanguage = async (lng: string) => {
    setIsLoading(true)
    try {
      await i18n.changeLanguage(lng)
      // ローカルストレージに保存
      localStorage.setItem('i18nextLng', lng)
    } catch (error) {
      console.error('Language change failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    language: i18n.language,
    changeLanguage,
    t,
    isLoading
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}