import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Home, Calendar, DollarSign, Star, Camera, Plus, X, AlertCircle, MessageCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { supabase } from '../lib/supabase'
import { Card, Button } from '../components/ui'
import { MapModal } from '../components/map/MapModal'

interface ReviewFormData {
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

const initialFormData: ReviewFormData = {
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
}

export const PostPage: React.FC = () => {
  const { user } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [formData, setFormData] = useState<ReviewFormData>(initialFormData)
  const [images, setImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showMapModal, setShowMapModal] = useState(false)

  const handleInputChange = (field: keyof ReviewFormData, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRatingChange = (field: keyof ReviewFormData, rating: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: rating
    }))
  }

  const handleLocationSelect = (location: {
    address: string
    latitude: number
    longitude: number
  }) => {
    setFormData(prev => ({
      ...prev,
      address_text: location.address,
      latitude: location.latitude,
      longitude: location.longitude
    }))
  }

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      // 画像ファイルのみ許可
      if (!file.type.startsWith('image/')) {
        setError(t('errors.uploadError'))
        return false
      }
      // 5MB以下のファイルのみ許可
      if (file.size > 5 * 1024 * 1024) {
        setError(t('errors.uploadError'))
        return false
      }
      return true
    })
    
    setImages(prev => {
      const newImages = [...prev, ...validFiles].slice(0, 5)
      if (newImages.length > 5) {
        setError(t('errors.uploadError'))
      }
      return newImages
    })
    setError('')
  }

  const handleImageRemove = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (reviewId: number): Promise<void> => {
    if (images.length === 0) return

    setUploadProgress(0)
    const uploadPromises = images.map(async (image, index) => {
      try {
        const fileExt = image.name.split('.').pop()
        const fileName = `${Date.now()}_${reviewId}_${index}.${fileExt}`
        const filePath = `review-images/${fileName}`

        // Supabase Storageに画像をアップロード
        const { error: uploadError } = await supabase.storage
          .from('review-images')
          .upload(filePath, image, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error(`${t('errors.uploadError')}: ${uploadError.message}`)
        }

        // 公開URLを取得
        const { data: { publicUrl } } = supabase.storage
          .from('review-images')
          .getPublicUrl(filePath)

        // データベースに画像情報を保存
        const { error: dbError } = await supabase
          .from('review_images')
          .insert({
            review_id: reviewId,
            image_url: publicUrl
          })

        if (dbError) {
          console.error('Database error:', dbError)
          throw new Error(`${t('errors.updateError')}: ${dbError.message}`)
        }

        // プログレスを更新
        setUploadProgress(prev => prev + (100 / images.length))
      } catch (error) {
        console.error('Image upload error:', error)
        throw error
      }
    })

    await Promise.all(uploadPromises)
    setUploadProgress(100)
  }

  const validateForm = (): boolean => {
    if (!formData.address_text.trim()) {
      setError(t('errors.validationError'))
      return false
    }
    
    // 評価が1つも入力されていない場合は警告
    const hasRating = formData.rating_location || formData.rating_sunlight || 
                     formData.rating_soundproof || formData.rating_environment
    
    if (!hasRating && !formData.pros_text.trim() && !formData.cons_text.trim()) {
      setError(t('errors.validationError'))
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError(t('auth.loginRequired'))
      return
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')
    setUploadProgress(0)

    try {
      // レビューをデータベースに保存
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          address_text: formData.address_text.trim(),
          latitude: formData.latitude,
          longitude: formData.longitude,
          rent: formData.rent,
          layout: formData.layout.trim(),
          period_lived: formData.period_lived.trim(),
          pros_text: formData.pros_text.trim(),
          cons_text: formData.cons_text.trim(),
          rating_location: formData.rating_location,
          rating_sunlight: formData.rating_sunlight,
          rating_soundproof: formData.rating_soundproof,
          rating_environment: formData.rating_environment,
        })
        .select()
        .single()

      if (reviewError) {
        console.error('Review insert error:', reviewError)
        throw new Error(`${t('errors.updateError')}: ${reviewError.message}`)
      }

      // 画像をアップロード（画像がある場合のみ）
      if (images.length > 0) {
        await uploadImages(review.id)
      }

      // 成功メッセージを表示してホームページにリダイレクト
      navigate('/', { 
        state: { 
          message: t('success.reviewPosted')
        } 
      })
    } catch (error: any) {
      console.error('Submit error:', error)
      setError(error.message || t('errors.general'))
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

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

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <Card padding="lg" className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-spotify-green-500 via-spotify-blue-500 to-spotify-purple-500 opacity-10"></div>
        
        <div className="relative">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-spotify-green-500 rounded-2xl flex-center">
                <Plus className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">{t('review.title')}</h1>
                <p className="text-spotify-gray-300">{t('review.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center space-x-3">
              <div className="w-8 h-8 bg-spotify-blue-500 bg-opacity-20 rounded-xl flex-center">
                <Home className="h-5 w-5 text-spotify-blue-400" />
              </div>
              <span>{t('review.basicInfo')}</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-spotify-gray-300 mb-2">
                  {t('review.address')} <span className="text-red-400">*</span>
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-spotify-gray-400" />
                    <input
                      id="address"
                      type="text"
                      required
                      value={formData.address_text}
                      onChange={(e) => handleInputChange('address_text', e.target.value)}
                      placeholder={t('review.addressPlaceholder')}
                      className="input-field pl-12 w-full"
                    />
                  </div>
                  
                  {/* 地図で選択ボタン */}
                  <Button
                    type="button"
                    onClick={() => setShowMapModal(true)}
                    variant="secondary"
                    icon={MapPin}
                    className="w-full sm:w-auto"
                  >
                    {t('map.selectFromMap')}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-spotify-gray-500">
                  {t('review.addressNote')}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="rent" className="block text-sm font-medium text-spotify-gray-300 mb-2">
                    {t('review.rent')}
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-spotify-gray-400" />
                    <input
                      id="rent"
                      type="number"
                      min="0"
                      max="10000000"
                      value={formData.rent || ''}
                      onChange={(e) => handleInputChange('rent', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder={t('review.rentPlaceholder')}
                      className="input-field pl-12 w-full"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="layout" className="block text-sm font-medium text-spotify-gray-300 mb-2">
                    {t('review.layout')}
                  </label>
                  <input
                    id="layout"
                    type="text"
                    value={formData.layout}
                    onChange={(e) => handleInputChange('layout', e.target.value)}
                    placeholder={t('review.layoutPlaceholder')}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="period" className="block text-sm font-medium text-spotify-gray-300 mb-2">
                  {t('review.period')}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-spotify-gray-400" />
                  <input
                    id="period"
                    type="text"
                    value={formData.period_lived}
                    onChange={(e) => handleInputChange('period_lived', e.target.value)}
                    placeholder={t('review.periodPlaceholder')}
                    className="input-field pl-12 w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 評価 */}
        <Card>
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center space-x-3">
              <div className="w-8 h-8 bg-spotify-green-500 bg-opacity-20 rounded-xl flex-center">
                <Star className="h-5 w-5 text-spotify-green-400" />
              </div>
              <span>{t('review.rating')}</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <RatingInput
                label={t('review.location')}
                value={formData.rating_location}
                onChange={(rating) => handleRatingChange('rating_location', rating)}
              />
              <RatingInput
                label={t('review.sunlight')}
                value={formData.rating_sunlight}
                onChange={(rating) => handleRatingChange('rating_sunlight', rating)}
              />
              <RatingInput
                label={t('review.soundproof')}
                value={formData.rating_soundproof}
                onChange={(rating) => handleRatingChange('rating_soundproof', rating)}
              />
              <RatingInput
                label={t('review.environment')}
                value={formData.rating_environment}
                onChange={(rating) => handleRatingChange('rating_environment', rating)}
              />
            </div>
          </div>
        </Card>

        {/* 詳細レビュー */}
        <Card>
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center space-x-3">
              <div className="w-8 h-8 bg-spotify-purple-500 bg-opacity-20 rounded-xl flex-center">
                <MessageCircle className="h-5 w-5 text-spotify-purple-400" />
              </div>
              <span>{t('review.detailedReview')}</span>
            </h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="pros" className="block text-sm font-medium text-spotify-gray-300 mb-2">
                  {t('review.prosText')}
                </label>
                <textarea
                  id="pros"
                  rows={4}
                  value={formData.pros_text}
                  onChange={(e) => handleInputChange('pros_text', e.target.value)}
                  placeholder={t('review.prosPlaceholder')}
                  className="textarea-field w-full"
                />
              </div>

              <div>
                <label htmlFor="cons" className="block text-sm font-medium text-spotify-gray-300 mb-2">
                  {t('review.consText')}
                </label>
                <textarea
                  id="cons"
                  rows={4}
                  value={formData.cons_text}
                  onChange={(e) => handleInputChange('cons_text', e.target.value)}
                  placeholder={t('review.consPlaceholder')}
                  className="textarea-field w-full"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 画像アップロード */}
        <Card>
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center space-x-3">
              <div className="w-8 h-8 bg-spotify-yellow-500 bg-opacity-20 rounded-xl flex-center">
                <Camera className="h-5 w-5 text-spotify-yellow-400" />
              </div>
              <span>{t('review.photos')}</span>
            </h2>

            <div className="space-y-4">
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl border border-spotify-gray-600 group-hover:opacity-75 transition-opacity"
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

              {images.length < 5 && (
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

            {/* アップロード進行状況 */}
            {loading && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="w-full bg-spotify-gray-700 rounded-full h-2">
                  <div 
                    className="bg-spotify-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-spotify-gray-400 text-center">
                  {t('review.uploadingPhotos')} {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
          </div>
        </Card>

        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-start backdrop-blur-sm">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 送信ボタン */}
        <Card>
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <Button
              type="button"
              onClick={() => navigate('/')}
              disabled={loading}
              variant="secondary"
              size="lg"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.address_text.trim()}
              variant="primary"
              size="lg"
              loading={loading}
            >
              {loading ? t('review.posting') : t('review.postReview')}
            </Button>
          </div>
        </Card>
      </form>

      {/* Map Modal */}
      <MapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onLocationSelect={handleLocationSelect}
        initialAddress={formData.address_text}
      />
    </div>
  )
}