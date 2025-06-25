import React, { useState, useEffect } from 'react'
import { View, ScrollView, Image, TouchableOpacity, Alert, RefreshControl } from 'react-native'
import { Text, Card, Button, Input } from '@yadori/ui'
import { useLocalSearchParams, router } from 'expo-router'
import { useAuth, useI18n, getReview, supabase } from '@yadori/logic'
import { MapPin, Star, Heart, MessageCircle, User, Calendar, DollarSign, Home, ArrowLeft, Send, Edit2, Trash2, MoreVertical } from '@expo/vector-icons/Feather'

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
    user_id: string
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
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editCommentText, setEditCommentText] = useState('')

  useEffect(() => {
    if (id) {
      fetchReview()
      setupRealtimeSubscriptions()
    }

    return () => {
      // Cleanup subscriptions
      supabase.removeAllChannels()
    }
  }, [id])

  const setupRealtimeSubscriptions = () => {
    if (!id) return

    // Subscribe to likes changes
    const likesChannel = supabase
      .channel(`likes_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `review_id=eq.${id}`
        },
        (payload) => {
          console.log('Likes change:', payload)
          fetchLikeStatus()
        }
      )
      .subscribe()

    // Subscribe to comments changes
    const commentsChannel = supabase
      .channel(`comments_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `review_id=eq.${id}`
        },
        (payload) => {
          console.log('Comments change:', payload)
          fetchComments()
        }
      )
      .subscribe()
  }

  const fetchReview = async () => {
    if (!id) return

    try {
      setLoading(true)
      const data = await getReview(parseInt(id))
      setReview(data)
      setCommentCount(data.comments?.length || 0)

      await fetchLikeStatus()
    } catch (error: any) {
      console.error('Error fetching review:', error)
      setError('レビューの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const fetchLikeStatus = async () => {
    if (!id) return

    try {
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
    } catch (error) {
      console.error('Error fetching like status:', error)
    }
  }

  const fetchComments = async () => {
    if (!id || !review) return

    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          users!comments_user_id_fkey(nickname)
        `)
        .eq('review_id', parseInt(id))
        .order('created_at', { ascending: true })

      if (error) throw error

      setReview(prev => prev ? {
        ...prev,
        comments: data || []
      } : null)
      setCommentCount(data?.length || 0)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchReview()
    setRefreshing(false)
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

  const handlePostComment = async () => {
    if (!user || !review || !newComment.trim()) {
      return
    }

    setPostingComment(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          review_id: review.id,
          user_id: user.id,
          body: newComment.trim()
        })

      if (error) throw error

      setNewComment('')
      // Comments will be updated via realtime subscription
    } catch (error: any) {
      console.error('Comment post error:', error)
      Alert.alert('エラー', 'コメントの投稿に失敗しました')
    } finally {
      setPostingComment(false)
    }
  }

  const handleEditComment = async (commentId: number) => {
    if (!editCommentText.trim()) return

    try {
      const { error } = await supabase
        .from('comments')
        .update({ body: editCommentText.trim() })
        .eq('id', commentId)

      if (error) throw error

      setEditingCommentId(null)
      setEditCommentText('')
      // Comments will be updated via realtime subscription
    } catch (error: any) {
      console.error('Comment edit error:', error)
      Alert.alert('エラー', 'コメントの編集に失敗しました')
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    Alert.alert(
      'コメントを削除',
      'このコメントを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId)

              if (error) throw error
              // Comments will be updated via realtime subscription
            } catch (error: any) {
              console.error('Comment delete error:', error)
              Alert.alert('エラー', 'コメントの削除に失敗しました')
            }
          }
        }
      ]
    )
  }

  const startEditComment = (comment: any) => {
    setEditingCommentId(comment.id)
    setEditCommentText(comment.body)
  }

  const cancelEditComment = () => {
    setEditingCommentId(null)
    setEditCommentText('')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes < 1 ? 'たった今' : `${diffInMinutes}分前`
    } else if (diffInHours < 24) {
      return `${diffInHours}時間前`
    } else if (diffInHours < 24 * 7) {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}日前`
    } else {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
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
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#121212' }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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
                {commentCount} コメント
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

        {/* Comments Section */}
        <Card style={{ padding: 16 }}>
          <Text variant="subheading" style={{ marginBottom: 16 }}>
            コメント ({commentCount})
          </Text>

          {/* Comment Form */}
          {user ? (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
                <View style={{ flex: 1 }}>
                  <Input
                    placeholder="コメントを入力してください..."
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                    numberOfLines={3}
                    style={{ height: 80, textAlignVertical: 'top' }}
                  />
                </View>
                <Button
                  onPress={handlePostComment}
                  disabled={!newComment.trim() || postingComment}
                  style={{ paddingHorizontal: 12 }}
                >
                  {postingComment ? (
                    <Text>投稿中...</Text>
                  ) : (
                    <Send size={16} color="#000" />
                  )}
                </Button>
              </View>
            </View>
          ) : (
            <View style={{ 
              backgroundColor: '#181818', 
              padding: 16, 
              borderRadius: 8, 
              marginBottom: 16,
              alignItems: 'center'
            }}>
              <Text color="secondary">
                コメントを投稿するにはログインが必要です
              </Text>
            </View>
          )}

          {/* Comments List */}
          {review.comments && review.comments.length > 0 ? (
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
                    <Text style={{ fontWeight: '600', fontSize: 14, flex: 1 }}>
                      {comment.users.nickname}
                    </Text>
                    <Text color="secondary" style={{ fontSize: 12 }}>
                      {formatDate(comment.created_at)}
                    </Text>
                    {user && user.id === comment.user_id && (
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            'コメント操作',
                            'どの操作を行いますか？',
                            [
                              { text: 'キャンセル', style: 'cancel' },
                              { text: '編集', onPress: () => startEditComment(comment) },
                              { text: '削除', style: 'destructive', onPress: () => handleDeleteComment(comment.id) }
                            ]
                          )
                        }}
                        style={{ marginLeft: 8, padding: 4 }}
                      >
                        <MoreVertical size={14} color="#727272" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {editingCommentId === comment.id ? (
                    <View style={{ gap: 8 }}>
                      <Input
                        value={editCommentText}
                        onChangeText={setEditCommentText}
                        multiline
                        numberOfLines={3}
                        style={{ height: 60, textAlignVertical: 'top' }}
                      />
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Button
                          onPress={() => handleEditComment(comment.id)}
                          disabled={!editCommentText.trim()}
                          size="sm"
                          style={{ flex: 1 }}
                        >
                          <Text>保存</Text>
                        </Button>
                        <Button
                          onPress={cancelEditComment}
                          variant="secondary"
                          size="sm"
                          style={{ flex: 1 }}
                        >
                          <Text>キャンセル</Text>
                        </Button>
                      </View>
                    </View>
                  ) : (
                    <Text style={{ lineHeight: 18 }}>
                      {comment.body}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={{ 
              backgroundColor: '#181818', 
              padding: 24, 
              borderRadius: 8,
              alignItems: 'center'
            }}>
              <MessageCircle size={32} color="#404040" style={{ marginBottom: 8 }} />
              <Text color="secondary" style={{ textAlign: 'center' }}>
                まだコメントがありません
              </Text>
              <Text color="secondary" style={{ textAlign: 'center', fontSize: 12, marginTop: 4 }}>
                最初のコメントを投稿してみませんか？
              </Text>
            </View>
          )}
        </Card>
      </View>
    </ScrollView>
  )
}