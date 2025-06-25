import React, { useState } from 'react'
import { View } from 'react-native'
import { Button } from './Button'
import { Input } from './Input'
import { Text } from './Text'
import { Card } from './Card'
import { useI18n } from '@yadori/logic'

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onToggleMode: () => void
  onSubmit: (email: string, password: string, nickname?: string) => Promise<void>
  loading?: boolean
  error?: string
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onToggleMode,
  onSubmit,
  loading = false,
  error
}) => {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')

  const handleSubmit = async () => {
    if (mode === 'signup') {
      await onSubmit(email, password, nickname)
    } else {
      await onSubmit(email, password)
    }
  }

  const isValid = email.trim() && password.trim() && (mode === 'signin' || nickname.trim())

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
      <Card style={{ padding: 24 }}>
        <Text variant="heading" style={{ textAlign: 'center', marginBottom: 24 }}>
          {mode === 'signup' ? t('auth.createAccount') : t('auth.welcomeBack')}
        </Text>

        <View style={{ gap: 16 }}>
          {mode === 'signup' && (
            <Input
              placeholder={t('auth.enterNickname')}
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="none"
            />
          )}

          <Input
            placeholder={t('auth.enterEmail')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            placeholder={t('auth.enterPassword')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {error && (
            <Text color="error" style={{ textAlign: 'center', fontSize: 14 }}>
              {error}
            </Text>
          )}

          <Button
            onPress={handleSubmit}
            disabled={!isValid || loading}
            style={{ marginTop: 8 }}
          >
            <Text>
              {loading 
                ? t('auth.processing') 
                : mode === 'signup' 
                  ? t('auth.signup') 
                  : t('auth.signin')
              }
            </Text>
          </Button>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
            <Text color="secondary" style={{ fontSize: 14 }}>
              {mode === 'signup' ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
            </Text>
            <Button variant="ghost" onPress={onToggleMode} style={{ padding: 0, marginLeft: 8 }}>
              <Text color="accent" style={{ fontSize: 14 }}>
                {mode === 'signup' ? t('auth.signin') : t('auth.signup')}
              </Text>
            </Button>
          </View>
        </View>
      </Card>
    </View>
  )
}