import { styled } from '@tamagui/core'
import { Text as TamaguiText } from '@tamagui/text'

export const Text = styled(TamaguiText, {
  name: 'YadoriText',
  color: '$color',
  variants: {
    variant: {
      heading: {
        fontWeight: 'bold',
        fontSize: '$6',
      },
      subheading: {
        fontWeight: '600',
        fontSize: '$5',
      },
      body: {
        fontSize: '$4',
      },
      caption: {
        fontSize: '$3',
        color: '$colorPress',
      },
    },
    color: {
      primary: {
        color: '$color',
      },
      secondary: {
        color: '$colorPress',
      },
      accent: {
        color: '$green',
      },
      error: {
        color: '$red',
      },
    },
  } as const,
  defaultVariants: {
    variant: 'body',
    color: 'primary',
  },
})