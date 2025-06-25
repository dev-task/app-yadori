import React, { useState, useEffect } from 'react'
import { View, ScrollView, Alert, Switch } from 'react-native'
import { Text, Card, Button, ProfileForm } from '@yadori/ui'
import { useAuth, useI18n, supabase, usePushNotifications } from '@yadori/logic'
import { router } from 'expo-router'
import { Bell, BellOff, TestTube } from '@expo/vector-icons/Feather'

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
  const { 
    isRegistered, 
    error: pushError, 
    registerForPushNotifications, 
    unregisterDevice,
    testNotification 
  } = usePushNotifications()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(isRegistered)

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  useEffect(() => {
    setPushNotificationsEnabled(isRegistered)
  }, [isRegistered])

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

  const handlePushNotificationToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        await registerForPushNotifications()
      } else {
        await unregisterDevice()
      }
      setPushNotificationsEnabled(enabled)
    } catch (error) {
      console.error('Error toggling push notifications:', error)
      Alert.alert('エラー', 'プッシュ通知の設定に失敗しました')
    }
  }

  const handleTestNotification = async () => {
    try {
      await testNotification()
      Alert.alert('成功', 'テスト通知を送信しました')
    } catch (error) {
      console.error('Error sending test notification:', error)
      Alert.alert('エラー', 'テスト通知の送信に失敗しました')
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
              // Unregister push notifications before signing out
              if (isRegistered) {
                await unregisterDevice()
              }
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

        {/* Push Notification Settings */}
        <Card style={{ padding: 16 }}>
          <Text variant="subheading" style={{ marginBottom: 16 }}>
            通知設定
          </Text>
          
          <View style={{ gap: 16 }}>
            {/* Push Notifications Toggle */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingVertical: 8
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {pushNotificationsEnabled ? (
                  <Bell size={20} color="#1db954" />
                ) : (
                  <BellOff size={20} color="#727272" />
                )}
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ fontWeight: '600' }}>プッシュ通知</Text>
                  <Text color="secondary" style={{ fontSize: 12 }}>
                    いいねやコメントの通知を受け取る
                  </Text>
                </View>
              </View>
              <Switch
                value={pushNotificationsEnabled}
                onValueChange={handlePushNotificationToggle}
                trackColor={{ false: '#404040', true: '#1db954' }}
                thumbColor={pushNotificationsEnabled ? '#fff' : '#727272'}
              />
            </View>

            {/* Push Notification Status */}
            {pushError && (
              <View style={{ 
                backgroundColor: 'rgba(220, 38, 38, 0.1)', 
                padding: 12, 
                borderRadius: 8,
                borderColor: '#dc2626',
                borderWidth: 1
              }}>
                <Text color="error" style={{ fontSize: 12 }}>
                  {pushError}
                </Text>
              </View>
            )}

            {isRegistered && (
              <View style={{ 
                backgroundColor: 'rgba(29, 185, 84, 0.1)', 
                padding: 12, 
                borderRadius: 8,
                borderColor: '#1db954',
                borderWidth: 1
              }}>
                <Text style={{ fontSize: 12, color: '#1db954' }}>
                  プッシュ通知が有効になっています
                </Text>
              </View>
            )}

            {/* Test Notification Button */}
            {isRegistered && (
              <Button
                variant="secondary"
                onPress={handleTestNotification}
                style={{ marginTop: 8 }}
              >
                <TestTube size={16} color="#1db954" />
                <Text style={{ marginLeft: 8 }}>テスト通知を送信</Text>
              </Button>
            )}
          </View>
        </Card>

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