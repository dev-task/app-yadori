import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { TamaguiProvider } from '@tamagui/core'
import config from '@yadori/ui/tamagui.config'
import { useAuth } from '@yadori/logic'
import '@yadori/logic/src/i18n'

export default function RootLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return null // Show loading screen
  }

  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <Stack screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="(auth)" />
        )}
      </Stack>
    </TamaguiProvider>
  )
}