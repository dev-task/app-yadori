import React, { useState, useEffect } from 'react'
import { View, ScrollView, Alert } from 'react-native'
import { Text, Card, Button, ProfileForm } from '@yadori/ui'
import { useAuth, useI18n, supabase } from '@yadori/logic'
import { router } from 'expo-router'

interface UserProfile {
  id: string
  nickname: string
  email: string
  bio: string
  created_at: string
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  const { t } = useI18n()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email || '',
              nickname: user.email?.split('@')[0] || 'ユーザー',
              bio: ''
            })
            .select()
            .single()

          if (insertError) throw insertError
          setProfile(newProfile)
        } else {
          throw error
        }
      } else {
        setProfile(data)
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      setError(t('profile.profileUpdateError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (data: { nickname: string; bio: string }) => {
    if (!user || !profile) return

    setSaving(true)
    setError('')

    try {
      const { error } = await supabase
        .from('users')
        .update({
          nickname: data.nickname,
          bio: data.bio
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => prev ? {
        ...prev,
        nickname: data.nickname,
        bio: data.bio
      } : null)

      setIsEditing(false)
      Alert.alert('成功', t('profile.profileUpdated'))
    } catch (error: any) {
      console.error('Profile update error:', error)
      setError(t('profile.profileUpdateError'))
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut()
              router.replace('/(auth)/signin')
            } catch (error) {
              console.error('Sign out error:', error)
            }
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
        <Text>{t('common.loading')}</Text>
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
        <Text color="error">{t('profile.profileUpdateError')}</Text>
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#121212' }}>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Profile Header */}
        <Card style={{ padding: 24, alignItems: 'center' }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#1db954',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#000' }}>
              {profile.nickname.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <Text variant="heading" style={{ marginBottom: 8 }}>
            {profile.nickname}
          </Text>
          
          <Text color="secondary" style={{ marginBottom: 16 }}>
            {profile.email}
          </Text>

          {profile.bio ? (
            <Text style={{ textAlign: 'center', marginBottom: 16 }}>
              {profile.bio}
            </Text>
          ) : (
            <Text color="secondary" style={{ textAlign: 'center', marginBottom: 16 }}>
              {t('profile.noIntroduction')}
            </Text>
          )}

          <Text color="secondary" style={{ fontSize: 12 }}>
            {new Date(profile.created_at).toLocaleDateString('ja-JP')} {t('profile.joinedDate')}
          </Text>
        </Card>

        {/* Edit Profile */}
        {isEditing ? (
          <ProfileForm
            initialData={{ nickname: profile.nickname, bio: profile.bio }}
            onSave={handleSaveProfile}
            loading={saving}
            error={error}
          />
        ) : (
          <Card style={{ padding: 16 }}>
            <Button onPress={() => setIsEditing(true)}>
              <Text>{t('profile.editProfile')}</Text>
            </Button>
          </Card>
        )}

        {/* Sign Out */}
        <Card style={{ padding: 16 }}>
          <Button variant="secondary" onPress={handleSignOut}>
            <Text>{t('navigation.logout')}</Text>
          </Button>
        </Card>
      </View>
    </ScrollView>
  )
}