import { styled } from '@tamagui/core'
import { Card as TamaguiCard } from '@tamagui/card'

export const Card = styled(TamaguiCard, {
  name: 'YadoriCard',
  backgroundColor: '$backgroundHover',
  borderRadius: '$4',
  padding: '$4',
  borderColor: '$borderColor',
  borderWidth: 1,
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
  variants: {
    interactive: {
      true: {
        pressStyle: {
          scale: 0.98,
          backgroundColor: '$backgroundPress',
        },
        hoverStyle: {
          backgroundColor: '$backgroundPress',
          borderColor: '$borderColorHover',
        },
      },
    },
    padding: {
      sm: {
        padding: '$2',
      },
      md: {
        padding: '$4',
      },
      lg: {
        padding: '$6',
      },
    },
  } as const,
  defaultVariants: {
    padding: 'md',
  },
})