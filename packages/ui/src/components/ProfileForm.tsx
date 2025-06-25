import React, { useState, useEffect } from 'react'
import { View } from 'react-native'
import { Button } from './Button'
import { Input } from './Input'
import { Text } from './Text'
import { Card } from './Card'
import { useI18n } from '@yadori/logic'

interface ProfileData {
  nickname: string
  bio: string
}

interface ProfileFormProps {
  initialData?: ProfileData
  onSave: (data: ProfileData) => Promise<void>
  loading?: boolean
  error?: string
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,
  onSave,
  loading = false,
  error
}) => {
  const { t } = useI18n()
  const [nickname, setNickname] = useState(initialData?.nickname || '')
  const [bio, setBio] = useState(initialData?.bio || '')

  useEffect(() => {
    if (initialData) {
      setNickname(initialData.nickname)
      setBio(initialData.bio)
    }
  }, [initialData])

  const handleSave = async () => {
    await onSave({ nickname: nickname.trim(), bio: bio.trim() })
  }

  const isValid = nickname.trim().length > 0

  return (
    <Card style={{ padding: 24 }}>
      <Text variant="subheading" style={{ marginBottom: 16 }}>
        {t('profile.editProfile')}
      </Text>

      <View style={{ gap: 16 }}>
        <View>
          <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600' }}>
            {t('auth.nickname')} <Text color="error">*</Text>
          </Text>
          <Input
            placeholder={t('profile.enterNickname')}
            value={nickname}
            onChangeText={setNickname}
            maxLength={50}
          />
        </View>

        <View>
          <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600' }}>
            自己紹介
          </Text>
          <Input
            placeholder={t('profile.enterIntroduction')}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            maxLength={500}
            style={{ height: 100, textAlignVertical: 'top' }}
          />
          <Text color="secondary" style={{ fontSize: 12, marginTop: 4 }}>
            {bio.length}/500文字
          </Text>
        </View>

        {error && (
          <Text color="error" style={{ textAlign: 'center', fontSize: 14 }}>
            {error}
          </Text>
        )}

        <Button
          onPress={handleSave}
          disabled={!isValid || loading}
          style={{ marginTop: 8 }}
        >
          <Text>
            {loading ? t('profile.saving') : t('profile.saveProfile')}
          </Text>
        </Button>
      </View>
    </Card>
  )
}