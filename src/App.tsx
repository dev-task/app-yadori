import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { I18nProvider } from './contexts/I18nContext'
import { Layout } from './components/Layout'
import { AuthForm } from './components/auth/AuthForm'
import { HomePage } from './pages/HomePage'
import { PostPage } from './pages/PostPage'
import { ReviewDetailPage } from './pages/ReviewDetailPage'
import { ReviewListPage } from './pages/ReviewListPage'
import { ProfilePage } from './pages/ProfilePage'

const AuthWrapper: React.FC = () => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  
  return (
    <AuthForm 
      mode={authMode} 
      onToggleMode={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} 
    />
  )
}

const AppContent: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center space-y-4">
          <div className="spinner w-12 h-12 mx-auto"></div>
          <p className="text-spotify-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthWrapper />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<ReviewListPage />} />
        <Route path="/post" element={<PostPage />} />
        <Route path="/review/:id" element={<ReviewDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </I18nProvider>
  )
}

export default App