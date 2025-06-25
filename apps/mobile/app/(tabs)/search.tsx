import React, { useState, useEffect } from 'react'
import { View, ScrollView, RefreshControl, FlatList, TouchableOpacity } from 'react-native'
import { Text, Card, Button, Input } from '@yadori/ui'
import { useI18n, getReviews } from '@yadori/logic'
import { router } from 'expo-router'
import { Search, MapPin, Star, Calendar, DollarSign } from '@expo/vector-icons/Feather'

interface Review {
  id: number
  address_text: string
  rent: number | null
  layout: string
  period_lived: string
  pros_text: string
  cons_text: string
  rating_location: number | null
  rating_sunlight: number | null
  rating_soundproof: number | null
  rating_environment: number | null
  created_at: string
  users: {
    nickname: string
  }
  review_images?: {
    image_url: string
  }[]
}

export default function SearchScreen() {
  const { t } = useI18n()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])

  useEffect(() => {
    fetchReviews()
  }, [])

  useEffect(() => {
    // Filter reviews based on search query
    if (searchQuery.trim()) {
      const filtered = reviews.filter(review =>
        review.address_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.users.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.layout.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredReviews(filtered)
    } else {
      setFilteredReviews(reviews)
    }
  }, [searchQuery, reviews])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const data = await getReviews() // Get all reviews
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

  const getAverageRating = (review: Review) => {
    const ratings = [
      review.rating_location,
      review.rating_sunlight,
      review.rating_soundproof,
      review.rating_environment
    ].filter(rating => rating !== null) as number[]
    
    if (ratings.length === 0) return null
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatRent = (rent: number | null) => {
    if (!rent) return null
    return `${rent.toLocaleString()}円`
  }

  const renderReviewItem = ({ item }: { item: Review }) => {
    const averageRating = getAverageRating(item)

    return (
      <TouchableOpacity
        onPress={() => router.push(`/review/${item.id}`)}
        style={{ marginBottom: 12 }}
      >
        <Card interactive style={{ padding: 16 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <MapPin size={16} color="#1db954" />
                <Text variant="subheading" style={{ marginLeft: 6, flex: 1 }} numberOfLines={2}>
                  {item.address_text}
                </Text>
              </View>
              <Text color="secondary" style={{ fontSize: 12 }}>
                by {item.users.nickname} • {formatDate(item.created_at)}
              </Text>
            </View>
            {averageRating && (
              <View style={{ 
                backgroundColor: '#1db954', 
                paddingHorizontal: 8, 
                paddingVertical: 4, 
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <Star size={12} color="#000" />
                <Text style={{ color: '#000', fontSize: 12, fontWeight: 'bold', marginLeft: 2 }}>
                  {averageRating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          {/* Basic Info */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            {formatRent(item.rent) && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <DollarSign size={14} color="#1db954" />
                <Text style={{ fontSize: 12, marginLeft: 4 }}>{formatRent(item.rent)}</Text>
              </View>
            )}
            {item.layout && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#727272' }}>間取り: </Text>
                <Text style={{ fontSize: 12 }}>{item.layout}</Text>
              </View>
            )}
            {item.period_lived && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Calendar size={14} color="#8b5cf6" />
                <Text style={{ fontSize: 12, marginLeft: 4 }}>{item.period_lived}</Text>
              </View>
            )}
          </View>

          {/* Preview Text */}
          {(item.pros_text || item.cons_text) && (
            <Text color="secondary" style={{ fontSize: 14, lineHeight: 20 }} numberOfLines={2}>
              {item.pros_text && item.pros_text.length > 0 
                ? item.pros_text 
                : item.cons_text}
            </Text>
          )}
        </Card>
      </TouchableOpacity>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      {/* Search Header */}
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <Text variant="heading" style={{ marginBottom: 16 }}>
          住まいの口コミ一覧
        </Text>
        
        <View style={{ position: 'relative' }}>
          <Input
            placeholder="駅名、エリア、物件名で検索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ paddingLeft: 40 }}
          />
          <View style={{ 
            position: 'absolute', 
            left: 12, 
            top: 0, 
            bottom: 0, 
            justifyContent: 'center' 
          }}>
            <Search size={16} color="#727272" />
          </View>
        </View>

        <Text color="secondary" style={{ fontSize: 12, marginTop: 8 }}>
          {filteredReviews.length}件のレビューが見つかりました
        </Text>
      </div>

      {/* Results */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>{t('common.loading')}</Text>
        </View>
      ) : filteredReviews.length > 0 ? (
        <FlatList
          data={filteredReviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <Card style={{ padding: 24, alignItems: 'center', width: '100%' }}>
            <Search size={48} color="#727272" style={{ marginBottom: 16 }} />
            <Text variant="subheading" style={{ marginBottom: 8, textAlign: 'center' }}>
              レビューが見つかりませんでした
            </Text>
            <Text color="secondary" style={{ marginBottom: 16, textAlign: 'center' }}>
              検索条件を変更するか、新しいレビューを投稿してみてください
            </Text>
            <Button onPress={() => router.push('/(tabs)/post')}>
              <Text>レビューを投稿</Text>
            </Button>
          </Card>
        </View>
      )}
    </View>
  )
}