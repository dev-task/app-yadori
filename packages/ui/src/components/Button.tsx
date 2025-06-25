import { styled } from '@tamagui/core'
import { Button as TamaguiButton } from '@tamagui/button'

export const Button = styled(TamaguiButton, {
  name: 'YadoriButton',
  backgroundColor: '$green',
  color: '$background',
  borderRadius: '$4',
  fontWeight: '600',
  pressStyle: {
    backgroundColor: '$greenPress',
  },
  hoverStyle: {
    backgroundColor: '$greenHover',
  },
  variants: {
    variant: {
      primary: {
        backgroundColor: '$green',
        color: '$background',
      },
      secondary: {
        backgroundColor: 'transparent',
        borderColor: '$borderColor',
        borderWidth: 1,
        color: '$color',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '$color',
      },
    },
    size: {
      sm: {
        height: '$3',
        paddingHorizontal: '$3',
        fontSize: '$3',
      },
      md: {
        height: '$4',
        paddingHorizontal: '$4',
        fontSize: '$4',
      },
      lg: {
        height: '$5',
        paddingHorizontal: '$5',
        fontSize: '$5',
      },
    },
  } as const,
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
})