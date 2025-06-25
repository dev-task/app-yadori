import React, { useState, useEffect } from 'react'
import { View, ScrollView, Image, TouchableOpacity, Alert } from 'react-native'
import { Text, Card, Button } from '@yadori/ui'
import { useLocalSearchParams, router } from 'expo-router'
import { useAuth, useI18n, getReview, supabase } from '@yadori/logic'
import { MapPin, Star, Heart, MessageCircle, User, Calendar, DollarSign, Home, ArrowLeft } from '@expo/vector-icons/Feather'

interface Review {
  id: number
  user_id: string
  address_text: string
  latitude: number | null
  longitude: number | null
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
  review_images: {
    id: number
    image_url: string
  }[]
  comments: Array<{
    id: number
    body: string
    created_at: string
    users: {
      nickname: string
    }
  }>
}

export default function ReviewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { t } = useI18n()
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    if (id) {
      fetchReview()
    }
  }, [id])

  const fetchReview = async () => {
    if (!id) return

    try {
      setLoading(true)
      const data = await getReview(parseInt(id))
      setReview(data)

      // Check if user liked this review
      if (user) {
        const { data: userLike } = await supabase
          .from('likes')
          .select('user_id')
          .eq('review_id', parseInt(id))
          .eq('user_id', user.id)
          .maybeSingle()

        setIsLiked(!!userLike)
      }

      // Get like count
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', parseInt(id))

      setLikeCount(count || 0)
    } catch (error: any) {
      console.error('Error fetching review:', error)
      setError('レビューの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!user || !review) {
      Alert.alert('エラー', 'いいねするにはログインが必要です')
      return
    }

    try {
      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('review_id', review.id)
          .eq('user_id', user.id)

        if (error) throw error

        setIsLiked(false)
        setLikeCount(prev => prev - 1)
      } else {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert({
            review_id: review.id,
            user_id: user.id
          })

        if (error) throw error

        setIsLiked(true)
        setLikeCount(prev => prev + 1)
      }
    } catch (error: any) {
      console.error('Like error:', error)
      Alert.alert('エラー', 'いいねの処理に失敗しました')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatRent = (rent: number | null) => {
    if (!rent) return null
    return `${rent.toLocaleString()}円`
  }

  const getRatingText = (rating: number | null) => {
    if (!rating) return '未評価'
    return rating === 1 ? '不満' : rating === 2 ? 'やや不満' : rating === 3 ? '普通' : rating === 4 ? '満足' : '非常に満足'
  }

  const getAverageRating = () => {
    if (!review) return null
    const ratings = [
      review.rating_location,
      review.rating_sunlight,
      review.rating_soundproof,
      review.rating_environment
    ].filter(rating => rating !== null) as number[]
    
    if (ratings.length === 0) return null
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
  }

  const RatingDisplay: React.FC<{ 
    label: string
    rating: number | null 
    icon: React.ReactNode
    color: string
  }> = ({ label, rating, icon, color }) => (
    <View style={{ 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: '#181818',
      borderRadius: 12,
      marginBottom: 8
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ 
          width: 40, 
          height: 40, 
          backgroundColor: color, 
          borderRadius: 12, 
          justifyContent: 'center', 
          alignItems: 'center',
          marginRight: 12
        }}>
          {icon}
        </View>
        <Text style={{ fontWeight: '600' }}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', marginRight: 12 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={16}
              color={rating && rating >= star ? '#1db954' : '#404040'}
              fill={rating && rating >= star ? '#1db954' : 'transparent'}
            />
          ))}
        </View>
        <Text color="secondary" style={{ fontSize: 12, minWidth: 60, textAlign: 'right' }}>
          {getRatingText(rating)}
        </Text>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
        <Text>{t('common.loading')}</Text>
      </View>
    )
  }

  if (error || !review) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Card style={{ padding: 24, alignItems: 'center', width: '100%' }}>
          <Text color="error" style={{ marginBottom: 16, textAlign: 'center' }}>
            {error || 'レビューが見つかりません'}
          </Text>
          <Button onPress={() => router.back()}>
            <Text>戻る</Text>
          </Button>
        </Card>
      </View>
    )
  }

  const averageRating = getAverageRating()

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#121212' }}>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text variant="heading" style={{ flex: 1 }}>
            レビュー詳細
          </Text>
        </View>

        {/* Main Info */}
        <Card style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#1db954',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <User size={24} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 16 }}>
                {review.users.nickname}
              </Text>
              <Text color="secondary" style={{ fontSize: 12 }}>
                {formatDate(review.created_at)}
              </Text>
            </View>
            {averageRating && (
              <View style={{ 
                backgroundColor: '#1db954', 
                paddingHorizontal: 12, 
                paddingVertical: 6, 
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <Star size={16} color="#000" fill="#000" />
                <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold', marginLeft: 4 }}>
                  {averageRating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <MapPin size={20} color="#1db954" style={{ marginTop: 2, marginRight: 8 }} />
            <Text variant="subheading" style={{ flex: 1, lineHeight: 24 }}>
              {review.address_text}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity
              onPress={handleLike}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isLiked ? '#dc2626' : '#404040',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20
              }}
            >
              <Heart size={16} color={isLiked ? '#fff' : '#727272'} fill={isLiked ? '#fff' : 'transparent'} />
              <Text style={{ marginLeft: 6, color: isLiked ? '#fff' : '#727272' }}>
                {likeCount} {isLiked ? 'いいね済み' : 'いいね'}
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MessageCircle size={16} color="#727272" />
              <Text color="secondary" style={{ marginLeft: 6 }}>
                {review.comments.length} コメント
              </Text>
            </View>
          </View>
        </Card>

        {/* Basic Info */}
        {(formatRent(review.rent) || review.layout || review.period_lived) && (
          <Card style={{ padding: 16 }}>
            <Text variant="subheading" style={{ marginBottom: 16 }}>
              基本情報
            </Text>
            
            <View style={{ gap: 12 }}>
              {formatRent(review.rent) && (
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                  <DollarSign size={20} color="#1db954" />
                  <Text style={{ marginLeft: 12, fontWeight: '600' }}>家賃</Text>
                  <Text style={{ marginLeft: 'auto' }}>{formatRent(review.rent)}</Text>
                </View>
              )}

              {review.layout && (
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                  <Home size={20} color="#2e77d0" />
                  <Text style={{ marginLeft: 12, fontWeight: '600' }}>間取り</Text>
                  <Text style={{ marginLeft: 'auto' }}>{review.layout}</Text>
                </View>
              )}

              {review.period_lived && (
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                  <Calendar size={20} color="#8b5cf6" />
                  <Text style={{ marginLeft: 12, fontWeight: '600' }}>居住期間</Text>
                  <Text style={{ marginLeft: 'auto' }}>{review.period_lived}</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Images */}
        {review.review_images && review.review_images.length > 0 && (
          <Card style={{ padding: 16 }}>
            <Text variant="subheading" style={{ marginBottom: 16 }}>
              写真 ({review.review_images.length})
            </Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {review.review_images.map((image) => (
                <Image
                  key={image.id}
                  source={{ uri: image.image_url }}
                  style={{ 
                    width: (100 - 32) / 3, // 3 columns with gaps
                    aspectRatio: 1,
                    borderRadius: 8
                  }}
                />
              ))}
            </View>
          </Card>
        )}

        {/* Ratings */}
        <Card style={{ padding: 16 }}>
          <Text variant="subheading" style={{ marginBottom: 16 }}>
            評価
          </Text>
          
          <RatingDisplay 
            label="立地" 
            rating={review.rating_location} 
            icon={<MapPin size={20} color="#1db954" />}
            color="rgba(29, 185, 84, 0.2)"
          />
          <RatingDisplay 
            label="日当たり" 
            rating={review.rating_sunlight} 
            icon={<Star size={20} color="#fbbf24" />}
            color="rgba(251, 191, 36, 0.2)"
          />
          <RatingDisplay 
            label="防音性" 
            rating={review.rating_soundproof} 
            icon={<Home size={20} color="#2e77d0" />}
            color="rgba(46, 119, 208, 0.2)"
          />
          <RatingDisplay 
            label="周辺環境" 
            rating={review.rating_environment} 
            icon={<User size={20} color="#8b5cf6" />}
            color="rgba(139, 92, 246, 0.2)"
          />
        </Card>

        {/* Review Text */}
        {(review.pros_text || review.cons_text) && (
          <View style={{ gap: 16 }}>
            {review.pros_text && (
              <Card style={{ padding: 16, borderColor: '#1db954', borderWidth: 1 }}>
                <Text variant="subheading" style={{ marginBottom: 12, color: '#1db954' }}>
                  良かった点
                </Text>
                <Text style={{ lineHeight: 22 }}>
                  {review.pros_text}
                </Text>
              </Card>
            )}

            {review.cons_text && (
              <Card style={{ padding: 16, borderColor: '#dc2626', borderWidth: 1 }}>
                <Text variant="subheading" style={{ marginBottom: 12, color: '#dc2626' }}>
                  悪かった点・注意点
                </Text>
                <Text style={{ lineHeight: 22 }}>
                  {review.cons_text}
                </Text>
              </Card>
            )}
          </View>
        )}

        {/* Comments */}
        {review.comments && review.comments.length > 0 && (
          <Card style={{ padding: 16 }}>
            <Text variant="subheading" style={{ marginBottom: 16 }}>
              コメント ({review.comments.length})
            </Text>
            
            <View style={{ gap: 12 }}>
              {review.comments.map((comment) => (
                <View key={comment.id} style={{ 
                  backgroundColor: '#181818', 
                  padding: 12, 
                  borderRadius: 8 
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: '#404040',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 8
                    }}>
                      <User size={12} color="#727272" />
                    </View>
                    <Text style={{ fontWeight: '600', fontSize: 14 }}>
                      {comment.users.nickname}
                    </Text>
                    <Text color="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
                      {formatDate(comment.created_at)}
                    </Text>
                  </View>
                  <Text style={{ lineHeight: 18 }}>
                    {comment.body}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  )
}