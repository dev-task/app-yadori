import React, { useState, useEffect } from 'react'
import { View, ScrollView, RefreshControl } from 'react-native'
import { Text, Card, Button } from '@yadori/ui'
import { useI18n, getReviews } from '@yadori/logic'
import { router } from 'expo-router'

export default function HomeScreen() {
  const { t } = useI18n()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const data = await getReviews(5) // Get latest 5 reviews
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchReviews()
    setRefreshing(false)
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#121212' }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={{ padding: 16, gap: 16 }}>
        {/* Hero Section */}
        <Card style={{ padding: 24 }}>
          <Text variant="heading" style={{ marginBottom: 16 }}>
            {t('home.title')}
          </Text>
          <Text color="secondary" style={{ marginBottom: 24, lineHeight: 20 }}>
            {t('home.subtitle')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button 
              style={{ flex: 1 }}
              onPress={() => router.push('/(tabs)/post')}
            >
              <Text>{t('home.postReview')}</Text>
            </Button>
            <Button 
              variant="secondary" 
              style={{ flex: 1 }}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Text>{t('home.searchReviews')}</Text>
            </Button>
          </View>
        </Card>

        {/* Latest Reviews */}
        <View>
          <Text variant="subheading" style={{ marginBottom: 16 }}>
            {t('home.latestReviews')}
          </Text>
          
          {loading ? (
            <Card style={{ padding: 24, alignItems: 'center' }}>
              <Text>{t('common.loading')}</Text>
            </Card>
          ) : reviews.length > 0 ? (
            <View style={{ gap: 12 }}>
              {reviews.map((review: any) => (
                <Card key={review.id} interactive style={{ padding: 16 }}>
                  <Text variant="subheading" style={{ marginBottom: 8 }}>
                    {review.address_text}
                  </Text>
                  <Text color="secondary" style={{ marginBottom: 8 }}>
                    by {review.users?.nickname || 'Unknown'}
                  </Text>
                  {review.pros_text && (
                    <Text numberOfLines={2} style={{ lineHeight: 18 }}>
                      {review.pros_text}
                    </Text>
                  )}
                </Card>
              ))}
            </View>
          ) : (
            <Card style={{ padding: 24, alignItems: 'center' }}>
              <Text color="secondary" style={{ marginBottom: 16 }}>
                まだレビューがありません
              </Text>
              <Button onPress={() => router.push('/(tabs)/post')}>
                <Text>最初のレビューを投稿</Text>
              </Button>
            </Card>
          )}
        </View>
      </View>
    </ScrollView>
  )
}