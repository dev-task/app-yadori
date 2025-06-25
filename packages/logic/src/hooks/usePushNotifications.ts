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
    })

    // Listen for notification interactions
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data
      
      // Handle notification tap
      if (data?.type === 'like' || data?.type === 'comment') {
        // Navigate to review detail page
        // This would need to be implemented with your navigation system
        console.log('Navigate to review:', data.reviewId)
      }
    })

    return () => {
      Notifications.removeNotificationSubscription(notificationListener)
      Notifications.removeNotificationSubscription(responseListener)
    }
  }, [])

  const registerForPushNotificationsAsync = async () => {
    if (!user) return

    try {
      if (!Device.isDevice) {
        setPushState(prev => ({ 
          ...prev, 
          error: 'Must use physical device for Push Notifications' 
        }))
        return
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        setPushState(prev => ({ 
          ...prev, 
          error: 'Failed to get push token for push notification!' 
        }))
        return
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id'
      })

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
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

    } catch (error: any) {
      console.error('Error registering for push notifications:', error)
      setPushState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to register for push notifications' 
      }))
    }
  }

  const saveTokenToDatabase = async (token: string) => {
    if (!user) return

    try {
      const deviceType = Platform.OS === 'ios' ? 'ios' : 'android'
      
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

      console.log('Push token saved successfully')
    } catch (error) {
      console.error('Failed to save push token to database:', error)
      throw error
    }
  }

  const unregisterDevice = async () => {
    if (!user || !pushState.expoPushToken) return

    try {
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
    } catch (error) {
      console.error('Error unregistering device:', error)
    }
  }

  return {
    ...pushState,
    registerForPushNotifications: registerForPushNotificationsAsync,
    unregisterDevice
  }
}