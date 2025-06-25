import { styled } from '@tamagui/core'
import { Input as TamaguiInput } from '@tamagui/input'

export const Input = styled(TamaguiInput, {
  name: 'YadoriInput',
  backgroundColor: '$backgroundHover',
  borderColor: '$borderColor',
  borderWidth: 1,
  borderRadius: '$3',
  color: '$color',
  placeholderTextColor: '$placeholderColor',
  paddingHorizontal: '$3',
  height: '$4',
  fontSize: '$4',
  focusStyle: {
    borderColor: '$borderColorFocus',
    backgroundColor: '$backgroundFocus',
  },
  variants: {
    size: {
      sm: {
        height: '$3',
        fontSize: '$3',
        paddingHorizontal: '$2',
      },
      md: {
        height: '$4',
        fontSize: '$4',
        paddingHorizontal: '$3',
      },
      lg: {
        height: '$5',
        fontSize: '$5',
        paddingHorizontal: '$4',
      },
    },
    error: {
      true: {
        borderColor: '$red',
      },
    },
  } as const,
  defaultVariants: {
    size: 'md',
  },
})