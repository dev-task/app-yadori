import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export interface PushNotificationState {
  expoPushToken: string | null
  notification: Notifications.Notification | null
  error: string | null
  isRegistered: boolean
}

export const usePushNotifications = () => {
  const { user } = useAuth()
  const [pushState, setPushState] = useState<PushNotificationState>({
    expoPushToken: null,
    notification: null,
    error: null,
    isRegistered: false
  })

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync()
    }
  }, [user])

  useEffect(() => {
    // Listen for incoming notifications
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setPushState(prev => ({ ...prev, notification }))
      console.log('Notification received:', notification)
    })

    // Listen for notification interactions
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data
      
      // Handle notification tap
      if (data?.type === 'like' || data?.type === 'comment') {
        console.log('Notification tapped - Navigate to review:', data.reviewId)
        // TODO: Implement navigation to review detail page
        // This would need to be implemented with your navigation system
        // Example: router.push(`/review/${data.reviewId}`)
      }
    })

    return () => {
      Notifications.removeNotificationSubscription(notificationListener)
      Notifications.removeNotificationSubscription(responseListener)
    }
  }, [])

  const registerForPushNotificationsAsync = async () => {
    if (!user) {
      console.log('No user found, skipping push notification registration')
      return
    }

    try {
      if (!Device.isDevice) {
        const errorMsg = 'Must use physical device for Push Notifications'
        console.warn(errorMsg)
        setPushState(prev => ({ 
          ...prev, 
          error: errorMsg 
        }))
        return
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        const errorMsg = 'Push notification permission denied'
        console.warn(errorMsg)
        setPushState(prev => ({ 
          ...prev, 
          error: errorMsg 
        }))
        return
      }

      // Get Expo push token
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID || 'yadori-mobile-app'
      const token = await Notifications.getExpoPushTokenAsync({
        projectId
      })

      console.log('Expo push token obtained:', token.data)

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1db954',
          sound: 'default',
        })
      }

      // Save token to database
      await saveTokenToDatabase(token.data)

      setPushState(prev => ({
        ...prev,
        expoPushToken: token.data,
        isRegistered: true,
        error: null
      }))

      console.log('Push notifications registered successfully')

    } catch (error: any) {
      console.error('Error registering for push notifications:', error)
      setPushState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to register for push notifications' 
      }))
    }
  }

  const saveTokenToDatabase = async (token: string) => {
    if (!user) {
      throw new Error('No user found')
    }

    try {
      const deviceType = Platform.OS === 'ios' ? 'ios' : 'android'
      
      console.log('Saving push token to database:', { token, userId: user.id, deviceType })
      
      // Upsert the device token
      const { error } = await supabase
        .from('user_devices')
        .upsert({
          push_token: token,
          user_id: user.id,
          device_type: deviceType,
          platform: 'mobile',
          active: true
        }, {
          onConflict: 'push_token'
        })

      if (error) {
        console.error('Error saving push token:', error)
        throw error
      }

      console.log('Push token saved successfully to database')
    } catch (error) {
      console.error('Failed to save push token to database:', error)
      throw error
    }
  }

  const unregisterDevice = async () => {
    if (!user || !pushState.expoPushToken) {
      console.log('No user or token found for unregistration')
      return
    }

    try {
      console.log('Unregistering device:', pushState.expoPushToken)
      
      const { error } = await supabase
        .from('user_devices')
        .update({ active: false })
        .eq('push_token', pushState.expoPushToken)
        .eq('user_id', user.id)

      if (error) throw error

      setPushState(prev => ({
        ...prev,
        isRegistered: false,
        expoPushToken: null
      }))

      console.log('Device unregistered successfully')
    } catch (error) {
      console.error('Error unregistering device:', error)
    }
  }

  const testNotification = async () => {
    if (!pushState.expoPushToken) {
      console.warn('No push token available for testing')
      return
    }

    try {
      // Send a test notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "テスト通知",
          body: "プッシュ通知が正常に動作しています！",
          data: { type: 'test' },
        },
        trigger: { seconds: 1 },
      })

      console.log('Test notification scheduled')
    } catch (error) {
      console.error('Error sending test notification:', error)
    }
  }

  return {
    ...pushState,
    registerForPushNotifications: registerForPushNotificationsAsync,
    unregisterDevice,
    testNotification
  }
}