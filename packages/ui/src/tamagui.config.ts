import { config } from '@tamagui/config/v3'
import { createTamagui } from '@tamagui/core'

const appConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    // Spotify-inspired dark theme
    dark: {
      ...config.themes.dark,
      background: '#121212',
      backgroundHover: '#181818',
      backgroundPress: '#282828',
      backgroundFocus: '#282828',
      color: '#ffffff',
      colorHover: '#ffffff',
      colorPress: '#b3b3b3',
      colorFocus: '#ffffff',
      borderColor: '#404040',
      borderColorHover: '#535353',
      borderColorPress: '#535353',
      borderColorFocus: '#1db954',
      placeholderColor: '#727272',
      green: '#1db954',
      greenHover: '#1ed760',
      greenPress: '#1aa34a',
    },
    light: {
      ...config.themes.light,
      // Keep light theme for web compatibility
    }
  }
})

export type AppConfig = typeof appConfig

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig