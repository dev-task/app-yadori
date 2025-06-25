import { Stack } from 'expo-router'
import { TamaguiProvider } from '@tamagui/core'
import config from '@yadori/ui/tamagui.config'

export default function RootLayout() {
  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </TamaguiProvider>
  )
}