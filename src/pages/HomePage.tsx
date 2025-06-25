import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PlusCircle, Search, TrendingUp, Play, ArrowRight, Sparkles, Users, Star, X } from 'lucide-react'
import { Toast } from '../components/ui/Toast'
import { ReviewCard } from '../components/ReviewCard'
import { Card, Button, Badge } from '../components/ui'
import { supabase } from '../lib/supabase'
import { Database } from '../lib/database.types'
import { useI18n } from '../contexts/I18nContext'

type Review = Database['public']['Tables']['reviews']['Row'] & {
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

export const HomePage: React.FC = () => {
  const location = useLocation()
  const { t } = useI18n()
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showFeatures, setShowFeatures] = useState(true)
  const [stats, setStats] = useState({
    totalReviews: 0,
    totalUsers: 0,
    averageRating: 0
  })

  // ローカルストレージから機能紹介セクションの表示状態を読み込み
  useEffect(() => {
    const savedShowFeatures = localStorage.getItem('showFeatures')
    if (savedShowFeatures !== null) {
      setShowFeatures(JSON.parse(savedShowFeatures))
    }
  }, [])

  useEffect(() => {
    // Check if there's a success message from navigation state
    if (location.state?.message) {
      setToastMessage(location.state.message)
      setShowToast(true)
      
      // Clear the state to prevent showing the toast again on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  useEffect(() => {
    fetchRecentReviews()
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Get total reviews count
      const { count: reviewCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })

      // Get total users count
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Get average rating
      const { data: ratingsData } = await supabase
        .from('reviews')
        .select('rating_location, rating_sunlight, rating_soundproof, rating_environment')

      let averageRating = 0
      if (ratingsData && ratingsData.length > 0) {
        const allRatings = ratingsData.flatMap(review => [
          review.rating_location,
          review.rating_sunlight,
          review.rating_soundproof,
          review.rating_environment
        ]).filter(rating => rating !== null) as number[]

        if (allRatings.length > 0) {
          averageRating = allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
        }
      }

      setStats({
        totalReviews: reviewCount || 0,
        totalUsers: userCount || 0,
        averageRating
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchRecentReviews = async () => {
    try {
      setLoading(true)
      
      // 最新のレビューを取得（画像とユーザー情報も含む）
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          users!reviews_user_id_fkey(nickname),
          review_images(image_url)
        `)
        .order('created_at', { ascending: false })
        .limit(8)

      if (reviewsError) {
        console.error('Reviews fetch error:', reviewsError)
        return
      }

      // 各レビューのいいね数とコメント数を取得
      const reviewsWithCounts = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const [likesResult, commentsResult] = await Promise.all([
            supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .eq('review_id', review.id),
            supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('review_id', review.id)
          ])

          return {
            ...review,
            _count: {
              likes: likesResult.count || 0,
              comments: commentsResult.count || 0
            }
          }
        })
      )

      setReviews(reviewsWithCounts)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismissFeatures = () => {
    setShowFeatures(false)
    localStorage.setItem('showFeatures', 'false')
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-spotify-green-500 via-spotify-blue-500 to-spotify-purple-500 opacity-10 rounded-3xl"></div>
        <Card className="relative bg-gradient-to-br from-spotify-gray-800 to-spotify-gray-900 border-spotify-gray-600" padding="lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="flex-1 space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-spotify-green-400" />
                <Badge variant="success" size="sm">{t('common.new')}</Badge>
              </div>
              
              <h1 className="text-responsive-xl font-bold text-white text-shadow">
                {t('home.title')}
              </h1>
              
              <p className="text-spotify-gray-300 text-lg leading-relaxed max-w-2xl">
                {t('home.subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  as={Link}
                  to="/post"
                  variant="primary"
                  size="lg"
                  icon={PlusCircle}
                  className="group"
                >
                  {t('home.postReview')}
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
                
                <Button
                  as={Link}
                  to="/search"
                  variant="secondary"
                  size="lg"
                  icon={Search}
                >
                  {t('home.searchReviews')}
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="lg:ml-8">
              <div className="grid grid-cols-3 gap-4 lg:gap-6">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-spotify-green-400">
                    {stats.totalReviews}
                  </div>
                  <div className="text-spotify-gray-400 text-sm">{t('home.stats.reviews')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-spotify-blue-400">
                    {stats.totalUsers}
                  </div>
                  <div className="text-spotify-gray-400 text-sm">{t('home.stats.users')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-spotify-purple-400">
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
                  </div>
                  <div className="text-spotify-gray-400 text-sm">{t('home.stats.averageRating')}</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Features Section - 非表示可能 */}
      {showFeatures && (
        <div className="relative">
          <div className="grid md:grid-cols-3 gap-6">
            <Card interactive className="group">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-spotify-green-500 bg-opacity-20 rounded-2xl flex-center group-hover:scale-110 transition-transform duration-200">
                  <PlusCircle className="h-6 w-6 text-spotify-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-spotify-green-300 transition-colors duration-200">
                  {t('home.features.realExperience.title')}
                </h3>
                <p className="text-spotify-gray-300 leading-relaxed">
                  {t('home.features.realExperience.description')}
                </p>
              </div>
            </Card>

            <Card interactive className="group">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-spotify-blue-500 bg-opacity-20 rounded-2xl flex-center group-hover:scale-110 transition-transform duration-200">
                  <Search className="h-6 w-6 text-spotify-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-spotify-blue-300 transition-colors duration-200">
                  {t('home.features.easySearch.title')}
                </h3>
                <p className="text-spotify-gray-300 leading-relaxed">
                  {t('home.features.easySearch.description')}
                </p>
              </div>
            </Card>

            <Card interactive className="group">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-spotify-purple-500 bg-opacity-20 rounded-2xl flex-center group-hover:scale-110 transition-transform duration-200">
                  <TrendingUp className="h-6 w-6 text-spotify-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-spotify-purple-300 transition-colors duration-200">
                  {t('home.features.trustableInfo.title')}
                </h3>
                <p className="text-spotify-gray-300 leading-relaxed">
                  {t('home.features.trustableInfo.description')}
                </p>
              </div>
            </Card>
          </div>

          {/* 非表示ボタン */}
          <button
            onClick={handleDismissFeatures}
            className="absolute -top-2 -right-2 w-8 h-8 bg-spotify-gray-700 hover:bg-spotify-gray-600 text-spotify-gray-400 hover:text-white rounded-full flex-center transition-all duration-200 shadow-lg hover:shadow-xl"
            title="この機能紹介を非表示にする"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Recent Reviews Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-responsive-lg font-bold text-white flex items-center space-x-3">
              <div className="w-1 h-8 bg-spotify-green-500 rounded-full"></div>
              <span>{t('home.latestReviews')}</span>
            </h2>
            <p className="text-spotify-gray-400">
              {t('home.latestReviewsSubtitle')}
            </p>
          </div>
          
          {reviews.length > 0 && (
            <Button
              as={Link}
              to="/search"
              variant="ghost"
              icon={ArrowRight}
              iconPosition="right"
              className="hidden sm:flex"
            >
              {t('common.viewAll')}
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex-center py-16">
            <div className="text-center space-y-4">
              <div className="spinner w-12 h-12 mx-auto"></div>
              <p className="text-spotify-gray-400">{t('common.loading')}</p>
            </div>
          </div>
        ) : reviews.length > 0 ? (
          <>
            <div className="grid-responsive">
              {reviews.map((review) => (
                <div key={review.id} className="animate-slide-up">
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
            
            {/* Mobile "View All" button */}
            <div className="sm:hidden flex justify-center pt-4">
              <Button
                as={Link}
                to="/search"
                variant="secondary"
                icon={ArrowRight}
                iconPosition="right"
                fullWidth
              >
                {t('common.viewAll')}
              </Button>
            </div>
          </>
        ) : (
          <Card className="text-center py-16">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-spotify-gray-700 rounded-full flex-center mx-auto">
                <Users className="h-10 w-10 text-spotify-gray-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">
                  {t('home.noReviewsYet')}
                </h3>
                <p className="text-spotify-gray-400 max-w-md mx-auto">
                  {t('home.noReviewsSubtitle')}
                </p>
              </div>
              
              <Button
                as={Link}
                to="/post"
                variant="primary"
                icon={PlusCircle}
                size="lg"
              >
                {t('home.postFirstReview')}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-spotify-green-500 to-spotify-blue-500 border-none text-center">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-black">
            {t('home.shareYourExperience')}
          </h3>
          <p className="text-black text-opacity-80 max-w-2xl mx-auto">
            {t('home.shareExperienceSubtitle')}
          </p>
          <Button
            as={Link}
            to="/post"
            variant="secondary"
            size="lg"
            className="bg-black text-white hover:bg-gray-800 border-black"
          >
            {t('home.postNow')}
          </Button>
        </div>
      </Card>
    </div>
  )
}