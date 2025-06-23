import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  User, 
  Edit2, 
  Save, 
  X, 
  MapPin, 
  Calendar, 
  Star, 
  Heart, 
  MessageCircle,
  TrendingUp,
  Award,
  Settings,
  Camera,
  Mail,
  AlertCircle,
  Plus,
  Grid3X3,
  BarChart3
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { supabase } from '../lib/supabase'
import { Database } from '../lib/database.types'
import { ReviewCard } from '../components/ReviewCard'
import { Toast } from '../components/ui/Toast'
import { Card, Button, Input, Textarea, Badge } from '../components/ui'

type UserProfile = Database['public']['Tables']['users']['Row']
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

interface UserStats {
  totalReviews: number
  totalLikes: number
  totalComments: number
  averageRating: number
  joinedDate: string
}

export const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    nickname: '',
    bio: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [activeTab, setActiveTab] = useState<'reviews' | 'settings'>('reviews')

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchUserReviews()
      fetchUserStats()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      // First, try to fetch existing profile
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .limit(1)

      if (error) {
        console.error('Profile fetch error:', error)
        return
      }

      // If profile exists, use it
      if (data && data.length > 0) {
        setProfile(data[0])
        setEditForm({
          nickname: data[0].nickname || '',
          bio: data[0].bio || ''
        })
        return
      }

      // If no profile exists, create one
      const defaultNickname = user.email?.split('@')[0] || 'ユーザー'
      
      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          nickname: defaultNickname,
          bio: ''
        })
        .select()
        .single()

      if (insertError) {
        console.error('Profile creation error:', insertError)
        return
      }

      setProfile(newProfile)
      setEditForm({
        nickname: newProfile.nickname || '',
        bio: newProfile.bio || ''
      })
    } catch (error) {
      console.error('Error fetching/creating profile:', error)
    }
  }

  const fetchUserReviews = async () => {
    if (!user) return

    try {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(`
          *,
          users!reviews_user_id_fkey(nickname),
          review_images(image_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Reviews fetch error:', error)
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
      console.error('Error fetching user reviews:', error)
    }
  }

  const fetchUserStats = async () => {
    if (!user) return

    try {
      // レビュー数を取得
      const { count: reviewCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // いいね数を取得（自分のレビューに対するいいね）
      const { data: reviewIds } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', user.id)

      let totalLikes = 0
      if (reviewIds && reviewIds.length > 0) {
        const { count: likesCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .in('review_id', reviewIds.map(r => r.id))
        
        totalLikes = likesCount || 0
      }

      // コメント数を取得（自分が投稿したコメント）
      const { count: commentCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // 平均評価を計算
      const { data: ratingsData } = await supabase
        .from('reviews')
        .select('rating_location, rating_sunlight, rating_soundproof, rating_environment')
        .eq('user_id', user.id)

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
        totalLikes: totalLikes,
        totalComments: commentCount || 0,
        averageRating: averageRating,
        joinedDate: user.created_at
      })
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user || !profile) return

    setSaving(true)
    setError('')

    try {
      const { error } = await supabase
        .from('users')
        .update({
          nickname: editForm.nickname.trim(),
          bio: editForm.bio.trim()
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => prev ? {
        ...prev,
        nickname: editForm.nickname.trim(),
        bio: editForm.bio.trim()
      } : null)

      setIsEditing(false)
      setToastMessage(t('profile.profileUpdated'))
      setToastType('success')
      setShowToast(true)
    } catch (error: any) {
      console.error('Profile update error:', error)
      setError(t('profile.profileUpdateError'))
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({
        nickname: profile.nickname || '',
        bio: profile.bio || ''
      })
    }
    setIsEditing(false)
    setError('')
  }

  const handleSignOut = async () => {
    if (confirm(t('profile.logoutConfirm'))) {
      try {
        await signOut()
        navigate('/')
      } catch (error) {
        console.error('Sign out error:', error)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const StatCard: React.FC<{
    icon: React.ReactNode
    label: string
    value: string | number
    color: string
    bgColor: string
  }> = ({ icon, label, value, color, bgColor }) => (
    <Card className="text-center group hover:scale-105 transition-transform duration-200">
      <div className="space-y-3">
        <div className={`w-12 h-12 ${bgColor} rounded-2xl flex-center mx-auto group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
        <div>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-spotify-gray-400 text-sm">{label}</p>
        </div>
      </div>
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex-center gradient-bg">
        <div className="text-center space-y-4">
          <div className="spinner w-12 h-12 mx-auto"></div>
          <p className="text-spotify-gray-400">{t('profile.loadingProfile')}</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex-center gradient-bg">
        <Card className="text-center max-w-md">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-red-500 bg-opacity-20 rounded-full flex-center mx-auto">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">
                {t('profile.profileNotFound')}
              </h2>
              <p className="text-spotify-gray-400">
                {t('profile.profileNotFoundMessage')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Toast notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Profile Header */}
      <Card padding="lg" className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-spotify-green-500 via-spotify-blue-500 to-spotify-purple-500 opacity-10"></div>
        
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            {/* Profile info */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-spotify-green-500 to-spotify-blue-500 rounded-full flex-center shadow-glow">
                  <User className="h-12 w-12 text-white" />
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-spotify-green-500 text-black rounded-full flex-center hover:bg-spotify-green-400 transition-colors shadow-lg">
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              {/* Profile details */}
              <div className="flex-1 space-y-3">
                {isEditing ? (
                  <div className="space-y-4 max-w-md">
                    <Input
                      value={editForm.nickname}
                      onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                      placeholder={t('profile.enterNickname')}
                      className="text-xl font-bold"
                    />
                    <Textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder={t('profile.enterIntroduction')}
                      rows={3}
                      maxLength={500}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h1 className="text-2xl lg:text-3xl font-bold text-white">
                      {profile.nickname}
                    </h1>
                    <p className="text-spotify-gray-300 leading-relaxed max-w-2xl">
                      {profile.bio || t('profile.noIntroduction')}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-spotify-gray-400">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{profile.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(profile.created_at)}{t('profile.joinedDate')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving || !editForm.nickname.trim()}
                    variant="primary"
                    icon={Save}
                    loading={saving}
                  >
                    {t('profile.saveProfile')}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    variant="secondary"
                    icon={X}
                  >
                    {t('common.cancel')}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="secondary"
                  icon={Edit2}
                >
                  {t('profile.editProfile')}
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 text-red-400 px-4 py-3 rounded-lg text-sm">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<MapPin className="h-6 w-6 text-spotify-green-400" />}
            label={t('profile.stats.postedReviews')}
            value={stats.totalReviews}
            color="text-spotify-green-400"
            bgColor="bg-spotify-green-500 bg-opacity-20"
          />
          <StatCard
            icon={<Heart className="h-6 w-6 text-red-400" />}
            label={t('profile.stats.receivedLikes')}
            value={stats.totalLikes}
            color="text-red-400"
            bgColor="bg-red-500 bg-opacity-20"
          />
          <StatCard
            icon={<MessageCircle className="h-6 w-6 text-spotify-blue-400" />}
            label={t('profile.stats.postedComments')}
            value={stats.totalComments}
            color="text-spotify-blue-400"
            bgColor="bg-spotify-blue-500 bg-opacity-20"
          />
          <StatCard
            icon={<Star className="h-6 w-6 text-spotify-yellow-400" />}
            label={t('profile.stats.averageRating')}
            value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : t('profile.stats.notRated')}
            color="text-spotify-yellow-400"
            bgColor="bg-spotify-yellow-500 bg-opacity-20"
          />
        </div>
      )}

      {/* Tabs */}
      <Card>
        <div className="border-b border-spotify-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                activeTab === 'reviews'
                  ? 'border-spotify-green-500 text-spotify-green-400'
                  : 'border-transparent text-spotify-gray-400 hover:text-white hover:border-spotify-gray-600'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
              <span>{t('profile.tabs.reviews')} ({reviews.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                activeTab === 'settings'
                  ? 'border-spotify-green-500 text-spotify-green-400'
                  : 'border-transparent text-spotify-gray-400 hover:text-white hover:border-spotify-gray-600'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>{t('profile.tabs.settings')}</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'reviews' ? (
            <div>
              {reviews.length > 0 ? (
                <div className="grid-responsive">
                  {reviews.map((review) => (
                    <div key={review.id} className="animate-slide-up">
                      <ReviewCard review={review} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="space-y-6">
                    <div className="w-20 h-20 bg-spotify-gray-700 rounded-full flex-center mx-auto">
                      <MapPin className="h-10 w-10 text-spotify-gray-500" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-white">
                        {t('profile.noReviews')}
                      </h3>
                      <p className="text-spotify-gray-400 max-w-md mx-auto">
                        {t('profile.noReviewsMessage')}
                      </p>
                    </div>
                    
                    <Button
                      as={Link}
                      to="/post"
                      variant="primary"
                      icon={Plus}
                      size="lg"
                    >
                      {t('profile.postFirstReview')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Account settings */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-spotify-blue-400" />
                  <span>{t('profile.accountSettings')}</span>
                </h3>
                
                <div className="space-y-4">
                  <Card className="bg-spotify-gray-800">
                    <div className="space-y-3">
                      <h4 className="font-medium text-white">{t('profile.email')}</h4>
                      <p className="text-spotify-gray-300">{profile.email}</p>
                      <p className="text-xs text-spotify-gray-500">
                        {t('profile.emailNote')}
                      </p>
                    </div>
                  </Card>

                  <Card className="bg-spotify-gray-800">
                    <div className="space-y-3">
                      <h4 className="font-medium text-white">{t('profile.password')}</h4>
                      <p className="text-spotify-gray-300 text-sm">
                        {t('profile.passwordNote')}
                      </p>
                      <Button variant="ghost" size="sm">
                        {t('profile.changePassword')}
                      </Button>
                    </div>
                  </Card>

                  <Card className="bg-red-500 bg-opacity-10 border-red-500 border-opacity-30">
                    <div className="space-y-3">
                      <h4 className="font-medium text-red-400">{t('profile.deleteAccount')}</h4>
                      <p className="text-red-300 text-sm">
                        {t('profile.deleteAccountNote')}
                      </p>
                      <Button variant="danger" size="sm">
                        {t('profile.deleteAccountButton')}
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Sign out */}
              <div className="pt-6 border-t border-spotify-gray-700">
                <Button
                  onClick={handleSignOut}
                  variant="secondary"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500 hover:bg-opacity-10"
                >
                  {t('navigation.logout')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}