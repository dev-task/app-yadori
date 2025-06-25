/**
 * Mapbox Geocoding API utilities
 * 住所検索とリバースジオコーディング機能を提供
 */

export interface GeocodingResult {
  id: string
  place_name: string
  center: [number, number] // [longitude, latitude]
  text: string
  properties?: {
    category?: string
    address?: string
  }
  context?: Array<{
    id: string
    text: string
  }>
}

export interface LocationData {
  address: string
  latitude: number
  longitude: number
  formatted_address?: string
  place_type?: string
  confidence?: number
}

/**
 * 住所からジオコーディング（住所 → 座標）
 */
export const geocodeAddress = async (
  address: string,
  options: {
    country?: string
    language?: string
    limit?: number
    proximity?: [number, number]
    types?: string[]
  } = {}
): Promise<GeocodingResult[]> => {
  const accessToken = process.env.VITE_MAPBOX_ACCESS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error('Mapbox access token is not configured')
  }

  const {
    country = 'JP',
    language = 'ja',
    limit = 8,
    proximity = [139.7671, 35.6812], // Tokyo Station
    types = ['address', 'poi', 'place']
  } = options

  try {
    const params = new URLSearchParams({
      access_token: accessToken,
      country,
      language,
      limit: limit.toString(),
      types: types.join(','),
      proximity: proximity.join(',')
    })

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?${params}`
    )

    if (!response.ok) {
      throw new Error(`Geocoding request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.features) {
      return data.features.map((feature: any) => ({
        id: feature.id,
        place_name: feature.place_name,
        center: feature.center,
        text: feature.text,
        properties: feature.properties,
        context: feature.context
      }))
    }

    return []
  } catch (error) {
    console.error('Geocoding error:', error)
    throw new Error('住所の検索に失敗しました')
  }
}

/**
 * 座標からリバースジオコーディング（座標 → 住所）
 */
export const reverseGeocode = async (
  longitude: number,
  latitude: number,
  options: {
    language?: string
    types?: string[]
    country?: string
    precision?: 'high' | 'medium' | 'low'
  } = {}
): Promise<LocationData> => {
  const accessToken = process.env.VITE_MAPBOX_ACCESS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error('Mapbox access token is not configured')
  }

  const {
    language = 'ja',
    types = ['address', 'poi', 'place'],
    country = 'JP',
    precision = 'high'
  } = options

  try {
    const params = new URLSearchParams({
      access_token: accessToken,
      language,
      types: types.join(','),
      country,
      limit: '1'
    })

    // 精度に応じて座標の丸め処理
    const roundedLng = precision === 'high' ? longitude : 
                     precision === 'medium' ? Math.round(longitude * 1000) / 1000 :
                     Math.round(longitude * 100) / 100
    const roundedLat = precision === 'high' ? latitude :
                      precision === 'medium' ? Math.round(latitude * 1000) / 1000 :
                      Math.round(latitude * 100) / 100

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${roundedLng},${roundedLat}.json?${params}`
    )

    if (!response.ok) {
      throw new Error(`Reverse geocoding request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      
      // 住所の品質を評価
      const confidence = calculateAddressConfidence(feature)
      
      // 住所を日本語形式に整形
      const formattedAddress = formatJapaneseAddress(feature)
      
      return {
        address: formattedAddress || feature.place_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        latitude: roundedLat,
        longitude: roundedLng,
        formatted_address: feature.place_name,
        place_type: feature.place_type?.[0] || 'unknown',
        confidence
      }
    }

    // フォールバック: より広い範囲で再検索
    return await fallbackReverseGeocode(longitude, latitude, language)
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    
    // エラー時のフォールバック
    return await fallbackReverseGeocode(longitude, latitude, options.language || 'ja')
  }
}

/**
 * フォールバック用のリバースジオコーディング
 */
const fallbackReverseGeocode = async (
  longitude: number,
  latitude: number,
  language: string
): Promise<LocationData> => {
  try {
    // より広い範囲の地名を取得
    const accessToken = process.env.VITE_MAPBOX_ACCESS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
    const params = new URLSearchParams({
      access_token: accessToken,
      language,
      types: 'place,district,locality',
      country: 'JP',
      limit: '1'
    })

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?${params}`
    )

    if (response.ok) {
      const data = await response.json()
      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        return {
          address: `${feature.text}付近`,
          latitude,
          longitude,
          formatted_address: feature.place_name,
          place_type: 'approximate',
          confidence: 0.3
        }
      }
    }
  } catch (error) {
    console.error('Fallback reverse geocoding error:', error)
  }

  // 最終フォールバック: 座標表示
  return {
    address: `緯度: ${latitude.toFixed(6)}, 経度: ${longitude.toFixed(6)}`,
    latitude,
    longitude,
    formatted_address: `座標: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    place_type: 'coordinate',
    confidence: 0.1
  }
}

/**
 * 日本語住所の整形
 */
const formatJapaneseAddress = (feature: any): string => {
  if (!feature.context) return feature.place_name

  try {
    const components = feature.context.reduce((acc: any, item: any) => {
      if (item.id.includes('country')) acc.country = item.text
      if (item.id.includes('region')) acc.region = item.text
      if (item.id.includes('postcode')) acc.postcode = item.text
      if (item.id.includes('district')) acc.district = item.text
      if (item.id.includes('place')) acc.place = item.text
      if (item.id.includes('locality')) acc.locality = item.text
      if (item.id.includes('neighborhood')) acc.neighborhood = item.text
      return acc
    }, {})

    // 日本語住所の構築
    const parts = []
    if (components.region) parts.push(components.region)
    if (components.place && components.place !== components.region) parts.push(components.place)
    if (components.district && components.district !== components.place) parts.push(components.district)
    if (components.locality && components.locality !== components.district) parts.push(components.locality)
    if (components.neighborhood) parts.push(components.neighborhood)
    if (feature.text && !parts.includes(feature.text)) parts.push(feature.text)

    return parts.length > 0 ? parts.join('') : feature.place_name
  } catch (error) {
    return feature.place_name
  }
}

/**
 * 住所の信頼度を計算
 */
const calculateAddressConfidence = (feature: any): number => {
  let confidence = 0.5 // ベース信頼度

  // 住所の詳細度に基づく調整
  if (feature.place_type?.includes('address')) confidence += 0.4
  if (feature.place_type?.includes('poi')) confidence += 0.3
  if (feature.place_type?.includes('place')) confidence += 0.2

  // コンテキスト情報の豊富さ
  if (feature.context && feature.context.length > 3) confidence += 0.1
  if (feature.properties?.accuracy) confidence += 0.1

  // 日本語テキストの存在
  if (/[\u4e00-\u9faf\u3040-\u309f\u30a0-\u30ff]/.test(feature.text)) confidence += 0.1

  return Math.min(confidence, 1.0)
}

/**
 * 住所の妥当性をチェック
 */
export const validateAddress = (address: string): boolean => {
  if (!address || address.trim().length < 2) {
    return false
  }

  // 基本的な住所パターンをチェック
  const addressPatterns = [
    /[\u4e00-\u9faf]+/, // 漢字
    /[\u3040-\u309f]+/, // ひらがな
    /[\u30a0-\u30ff]+/, // カタカナ
    /\d+/, // 数字
    /[a-zA-Z]+/ // 英字
  ]

  return addressPatterns.some(pattern => pattern.test(address))
}

/**
 * 住所を正規化（統一形式に変換）
 */
export const normalizeAddress = (address: string): string => {
  if (!address) return ''

  return address
    .trim()
    .replace(/\s+/g, ' ') // 複数の空白を1つに
    .replace(/　+/g, ' ') // 全角スペースを半角に
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0)) // 全角数字を半角に
    .replace(/[Ａ-Ｚａ-ｚ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0)) // 全角英字を半角に
}

/**
 * エラーハンドリング用のヘルパー
 */
export const handleGeocodingError = (error: any): string => {
  if (error.message?.includes('access token')) {
    return 'APIキーが設定されていません'
  } else if (error.message?.includes('rate limit')) {
    return '検索回数の上限に達しました。しばらく待ってから再試行してください'
  } else if (error.message?.includes('network')) {
    return 'ネットワークエラーが発生しました'
  } else if (error.message?.includes('403')) {
    return 'APIアクセスが拒否されました。APIキーを確認してください'
  } else if (error.message?.includes('404')) {
    return '指定された場所が見つかりませんでした'
  } else {
    return '住所の検索に失敗しました'
  }
}