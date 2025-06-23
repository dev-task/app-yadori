import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  MapPin, 
  Home, 
  Calendar, 
  DollarSign, 
  Star, 
  Heart, 
  MessageCircle, 
  User, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Camera,
  ThumbsUp,
  ThumbsDown,
  Edit2,
  Save,
  Plus
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { supabase } from '../lib/supabase'
import { Database } from '../lib/database.types'
import { Toast } from '../components/ui/Toast'
import { CommentSection } from '../components/CommentSection'
import { Card, Button, Badge } from '../components/ui'
import { MapModal } from '../components/map/MapModal'

type Review = Database['public']['Tables']['reviews']['Row'] & {
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
  likes: {
    user_id: string
  }[]
  _count: {
    likes: number
    comments: number
  }
}

interface EditFormData {
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
}

export const ReviewDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  
  // 編集機能の状態
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState<EditFormData>({
    address_text: '',
    latitude: null,
    longitude: null,
    rent: null,
    layout: '',
    period_lived: '',
    pros_text: '',
    cons_text: '',
    rating_location: null,
    rating_sunlight: null,
    rating_soundproof: null,
    rating_environment: null,
  })
  const [editImages, setEditImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<{id: number, image_url: string}[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)

  useEffect(() => {
    if (id) {
      fetchReview()
    }
  }, [id])

  const fetchReview = async () => {
    if (!id) return

    try {
      setLoading(true)
      
      // レビューの詳細情報を取得
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select(`
          *,
          users!reviews_user_id_fkey(nickname),
          review_images(id, image_url),
          comments(
            id,
            body,
            created_at,
            user_id,
            users!comments_user_id_fkey(nickname)
          )
        `)
        .eq('id', parseInt(id))
        .order('created_at', { foreignTable: 'comments', ascending: true })
        .single()

      if (reviewError) {
        throw new Error(t('reviewDetail.notFound'))
      }

      // いいね数を取得
      const { count: likesCount, error: likesError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', parseInt(id))

      if (likesError) {
        console.error('Likes count error:', likesError)
      }

      // ユーザーがいいねしているかチェック
      let userLiked = false
      if (user) {
        const { data: userLike, error: userLikeError } = await supabase
          .from('likes')
          .select('user_id')
          .eq('review_id', parseInt(id))
          .eq('user_id', user.id)
          .maybeSingle()

        if (!userLikeError && userLike) {
          userLiked = true
        }
      }

      // データを整形
      const formattedReview: Review = {
        ...reviewData,
        _count: {
          likes: likesCount || 0,
          comments: reviewData.comments?.length || 0
        },
        likes: [] // 実際のlikesデータは不要なので空配列
      }

      setReview(formattedReview)
      setLikeCount(likesCount || 0)
      setCommentCount(reviewData.comments?.length || 0)
      setIsLiked(userLiked)
      
      // 編集フォームの初期値を設定
      setEditFormData({
        address_text: formattedReview.address_text,
        latitude: formattedReview.latitude,
        longitude: formattedReview.longitude,
        rent: formattedReview.rent,
        layout: formattedReview.layout,
        period_lived: formattedReview.period_lived,
        pros_text: formattedReview.pros_text,
        cons_text: formattedReview.cons_text,
        rating_location: formattedReview.rating_location,
        rating_sunlight: formattedReview.rating_sunlight,
        rating_soundproof: formattedReview.rating_soundproof,
        rating_environment: formattedReview.rating_environment,
      })
      setExistingImages(formattedReview.review_images)
    } catch (error: any) {
      console.error('Error fetching review:', error)
      setError(error.message || t('reviewDetail.notFound'))
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!user || !review) {
      setToastMessage(t('reviewDetail.loginRequiredForLike'))
      setToastType('error')
      setShowToast(true)
      return
    }

    try {
      if (isLiked) {
        // いいねを削除
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('review_id', review.id)
          .eq('user_id', user.id)

        if (error) throw error

        setIsLiked(false)
        setLikeCount(prev => prev - 1)
        setToastMessage(t('reviewDetail.unlikeSuccess'))
        setToastType('success')
      } else {
        // いいねを追加
        const { error } = await supabase
          .from('likes')
          .insert({
            review_id: review.id,
            user_id: user.id
          })

        if (error) throw error

        setIsLiked(true)
        setLikeCount(prev => prev + 1)
        setToastMessage(t('reviewDetail.likeSuccess'))
        setToastType('success')
      }
      setShowToast(true)
    } catch (error: any) {
      console.error('Like error:', error)
      setToastMessage(t('reviewDetail.likeError'))
      setToastType('error')
      setShowToast(true)
    }
  }

  const handleCommentCountChange = (count: number) => {
    setCommentCount(count)
  }

  const openImageModal = (index: number) => {
    setCurrentImageIndex(index)
    setShowImageModal(true)
  }

  const nextImage = () => {
    if (review?.review_images) {
      setCurrentImageIndex((prev) => 
        prev === review.review_images.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevImage = () => {
    if (review?.review_images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? review.review_images.length - 1 : prev - 1
      )
    }
  }

  // 編集機能のハンドラー
  const handleEditStart = () => {
    setIsEditing(true)
  }

  const handleEditCancel = () => {
    if (!review) return
    
    // フォームを元の値にリセット
    setEditFormData({
      address_text: review.address_text,
      latitude: review.latitude,
      longitude: review.longitude,
      rent: review.rent,
      layout: review.layout,
      period_lived: review.period_lived,
      pros_text: review.pros_text,
      cons_text: review.cons_text,
      rating_location: review.rating_location,
      rating_sunlight: review.rating_sunlight,
      rating_soundproof: review.rating_soundproof,
      rating_environment: review.rating_environment,
    })
    setEditImages([])
    setExistingImages(review.review_images)
    setImagesToDelete([])
    setIsEditing(false)
  }

  const handleInputChange = (field: keyof EditFormData, value: string | number | null) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRatingChange = (field: keyof EditFormData, rating: number) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: rating
    }))
  }

  const handleLocationSelect = (location: {
    address: string
    latitude: number
    longitude: number
  }) => {
    setEditFormData(prev => ({
      ...prev,
      address_text: location.address,
      latitude: location.latitude,
      longitude: location.longitude
    }))
  }

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setToastMessage(t('errors.uploadError'))
        setToastType('error')
        setShowToast(true)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        setToastMessage(t('errors.uploadError'))
        setToastType('error')
        setShowToast(true)
        return false
      }
      return true
    })
    
    const totalImages = existingImages.length - imagesToDelete.length + editImages.length + validFiles.length
    if (totalImages > 5) {
      setToastMessage('画像は最大5枚まで選択できます')
      setToastType('error')
      setShowToast(true)
      return
    }
    
    setEditImages(prev => [...prev, ...validFiles])
  }

  const handleImageRemove = (index: number) => {
    setEditImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleExistingImageRemove = (imageId: number) => {
    setImagesToDelete(prev => [...prev, imageId])
  }

  const handleExistingImageRestore = (imageId: number) => {
    setImagesToDelete(prev => prev.filter(id => id !== imageId))
  }

  const handleSave = async () => {
    if (!review || !user) return

    setSaving(true)
    try {
      // レビューデータを更新
      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          address_text: editFormData.address_text.trim(),
          latitude: editFormData.latitude,
          longitude: editFormData.longitude,
          rent: editFormData.rent,
          layout: editFormData.layout.trim(),
          period_lived: editFormData.period_lived.trim(),
          pros_text: editFormData.pros_text.trim(),
          cons_text: editFormData.cons_text.trim(),
          rating_location: editFormData.rating_location,
          rating_sunlight: editFormData.rating_sunlight,
          rating_soundproof: editFormData.rating_soundproof,
          rating_environment: editFormData.rating_environment,
        })
        .eq('id', review.id)

      if (updateError) throw updateError

      // 削除対象の画像を削除
      if (imagesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('review_images')
          .delete()
          .in('id', imagesToDelete)

        if (deleteError) throw deleteError
      }

      // 新しい画像をアップロード
      if (editImages.length > 0) {
        for (let i = 0; i < editImages.length; i++) {
          const image = editImages[i]
          const fileExt = image.name.split('.').pop()
          const fileName = `${Date.now()}_${review.id}_${i}.${fileExt}`
          const filePath = `review-images/${fileName}`

          // Supabase Storageに画像をアップロード
          const { error: uploadError } = await supabase.storage
            .from('review-images')
            .upload(filePath, image, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) throw uploadError

          // 公開URLを取得
          const { data: { publicUrl } } = supabase.storage
            .from('review-images')
            .getPublicUrl(filePath)

          // データベースに画像情報を保存
          const { error: dbError } = await supabase
            .from('review_images')
            .insert({
              review_id: review.id,
              image_url: publicUrl
            })

          if (dbError) throw dbError
        }
      }

      // レビューデータを再取得
      await fetchReview()
      setIsEditing(false)
      setEditImages([])
      setImagesToDelete([])
      
      setToastMessage(t('success.reviewUpdated'))
      setToastType('success')
      setShowToast(true)
    } catch (error: any) {
      console.error('Save error:', error)
      setToastMessage(t('errors.updateError'))
      setToastType('error')
      setShowToast(true)
    } finally {
      setSaving(false)
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
    if (!rent) return t('reviewDetail.rent')
    return `${rent.toLocaleString()}円`
  }

  const getRatingText = (rating: number | null) => {
    if (!rating) return t('profile.stats.notRated')
    return t(`review.ratingLabels.${rating}`)
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
    <div className="flex items-center justify-between py-3 px-4 bg-spotify-gray-800 rounded-xl">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 ${color} rounded-xl flex-center`}>
          {icon}
        </div>
        <span className="font-medium text-white">{label}</span>
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                rating && rating >= star
                  ? 'text-spotify-green-400 fill-current'
                  : 'text-spotify-gray-600'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-spotify-gray-400 min-w-[80px] text-right">
          {getRatingText(rating)}
        </span>
      </div>
    </div>
  )

  const RatingInput: React.FC<{
    label: string
    value: number | null
    onChange: (rating: number) => void
  }> = ({ label, value, onChange }) => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-spotify-gray-300">{label}</label>
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 transform ${
              value && value >= rating
                ? 'text-spotify-green-400 hover:text-spotify-green-300 bg-spotify-green-500 bg-opacity-20'
                : 'text-spotify-gray-500 hover:text-spotify-gray-300 hover:bg-spotify-gray-700'
            }`}
          >
            <Star className="h-6 w-6 fill-current" />
          </button>
        ))}
      </div>
      {value && (
        <p className="text-xs text-spotify-gray-400 mt-2">
          {t(`review.ratingLabels.${value}`)}
        </p>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex-center gradient-bg">
        <div className="text-center space-y-4">
          <div className="spinner w-12 h-12 mx-auto"></div>
          <p className="text-spotify-gray-400">{t('reviewDetail.loadingReview')}</p>
        </div>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="min-h-screen flex-center gradient-bg">
        <Card className="text-center max-w-md">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-red-500 bg-opacity-20 rounded-full flex-center mx-auto">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">
                {t('reviewDetail.notFound')}
              </h2>
              <p className="text-spotify-gray-400">
                {error || t('reviewDetail.notFoundMessage')}
              </p>
            </div>
            <Button
              onClick={() => navigate('/')}
              variant="primary"
              icon={ArrowLeft}
            >
              {t('reviewDetail.backToHome')}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const averageRating = getAverageRating()
  const isOwner = user && user.id === review.user_id

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Toast notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Back button */}
      <Button
        onClick={() => navigate(-1)}
        variant="ghost"
        icon={ArrowLeft}
        className="mb-6"
      >
        {t('reviewDetail.back')}
      </Button>

      {/* Main content */}
      <div className="space-y-6">
        {/* Header Card */}
        <Card padding="lg">
          <div className="space-y-6">
            {/* User info and actions */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-spotify-green-500 rounded-full flex-center">
                  <User className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="font-semibold text-white text-lg">{review.users.nickname}</p>
                  <p className="text-spotify-gray-400">{formatDate(review.created_at)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isOwner && !isEditing && (
                  <Button 
                    onClick={handleEditStart}
                    variant="secondary" 
                    size="sm" 
                    icon={Edit2}
                  >
                    編集
                  </Button>
                )}
                {isEditing && (
                  <>
                    <Button 
                      onClick={handleSave}
                      variant="primary" 
                      size="sm" 
                      icon={Save}
                      loading={saving}
                      disabled={saving}
                    >
                      保存
                    </Button>
                    <Button 
                      onClick={handleEditCancel}
                      variant="secondary" 
                      size="sm" 
                      icon={X}
                      disabled={saving}
                    >
                      キャンセル
                    </Button>
                  </>
                )}
                {!isEditing && (
                  <>
                    <Button variant="ghost" size="sm" icon={Share2}>
                      {t('reviewDetail.share')}
                    </Button>
                    <Button variant="ghost" size="sm" icon={Bookmark}>
                      {t('reviewDetail.save')}
                    </Button>
                    <Button variant="ghost" size="sm" icon={MoreHorizontal} />
                  </>
                )}
              </div>
            </div>
            
            {/* Title and rating */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <MapPin className="h-6 w-6 text-spotify-green-400 mt-1 flex-shrink-0" />
                  {isEditing ? (
                    <div className="flex-1 space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={editFormData.address_text}
                          onChange={(e) => handleInputChange('address_text', e.target.value)}
                          className="input-field w-full text-xl font-bold"
                          placeholder={t('review.addressPlaceholder')}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => setShowMapModal(true)}
                        variant="secondary"
                        icon={MapPin}
                        size="sm"
                      >
                        {t('map.selectFromMap')}
                      </Button>
                    </div>
                  ) : (
                    <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                      {review.address_text}
                    </h1>
                  )}
                </div>
                
                {averageRating && !isEditing && (
                  <div className="ml-4">
                    <Badge variant="success" className="text-lg px-4 py-2">
                      <Star className="h-4 w-4 mr-1 fill-current" />
                      {averageRating.toFixed(1)}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {!isEditing && (
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleLike}
                    variant={isLiked ? "primary" : "secondary"}
                    icon={Heart}
                    className={isLiked ? "bg-red-500 hover:bg-red-400" : ""}
                  >
                    {likeCount} {isLiked ? t('reviewDetail.liked') : t('reviewDetail.like')}
                  </Button>
                  
                  <div className="flex items-center space-x-2 px-4 py-2 bg-spotify-gray-800 rounded-full">
                    <MessageCircle className="h-4 w-4 text-spotify-gray-400" />
                    <span className="text-spotify-gray-300 font-medium">
                      {commentCount} {t('reviewDetail.comments')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Basic info */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Home className="h-5 w-5 text-spotify-blue-400" />
            <span>{t('reviewDetail.basicInfo')}</span>
          </h3>
          
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-spotify-gray-300 mb-2">
                    {t('review.rent')}
                  </label>
                  <input
                    type="number"
                    value={editFormData.rent || ''}
                    onChange={(e) => handleInputChange('rent', e.target.value ? parseInt(e.target.value) : null)}
                    className="input-field w-full"
                    placeholder={t('review.rentPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-spotify-gray-300 mb-2">
                    {t('review.layout')}
                  </label>
                  <input
                    type="text"
                    value={editFormData.layout}
                    onChange={(e) => handleInputChange('layout', e.target.value)}
                    className="input-field w-full"
                    placeholder={t('review.layoutPlaceholder')}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-spotify-gray-300 mb-2">
                  {t('review.period')}
                </label>
                <input
                  type="text"
                  value={editFormData.period_lived}
                  onChange={(e) => handleInputChange('period_lived', e.target.value)}
                  className="input-field w-full"
                  placeholder={t('review.periodPlaceholder')}
                />
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {review.rent && (
                <div className="flex items-center space-x-3 p-4 bg-spotify-gray-800 rounded-xl">
                  <div className="w-10 h-10 bg-spotify-green-500 bg-opacity-20 rounded-xl flex-center">
                    <DollarSign className="h-5 w-5 text-spotify-green-400" />
                  </div>
                  <div>
                    <p className="text-spotify-gray-400 text-sm">{t('reviewDetail.rent')}</p>
                    <p className="font-semibold text-white">{formatRent(review.rent)}</p>
                  </div>
                </div>
              )}

              {review.layout && (
                <div className="flex items-center space-x-3 p-4 bg-spotify-gray-800 rounded-xl">
                  <div className="w-10 h-10 bg-spotify-blue-500 bg-opacity-20 rounded-xl flex-center">
                    <Home className="h-5 w-5 text-spotify-blue-400" />
                  </div>
                  <div>
                    <p className="text-spotify-gray-400 text-sm">{t('reviewDetail.layout')}</p>
                    <p className="font-semibold text-white">{review.layout}</p>
                  </div>
                </div>
              )}

              {review.period_lived && (
                <div className="flex items-center space-x-3 p-4 bg-spotify-gray-800 rounded-xl">
                  <div className="w-10 h-10 bg-spotify-purple-500 bg-opacity-20 rounded-xl flex-center">
                    <Calendar className="h-5 w-5 text-spotify-purple-400" />
                  </div>
                  <div>
                    <p className="text-spotify-gray-400 text-sm">{t('reviewDetail.period')}</p>
                    <p className="font-semibold text-white">{review.period_lived}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Images */}
        <Card>
          <div className="flex items-center space-x-2 mb-4">
            <Camera className="h-5 w-5 text-spotify-purple-400" />
            <h3 className="text-lg font-semibold text-white">
              {t('reviewDetail.photos')} ({existingImages.filter(img => !imagesToDelete.includes(img.id)).length + editImages.length})
            </h3>
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              {/* 既存の画像 */}
              {existingImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {existingImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.image_url}
                        alt="物件写真"
                        className={`w-full h-32 object-cover rounded-xl border transition-opacity ${
                          imagesToDelete.includes(image.id) 
                            ? 'opacity-50 border-red-500' 
                            : 'border-spotify-gray-600'
                        }`}
                      />
                      {imagesToDelete.includes(image.id) ? (
                        <button
                          type="button"
                          onClick={() => handleExistingImageRestore(image.id)}
                          className="absolute -top-2 -right-2 bg-spotify-green-500 text-white rounded-full p-1.5 hover:bg-spotify-green-400 transition-colors shadow-lg"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleExistingImageRemove(image.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-400 transition-colors shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 新しい画像 */}
              {editImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {editImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`新しい画像 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl border border-spotify-green-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-400 transition-colors shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 画像追加ボタン */}
              {(existingImages.length - imagesToDelete.length + editImages.length) < 5 && (
                <div>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-spotify-gray-600 rounded-xl cursor-pointer bg-spotify-gray-800 hover:bg-spotify-gray-700 transition-colors group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Plus className="h-8 w-8 text-spotify-gray-400 mb-2 group-hover:text-spotify-gray-300 transition-colors" />
                      <p className="text-sm text-spotify-gray-400 group-hover:text-spotify-gray-300 transition-colors">
                        {t('review.addPhotos')}
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageAdd}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          ) : (
            review.review_images && review.review_images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {review.review_images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => openImageModal(index)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-spotify-gray-800 hover:opacity-90 transition-opacity group"
                  >
                    <img
                      src={image.image_url}
                      alt={`物件写真 ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex-center">
                          <span className="text-lg font-bold text-gray-700">+</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-spotify-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-2 text-spotify-gray-600" />
                <p>画像はありません</p>
              </div>
            )
          )}
        </Card>

        {/* Ratings */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Star className="h-5 w-5 text-spotify-green-400" />
            <span>{t('reviewDetail.rating')}</span>
          </h3>
          
          {isEditing ? (
            <div className="grid md:grid-cols-2 gap-6">
              <RatingInput
                label={t('review.location')}
                value={editFormData.rating_location}
                onChange={(rating) => handleRatingChange('rating_location', rating)}
              />
              <RatingInput
                label={t('review.sunlight')}
                value={editFormData.rating_sunlight}
                onChange={(rating) => handleRatingChange('rating_sunlight', rating)}
              />
              <RatingInput
                label={t('review.soundproof')}
                value={editFormData.rating_soundproof}
                onChange={(rating) => handleRatingChange('rating_soundproof', rating)}
              />
              <RatingInput
                label={t('review.environment')}
                value={editFormData.rating_environment}
                onChange={(rating) => handleRatingChange('rating_environment', rating)}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <RatingDisplay 
                label={t('review.location')} 
                rating={review.rating_location} 
                icon={<MapPin className="h-5 w-5 text-spotify-green-400" />}
                color="bg-spotify-green-500 bg-opacity-20"
              />
              <RatingDisplay 
                label={t('review.sunlight')} 
                rating={review.rating_sunlight} 
                icon={<Star className="h-5 w-5 text-spotify-yellow-400" />}
                color="bg-spotify-yellow-500 bg-opacity-20"
              />
              <RatingDisplay 
                label={t('review.soundproof')} 
                rating={review.rating_soundproof} 
                icon={<Home className="h-5 w-5 text-spotify-blue-400" />}
                color="bg-spotify-blue-500 bg-opacity-20"
              />
              <RatingDisplay 
                label={t('review.environment')} 
                rating={review.rating_environment} 
                icon={<User className="h-5 w-5 text-spotify-purple-400" />}
                color="bg-spotify-purple-500 bg-opacity-20"
              />
            </div>
          )}
        </Card>

        {/* Review text */}
        {isEditing ? (
          <div className="space-y-6">
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <ThumbsUp className="h-5 w-5 text-spotify-green-400" />
                  <span>{t('reviewDetail.prosTitle')}</span>
                </h3>
                <textarea
                  value={editFormData.pros_text}
                  onChange={(e) => handleInputChange('pros_text', e.target.value)}
                  rows={4}
                  className="textarea-field w-full"
                  placeholder={t('review.prosPlaceholder')}
                />
              </div>
            </Card>

            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <ThumbsDown className="h-5 w-5 text-red-400" />
                  <span>{t('reviewDetail.consTitle')}</span>
                </h3>
                <textarea
                  value={editFormData.cons_text}
                  onChange={(e) => handleInputChange('cons_text', e.target.value)}
                  rows={4}
                  className="textarea-field w-full"
                  placeholder={t('review.consPlaceholder')}
                />
              </div>
            </Card>
          </div>
        ) : (
          (review.pros_text || review.cons_text) && (
            <div className="space-y-6">
              {review.pros_text && (
                <Card>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <ThumbsUp className="h-5 w-5 text-spotify-green-400" />
                    <span>{t('reviewDetail.prosTitle')}</span>
                  </h3>
                  <div className="bg-spotify-green-500 bg-opacity-10 border border-spotify-green-500 border-opacity-30 rounded-xl p-6">
                    <p className="text-white leading-relaxed whitespace-pre-wrap">
                      {review.pros_text}
                    </p>
                  </div>
                </Card>
              )}

              {review.cons_text && (
                <Card>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <ThumbsDown className="h-5 w-5 text-red-400" />
                    <span>{t('reviewDetail.consTitle')}</span>
                  </h3>
                  <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-xl p-6">
                    <p className="text-white leading-relaxed whitespace-pre-wrap">
                      {review.cons_text}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )
        )}

        {/* Comments section */}
        {!isEditing && (
          <Card>
            <CommentSection 
              reviewId={review.id}
              initialComments={review.comments}
              onCommentCountChange={handleCommentCountChange}
            />
          </Card>
        )}
      </div>

      {/* Image modal */}
      {showImageModal && review.review_images && review.review_images.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex-center p-4">
          <div className="relative max-w-4xl max-h-full w-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-spotify-gray-300 transition-colors z-10"
            >
              <X className="h-8 w-8" />
            </button>
            
            <img
              src={review.review_images[currentImageIndex].image_url}
              alt={`物件写真 ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
            
            {review.review_images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
                  {currentImageIndex + 1} / {review.review_images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Map Modal */}
      <MapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onLocationSelect={handleLocationSelect}
        initialAddress={editFormData.address_text}
      />
    </div>
  )
}