import React, { useState } from 'react'
import { View, ScrollView, Alert, TouchableOpacity, Image } from 'react-native'
import { Text, Card, Button, Input } from '@yadori/ui'
import { useAuth, useI18n, createReview, supabase } from '@yadori/logic'
import { router } from 'expo-router'
import { MapPin, Camera, Star, X, Plus } from '@expo/vector-icons/Feather'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'

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

export default function PostScreen() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [formData, setFormData] = useState<ReviewFormData>(initialFormData)
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('エラー', '位置情報の許可が必要です')
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      const { latitude, longitude } = location.coords
      
      // Simple reverse geocoding (you might want to use a more sophisticated solution)
      setFormData(prev => ({
        ...prev,
        latitude,
        longitude,
        address_text: `緯度: ${latitude.toFixed(6)}, 経度: ${longitude.toFixed(6)}`
      }))
      
      Alert.alert('成功', '現在地を取得しました')
    } catch (error) {
      console.error('Location error:', error)
      Alert.alert('エラー', '位置情報の取得に失敗しました')
    }
  }

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('制限', '画像は最大5枚まで選択できます')
      return
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('エラー', '写真ライブラリへのアクセス許可が必要です')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setImages(prev => [...prev, result.assets[0].uri])
    }
  }

  const takePhoto = async () => {
    if (images.length >= 5) {
      Alert.alert('制限', '画像は最大5枚まで選択できます')
      return
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('エラー', 'カメラへのアクセス許可が必要です')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setImages(prev => [...prev, result.assets[0].uri])
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (reviewId: number): Promise<void> => {
    if (images.length === 0) return

    const uploadPromises = images.map(async (imageUri, index) => {
      try {
        // Create form data for upload
        const formData = new FormData()
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: `review_${reviewId}_${index}.jpg`,
        } as any)

        const fileExt = 'jpg'
        const fileName = `${Date.now()}_${reviewId}_${index}.${fileExt}`
        const filePath = `review-images/${fileName}`

        // Upload to Supabase Storage
        const response = await fetch(imageUri)
        const blob = await response.blob()
        
        const { error: uploadError } = await supabase.storage
          .from('review-images')
          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          throw new Error(`Upload error: ${uploadError.message}`)
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('review-images')
          .getPublicUrl(filePath)

        // Save to database
        const { error: dbError } = await supabase
          .from('review_images')
          .insert({
            review_id: reviewId,
            image_url: publicUrl
          })

        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`)
        }
      } catch (error) {
        console.error('Image upload error:', error)
        throw error
      }
    })

    await Promise.all(uploadPromises)
  }

  const validateForm = (): boolean => {
    if (!formData.address_text.trim()) {
      setError('住所を入力してください')
      return false
    }
    
    const hasRating = formData.rating_location || formData.rating_sunlight || 
                     formData.rating_soundproof || formData.rating_environment
    
    if (!hasRating && !formData.pros_text.trim() && !formData.cons_text.trim()) {
      setError('評価またはレビュー内容を入力してください')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!user) {
      setError('ログインが必要です')
      return
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create review
      const review = await createReview({
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

      // Upload images if any
      if (images.length > 0) {
        await uploadImages(review.id)
      }

      Alert.alert('成功', 'レビューが正常に投稿されました！', [
        { text: 'OK', onPress: () => router.push('/(tabs)') }
      ])
    } catch (error: any) {
      console.error('Submit error:', error)
      setError(error.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const RatingInput: React.FC<{
    label: string
    value: number | null
    onChange: (rating: number) => void
  }> = ({ label, value, onChange }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600' }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <TouchableOpacity
            key={rating}
            onPress={() => onChange(rating)}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: value && value >= rating ? '#1db954' : '#404040'
            }}
          >
            <Star 
              size={20} 
              color={value && value >= rating ? '#000' : '#727272'} 
              fill={value && value >= rating ? '#000' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
      {value && (
        <Text color="secondary" style={{ fontSize: 12, marginTop: 4 }}>
          {value === 1 ? '不満' : value === 2 ? 'やや不満' : value === 3 ? '普通' : value === 4 ? '満足' : '非常に満足'}
        </Text>
      )}
    </View>
  )

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#121212' }}>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Header */}
        <Card style={{ padding: 24 }}>
          <Text variant="heading" style={{ marginBottom: 8 }}>
            住まいの口コミを投稿
          </Text>
          <Text color="secondary">
            実際に住んだ経験をもとに、リアルな情報を共有しましょう
          </Text>
        </Card>

        {/* Basic Info */}
        <Card style={{ padding: 16 }}>
          <Text variant="subheading" style={{ marginBottom: 16 }}>
            基本情報
          </Text>

          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600' }}>
                住所・物件名 <Text color="error">*</Text>
              </Text>
              <Input
                placeholder="例：渋谷駅徒歩5分、○○マンション"
                value={formData.address_text}
                onChangeText={(value) => handleInputChange('address_text', value)}
                multiline
              />
              <Button 
                variant="secondary" 
                onPress={getCurrentLocation}
                style={{ marginTop: 8 }}
              >
                <MapPin size={16} color="#1db954" />
                <Text style={{ marginLeft: 8 }}>現在地を取得</Text>
              </Button>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600' }}>
                  家賃（円）
                </Text>
                <Input
                  placeholder="80000"
                  value={formData.rent?.toString() || ''}
                  onChangeText={(value) => handleInputChange('rent', value ? parseInt(value) : null)}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600' }}>
                  間取り
                </Text>
                <Input
                  placeholder="1K、1DK、2LDK など"
                  value={formData.layout}
                  onChangeText={(value) => handleInputChange('layout', value)}
                />
              </View>
            </View>

            <View>
              <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600' }}>
                居住期間
              </Text>
              <Input
                placeholder="例：2年間（2022年4月〜2024年3月）"
                value={formData.period_lived}
                onChangeText={(value) => handleInputChange('period_lived', value)}
              />
            </View>
          </View>
        </Card>

        {/* Ratings */}
        <Card style={{ padding: 16 }}>
          <Text variant="subheading" style={{ marginBottom: 16 }}>
            評価
          </Text>

          <RatingInput
            label="立地"
            value={formData.rating_location}
            onChange={(rating) => handleRatingChange('rating_location', rating)}
          />
          <RatingInput
            label="日当たり"
            value={formData.rating_sunlight}
            onChange={(rating) => handleRatingChange('rating_sunlight', rating)}
          />
          <RatingInput
            label="防音性"
            value={formData.rating_soundproof}
            onChange={(rating) => handleRatingChange('rating_soundproof', rating)}
          />
          <RatingInput
            label="周辺環境"
            value={formData.rating_environment}
            onChange={(rating) => handleRatingChange('rating_environment', rating)}
          />
        </Card>

        {/* Review Text */}
        <Card style={{ padding: 16 }}>
          <Text variant="subheading" style={{ marginBottom: 16 }}>
            詳細レビュー
          </Text>

          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600' }}>
                良かった点
              </Text>
              <Input
                placeholder="実際に住んでみて良かった点を詳しく教えてください"
                value={formData.pros_text}
                onChangeText={(value) => handleInputChange('pros_text', value)}
                multiline
                numberOfLines={4}
                style={{ height: 100, textAlignVertical: 'top' }}
              />
            </View>

            <View>
              <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600' }}>
                悪かった点・注意点
              </Text>
              <Input
                placeholder="住んでみて気になった点や、これから住む人への注意点があれば教えてください"
                value={formData.cons_text}
                onChangeText={(value) => handleInputChange('cons_text', value)}
                multiline
                numberOfLines={4}
                style={{ height: 100, textAlignVertical: 'top' }}
              />
            </View>
          </View>
        </Card>

        {/* Images */}
        <Card style={{ padding: 16 }}>
          <Text variant="subheading" style={{ marginBottom: 16 }}>
            写真（任意）
          </Text>

          {images.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {images.map((imageUri, index) => (
                <View key={index} style={{ position: 'relative' }}>
                  <Image
                    source={{ uri: imageUri }}
                    style={{ width: 80, height: 80, borderRadius: 8 }}
                  />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      backgroundColor: '#dc2626',
                      borderRadius: 12,
                      width: 24,
                      height: 24,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <X size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {images.length < 5 && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button variant="secondary" onPress={pickImage} style={{ flex: 1 }}>
                <Camera size={16} color="#1db954" />
                <Text style={{ marginLeft: 8 }}>ライブラリから選択</Text>
              </Button>
              <Button variant="secondary" onPress={takePhoto} style={{ flex: 1 }}>
                <Plus size={16} color="#1db954" />
                <Text style={{ marginLeft: 8 }}>写真を撮る</Text>
              </Button>
            </View>
          )}

          <Text color="secondary" style={{ fontSize: 12, marginTop: 8 }}>
            最大5枚まで選択できます（{images.length}/5）
          </Text>
        </Card>

        {error && (
          <Card style={{ padding: 16, backgroundColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)' }}>
            <Text color="error" style={{ textAlign: 'center' }}>
              {error}
            </Text>
          </Card>
        )}

        {/* Submit */}
        <Card style={{ padding: 16 }}>
          <Button
            onPress={handleSubmit}
            disabled={loading || !formData.address_text.trim()}
            style={{ marginBottom: 8 }}
          >
            <Text>
              {loading ? '投稿中...' : '口コミを投稿'}
            </Text>
          </Button>
          <Button
            variant="secondary"
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text>キャンセル</Text>
          </Button>
        </Card>
      </View>
    </ScrollView>
  )
}