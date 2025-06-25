import { View } from 'react-native'
import { Text, Card, Button } from '@yadori/ui'

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#121212', padding: 16 }}>
      <Text variant="heading" style={{ marginBottom: 16 }}>
        Welcome to Yadori
      </Text>
      
      <Card style={{ marginBottom: 16 }}>
        <Text variant="subheading" style={{ marginBottom: 8 }}>
          Share Your Housing Experience
        </Text>
        <Text variant="body" color="secondary" style={{ marginBottom: 16 }}>
          A platform to share and discover real housing information based on actual living experiences.
        </Text>
        <Button>
          <Text>Get Started</Text>
        </Button>
      </Card>
    </View>
  )
}