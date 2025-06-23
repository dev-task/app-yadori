import React, { useState } from 'react'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { useI18n } from '../contexts/I18nContext'
import { Card } from './ui'

interface LanguageOption {
  code: string
  name: string
  nativeName: string
}

const languages: LanguageOption[] = [
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'en', name: 'English', nativeName: 'English' }
]

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons'
  className?: string
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'dropdown',
  className = '' 
}) => {
  const { language, changeLanguage, isLoading, t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0]

  const handleLanguageChange = async (langCode: string) => {
    await changeLanguage(langCode)
    setIsOpen(false)
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex space-x-2 ${className}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              language === lang.code
                ? 'bg-spotify-green-500 text-black'
                : 'bg-spotify-gray-700 text-spotify-gray-300 hover:bg-spotify-gray-600 hover:text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {lang.nativeName}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center space-x-2 px-4 py-2 bg-spotify-gray-800 hover:bg-spotify-gray-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Globe className="h-4 w-4 text-spotify-green-400" />
        <span className="text-sm font-medium">{currentLanguage.nativeName}</span>
        <ChevronDown className={`h-4 w-4 text-spotify-gray-400 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <Card className="absolute top-full mt-2 right-0 min-w-[200px] z-20 p-2">
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-medium text-spotify-gray-400 uppercase tracking-wider">
                {t('settings.selectLanguage')}
              </div>
              
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                    language === lang.code
                      ? 'bg-spotify-green-500 bg-opacity-20 text-spotify-green-400'
                      : 'text-spotify-gray-300 hover:bg-spotify-gray-700 hover:text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{lang.nativeName}</span>
                    <span className="text-xs opacity-75">{lang.name}</span>
                  </div>
                  
                  {language === lang.code && (
                    <Check className="h-4 w-4 text-spotify-green-400" />
                  )}
                </button>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}