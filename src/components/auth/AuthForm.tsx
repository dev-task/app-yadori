import React, { useState } from 'react'
import { Mail, Lock, User, Eye, EyeOff, Music, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onToggleMode: () => void
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onToggleMode }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  const { signIn, signUp } = useAuth()
  const { t } = useI18n()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        await signUp(email, password, nickname)
        // アカウント作成成功時にメール確認画面を表示
        setRegisteredEmail(email)
        setShowEmailConfirmation(true)
        // フォームをリセット
        setEmail('')
        setPassword('')
        setNickname('')
      } else {
        await signIn(email, password)
      }
    } catch (error: any) {
      setError(error.message || t('errors.general'))
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setShowEmailConfirmation(false)
    setRegisteredEmail('')
    onToggleMode() // ログインモードに切り替え
  }

  // メール確認画面
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* ヘッダー */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-spotify-green-500 rounded-full flex-center mb-6 shadow-glow">
              <CheckCircle className="h-8 w-8 text-black" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {t('auth.emailSent')}
            </h2>
            <p className="text-spotify-gray-300">
              {t('auth.emailSentDescription')}
            </p>
          </div>

          {/* メール確認カード */}
          <div className="card bg-spotify-gray-800 border border-spotify-gray-700">
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-spotify-blue-500 bg-opacity-20 rounded-full flex-center mx-auto">
                  <Mail className="h-8 w-8 text-spotify-blue-400" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">
                    {t('auth.checkYourEmail')}
                  </h3>
                  <p className="text-spotify-gray-300 text-sm leading-relaxed">
                    {t('auth.emailSentTo')} <span className="font-medium text-spotify-green-400">{registeredEmail}</span>
                  </p>
                  <p className="text-spotify-gray-400 text-sm">
                    {t('auth.clickLinkToVerify')}
                  </p>
                </div>
              </div>

              <div className="bg-spotify-blue-500 bg-opacity-10 border border-spotify-blue-500 border-opacity-30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-spotify-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-spotify-blue-300 font-medium mb-1">
                      {t('auth.emailNotReceived')}
                    </p>
                    <ul className="text-spotify-blue-200 space-y-1 text-xs">
                      <li>• {t('auth.checkSpamFolder')}</li>
                      <li>• {t('auth.waitFewMinutes')}</li>
                      <li>• {t('auth.checkEmailAddress')}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleBackToLogin}
                  className="btn-primary w-full"
                >
                  {t('auth.backToLogin')}
                </button>
                
                <div className="text-center">
                  <button
                    onClick={() => {
                      setShowEmailConfirmation(false)
                      setRegisteredEmail('')
                      // サインアップモードに戻る
                    }}
                    className="text-spotify-gray-400 hover:text-white text-sm transition-colors duration-200"
                  >
                    {t('auth.tryDifferentEmail')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* フッター */}
          <div className="text-center">
            <p className="text-spotify-gray-500 text-xs">
              {t('auth.emailVerificationNote')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-spotify-green-500 rounded-full flex-center mb-6 shadow-glow">
            <Music className="h-8 w-8 text-black" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {mode === 'signup' ? t('auth.createAccount') : t('auth.welcomeBack')}
          </h2>
          <p className="text-spotify-gray-300">
            {mode === 'signup' 
              ? t('auth.shareExperience')
              : 'Yadoriへログイン'}
          </p>
        </div>

        {/* フォーム */}
        <div className="card bg-spotify-gray-800 border border-spotify-gray-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="space-y-2">
                <label htmlFor="nickname" className="block text-sm font-medium text-spotify-gray-300">
                  {t('auth.nickname')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-spotify-gray-400" />
                  </div>
                  <input
                    id="nickname"
                    name="nickname"
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="input-field pl-12 w-full"
                    placeholder={t('auth.enterNickname')}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-spotify-gray-300">
                {t('auth.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-spotify-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12 w-full"
                  placeholder={t('auth.enterEmail')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-spotify-gray-300">
                {t('auth.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-spotify-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12 pr-12 w-full"
                  placeholder={t('auth.enterPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-spotify-gray-400 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 text-red-400 px-4 py-3 rounded-lg text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="spinner w-5 h-5"></div>
                    <span>{t('auth.processing')}</span>
                  </div>
                ) : (
                  mode === 'signup' ? t('auth.createAccount') : t('auth.signin')
                )}
              </button>

              <div className="text-center">
                <span className="text-spotify-gray-400 text-sm">
                  {mode === 'signup' ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
                </span>
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="ml-2 text-spotify-green-400 hover:text-spotify-green-300 text-sm font-medium transition-colors duration-200"
                >
                  {mode === 'signup' ? t('auth.signin') : t('auth.signup')}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* フッター */}
        <div className="text-center">
          <p className="text-spotify-gray-500 text-xs">
            {t('auth.termsAndPrivacy')}
          </p>
        </div>
      </div>
    </div>
  )
}