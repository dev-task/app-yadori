import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Star, Heart, MessageCircle, User, Calendar, DollarSign, Home, Play } from 'lucide-react'
import { Database } from '../lib/database.types'

type ReviewCardProps = {
  review: Database['public']['Tables']['reviews']['Row'] & {
    users: {
      nickname: string
    }
    review_images?: {
      image_url: string
    }[]
    _count?: {
      likes: number
      comments: number
    }
  }
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
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

  const getAverageRating = () => {
    const ratings = [
      review.rating_location,
      review.rating_sunlight,
      review.rating_soundproof,
      review.rating_environment
    ].filter(rating => rating !== null) as number[]
    
    if (ratings.length === 0) return null
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
  }

  const averageRating = getAverageRating()

  return (
    <Link to={`/review/${review.id}`} className="block group">
      <div className="card-interactive bg-spotify-gray-800 rounded-2xl overflow-hidden shadow-spotify-lg hover:shadow-spotify-xl transition-all duration-300 hover:bg-spotify-gray-700 border border-spotify-gray-700 hover:border-spotify-gray-600">
        {/* 画像セクション */}
        <div className="relative aspect-video bg-gradient-to-br from-spotify-gray-700 to-spotify-gray-800 overflow-hidden">
          {review.review_images && review.review_images.length > 0 ? (
            <>
              <img
                src={review.review_images[0].image_url}
                alt="物件写真"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {/* オーバーレイ */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-75 group-hover:scale-100">
                  <div className="w-16 h-16 bg-spotify-green-500 rounded-full flex-center shadow-glow">
                    <Play className="h-8 w-8 text-black ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex-center">
              <div className="text-center">
                <Home className="h-12 w-12 text-spotify-gray-500 mx-auto mb-2" />
                <span className="text-spotify-gray-400 text-sm">画像なし</span>
              </div>
            </div>
          )}
          
          {/* 評価バッジ */}
          {averageRating && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-70 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
              <Star className="h-4 w-4 text-spotify-green-400 fill-current" />
              <span className="text-white text-sm font-semibold">
                {averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* コンテンツセクション */}
        <div className="p-6 space-y-4">
          {/* ヘッダー */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-spotify-green-500 rounded-full flex-center">
                <User className="h-4 w-4 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-spotify-gray-300 text-sm font-medium truncate">
                  {review.users.nickname}
                </p>
                <p className="text-spotify-gray-500 text-xs">
                  {formatDate(review.created_at)}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-spotify-green-400 mt-0.5 flex-shrink-0" />
                <h3 className="text-white font-semibold text-lg leading-tight group-hover:text-spotify-green-300 transition-colors duration-200 truncate-2">
                  {review.address_text}
                </h3>
              </div>
            </div>
          </div>

          {/* 基本情報 */}
          <div className="flex items-center space-x-4 text-sm">
            {formatRent(review.rent) && (
              <div className="flex items-center space-x-1 text-spotify-gray-300">
                <DollarSign className="h-4 w-4 text-spotify-green-400" />
                <span className="font-medium">{formatRent(review.rent)}</span>
              </div>
            )}
            {review.layout && (
              <div className="flex items-center space-x-1 text-spotify-gray-300">
                <Home className="h-4 w-4 text-spotify-blue-400" />
                <span className="font-medium">{review.layout}</span>
              </div>
            )}
            {review.period_lived && (
              <div className="flex items-center space-x-1 text-spotify-gray-300">
                <Calendar className="h-4 w-4 text-spotify-purple-400" />
                <span className="font-medium truncate">{review.period_lived}</span>
              </div>
            )}
          </div>

          {/* プレビューテキスト */}
          {(review.pros_text || review.cons_text) && (
            <div className="space-y-2">
              <p className="text-spotify-gray-300 text-sm leading-relaxed truncate-2">
                {review.pros_text && review.pros_text.length > 0 
                  ? review.pros_text 
                  : review.cons_text}
              </p>
            </div>
          )}

          {/* アクション */}
          <div className="flex items-center justify-between pt-4 border-t border-spotify-gray-700">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-spotify-gray-400 hover:text-red-400 transition-colors duration-200">
                <Heart className="h-4 w-4" />
                <span className="text-sm font-medium">{review._count?.likes || 0}</span>
              </div>
              <div className="flex items-center space-x-2 text-spotify-gray-400 hover:text-spotify-blue-400 transition-colors duration-200">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{review._count?.comments || 0}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-spotify-green-400 group-hover:text-spotify-green-300 transition-colors duration-200">
              <span className="text-sm font-semibold">詳細を見る</span>
              <Play className="h-4 w-4 transform rotate-0 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}