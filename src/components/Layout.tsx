import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Search, PlusCircle, User, LogOut, Music, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { LanguageSwitcher } from './LanguageSwitcher'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth()
  const { t } = useI18n()
  const location = useLocation()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { path: '/', icon: Home, label: t('navigation.home') },
    { path: '/search', icon: Search, label: t('navigation.search') },
    { path: '/post', icon: PlusCircle, label: t('navigation.post') },
    { path: '/profile', icon: User, label: t('navigation.profile') },
  ]

  return (
    <div className="min-h-screen gradient-bg">
      {/* サイドバー（デスクトップ） */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-spotify-black overflow-y-auto">
          {/* ロゴ */}
          <div className="flex items-center flex-shrink-0 px-6 py-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-spotify-green-500 rounded-full flex-center group-hover:scale-110 transition-transform duration-200">
                <Music className="h-6 w-6 text-black" />
              </div>
              <span className="text-xl font-bold text-white group-hover:text-spotify-green-400 transition-colors duration-200">
                Yadori
              </span>
            </Link>
          </div>

          {/* ナビゲーション */}
          {user && (
            <nav className="flex-1 px-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                      isActive(item.path)
                        ? 'bg-spotify-gray-800 text-white shadow-glow'
                        : 'text-spotify-gray-300 hover:text-white hover:bg-spotify-gray-800'
                    }`}
                  >
                    <Icon className={`h-5 w-5 transition-colors duration-200 ${
                      isActive(item.path) ? 'text-spotify-green-500' : 'group-hover:text-spotify-green-400'
                    }`} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              {/* 言語切り替え */}
              <div className="px-4 py-3">
                <LanguageSwitcher variant="buttons" />
              </div>

              {/* ログアウトボタン */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-spotify-gray-300 hover:text-white hover:bg-spotify-gray-800 transition-all duration-200 group mt-8"
              >
                <LogOut className="h-5 w-5 group-hover:text-red-400 transition-colors duration-200" />
                <span>{t('navigation.logout')}</span>
              </button>
            </nav>
          )}
        </div>
      </div>

      {/* モバイルヘッダー */}
      <div className="lg:hidden">
        <div className="bg-spotify-black shadow-spotify-lg">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-spotify-green-500 rounded-full flex-center">
                  <Music className="h-5 w-5 text-black" />
                </div>
                <span className="text-lg font-bold text-white">Yadori</span>
              </Link>

              <div className="flex items-center space-x-2">
                {user && (
                  <>
                    <LanguageSwitcher />
                    <button
                      onClick={handleSignOut}
                      className="p-2 rounded-lg text-spotify-gray-300 hover:text-white hover:bg-spotify-gray-800 transition-all duration-200"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* モバイルナビゲーション */}
        {user && (
          <div className="fixed bottom-0 left-0 right-0 bg-spotify-black border-t border-spotify-gray-800 z-50">
            <div className="grid grid-cols-4 gap-1 px-2 py-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'text-spotify-green-500'
                        : 'text-spotify-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* メインコンテンツ */}
      <div className={`${user ? 'lg:pl-64' : ''}`}>
        <main className={`${user ? 'pb-20 lg:pb-8' : ''} px-4 py-8 lg:px-8`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}