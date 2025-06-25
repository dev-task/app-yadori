import React, { useState } from 'react'
import { View, Alert } from 'react-native'
import { router } from 'expo-router'
import { AuthForm } from '@yadori/ui'
import { useAuth, useI18n } from '@yadori/logic'

export default function SignInScreen() {
  const { signIn } = useAuth()
  const { t } = useI18n()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (email: string, password: string, nickname?: string) => {
    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        // Signup logic will be handled by useAuth hook
        await signIn(email, password) // For now, just sign in after signup
      } else {
        await signIn(email, password)
      }
      router.replace('/(tabs)')
    } catch (error: any) {
      setError(error.message || t('errors.general'))
    } finally {
      setLoading(false)
    }
  }

  const handleToggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError('')
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      <AuthForm
        mode={mode}
        onToggleMode={handleToggleMode}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />
    </View>
  )
}