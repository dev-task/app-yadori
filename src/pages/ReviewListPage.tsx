import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  MapPin, 
  Star, 
  Calendar,
  DollarSign,
  Home,
  ChevronLeft,
  ChevronRight,
  X,
  Sliders,
  Plus
} from 'lucide-react'
import { useI18n } from '../contexts/I18nContext'
import { supabase } from '../lib/supabase'
import { Database } from '../lib/database.types'
import { ReviewCard } from '../components/ReviewCard'
import { Card, Button } from '../components/ui'

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

type SortOption = 'newest' | 'oldest' | 'rating' | 'rent_low' | 'rent_high'

interface FilterOptions {
  minRent: number | null
  maxRent: number | null
  layout: string
  minRating: number | null
  hasImages: boolean | null
}

const ITEMS_PER_PAGE = 12

export const ReviewListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useI18n()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    minRent: null,
    maxRent: null,
    layout: '',
    minRating: null,
    hasImages: null
  })

  // URLパラメータから初期値を設定
  useEffect(() => {
    const query = searchParams.get('q') || ''
    const sort = (searchParams.get('sort') as SortOption) || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    
    setSearchQuery(query)
    setSortBy(sort)
    setCurrentPage(page)
  }, [searchParams])

  useEffect(() => {
    fetchReviews()
  }, [currentPage, searchQuery, sortBy, filters])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('reviews')
        .select(`
          *,
          users!reviews_user_id_fkey(nickname),
          review_images(image_url)
        `, { count: 'exact' })

      // 検索クエリの適用
      if (searchQuery.trim()) {
        query = query.ilike('address_text', `%${searchQuery.trim()}%`)
      }

      // フィルターの適用
      if (filters.minRent !== null) {
        query = query.gte('rent', filters.minRent)
      }
      if (filters.maxRent !== null) {
        query = query.lte('rent', filters.maxRent)
      }
      if (filters.layout) {
        query = query.ilike('layout', `%${filters.layout}%`)
      }
      if (filters.minRating !== null) {
        // 平均評価でフィルタリング（複雑なクエリなので簡略化）
        // 実際の実装では、計算済みの平均評価カラムを使用することを推奨
      }

      // ソートの適用
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'rent_low':
          query = query.order('rent', { ascending: true, nullsLast: true })
          break
        case 'rent_high':
          query = query.order('rent', { ascending: false, nullsLast: true })
          break
        case 'rating':
          // 平均評価でソート（簡略化）
          query = query.order('created_at', { ascending: false })
          break
      }

      // ページネーション
      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      query = query.range(from, to)

      const { data: reviewsData, error: reviewsError, count } = await query

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
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    updateURL({ q: searchQuery, page: '1' })
  }

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    setCurrentPage(1)
    updateURL({ sort: newSort, page: '1' })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateURL({ page: page.toString() })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateURL = (params: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(searchParams)
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value)
      } else {
        newSearchParams.delete(key)
      }
    })
    setSearchParams(newSearchParams)
  }

  const clearFilters = () => {
    setFilters({
      minRent: null,
      maxRent: null,
      layout: '',
      minRating: null,
      hasImages: null
    })
  }

  const hasActiveFilters = () => {
    return filters.minRent !== null || 
           filters.maxRent !== null || 
           filters.layout !== '' || 
           filters.minRating !== null || 
           filters.hasImages !== null
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const getSortLabel = (sort: SortOption) => {
    return t(`search.sortOptions.${sort}`)
  }

  const Pagination: React.FC = () => {
    if (totalPages <= 1) return null

    const getPageNumbers = () => {
      const pages = []
      const maxVisible = 5
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(totalPages)
        } else if (currentPage >= totalPages - 2) {
          pages.push(1)
          pages.push('...')
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i)
          }
        } else {
          pages.push(1)
          pages.push('...')
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(totalPages)
        }
      }
      
      return pages
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-spotify-gray-800 border border-spotify-gray-600 text-spotify-gray-300 hover:bg-spotify-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-spotify-gray-500">...</span>
            ) : (
              <button
                onClick={() => handlePageChange(page as number)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-spotify-green-500 text-black font-semibold'
                    : 'bg-spotify-gray-800 border border-spotify-gray-600 text-spotify-gray-300 hover:bg-spotify-gray-700 hover:text-white'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-spotify-gray-800 border border-spotify-gray-600 text-spotify-gray-300 hover:bg-spotify-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card padding="lg" className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-spotify-green-500 via-spotify-blue-500 to-spotify-purple-500 opacity-10"></div>
        
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{t('search.title')}</h1>
              <p className="text-spotify-gray-300 mt-1">
                {totalCount > 0 ? `${totalCount}${t('search.resultsFound')}` : t('search.noResults')}
              </p>
            </div>
            
            {/* Search form */}
            <form onSubmit={handleSearch} className="flex space-x-2 lg:w-96">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-spotify-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.searchPlaceholder')}
                  className="input-field pl-12 w-full"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                icon={Search}
              >
                {t('search.searchButton')}
              </Button>
            </form>
          </div>
        </div>
      </Card>

      {/* Controls */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-4">
            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="appearance-none bg-spotify-gray-800 border border-spotify-gray-600 text-white rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-spotify-green-500 focus:border-transparent hover:bg-spotify-gray-700 transition-colors"
              >
                <option value="newest">{t('search.sortOptions.newest')}</option>
                <option value="oldest">{t('search.sortOptions.oldest')}</option>
                <option value="rating">{t('search.sortOptions.rating')}</option>
                <option value="rent_low">{t('search.sortOptions.rentLow')}</option>
                <option value="rent_high">{t('search.sortOptions.rentHigh')}</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <SortAsc className="h-4 w-4 text-spotify-gray-400" />
              </div>
            </div>

            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                hasActiveFilters()
                  ? 'border-spotify-green-500 bg-spotify-green-500 bg-opacity-20 text-spotify-green-400'
                  : 'border-spotify-gray-600 bg-spotify-gray-800 text-spotify-gray-300 hover:bg-spotify-gray-700 hover:text-white'
              }`}
            >
              <Sliders className="h-4 w-4" />
              <span>{t('search.filters')}</span>
              {hasActiveFilters() && (
                <span className="bg-spotify-green-500 text-black text-xs px-2 py-0.5 rounded-full font-semibold">
                  ON
                </span>
              )}
            </button>
          </div>

          {/* Results info */}
          <div className="text-sm text-spotify-gray-400">
            {totalCount > 0 && (
              <span>
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} / {totalCount}件
              </span>
            )}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-spotify-gray-700">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Rent range */}
              <div>
                <label className="block text-sm font-medium text-spotify-gray-300 mb-2">
                  {t('search.filterOptions.rentRange')}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder={t('search.filterOptions.minRent')}
                    value={filters.minRent || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      minRent: e.target.value ? parseInt(e.target.value) : null
                    }))}
                    className="input-field w-full text-sm"
                  />
                  <input
                    type="number"
                    placeholder={t('search.filterOptions.maxRent')}
                    value={filters.maxRent || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      maxRent: e.target.value ? parseInt(e.target.value) : null
                    }))}
                    className="input-field w-full text-sm"
                  />
                </div>
              </div>

              {/* Layout */}
              <div>
                <label className="block text-sm font-medium text-spotify-gray-300 mb-2">
                  {t('search.filterOptions.layout')}
                </label>
                <input
                  type="text"
                  placeholder={t('search.filterOptions.layoutPlaceholder')}
                  value={filters.layout}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    layout: e.target.value
                  }))}
                  className="input-field w-full text-sm"
                />
              </div>

              {/* Minimum rating */}
              <div>
                <label className="block text-sm font-medium text-spotify-gray-300 mb-2">
                  {t('search.filterOptions.minRating')}
                </label>
                <select
                  value={filters.minRating || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    minRating: e.target.value ? parseInt(e.target.value) : null
                  }))}
                  className="input-field w-full text-sm"
                >
                  <option value="">{t('search.filterOptions.noSpecification')}</option>
                  <option value="1">{t('search.filterOptions.ratingOptions.1')}</option>
                  <option value="2">{t('search.filterOptions.ratingOptions.2')}</option>
                  <option value="3">{t('search.filterOptions.ratingOptions.3')}</option>
                  <option value="4">{t('search.filterOptions.ratingOptions.4')}</option>
                  <option value="5">{t('search.filterOptions.ratingOptions.5')}</option>
                </select>
              </div>

              {/* Has images */}
              <div>
                <label className="block text-sm font-medium text-spotify-gray-300 mb-2">
                  {t('search.filterOptions.photos')}
                </label>
                <select
                  value={filters.hasImages === null ? '' : filters.hasImages.toString()}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    hasImages: e.target.value === '' ? null : e.target.value === 'true'
                  }))}
                  className="input-field w-full text-sm"
                >
                  <option value="">{t('search.filterOptions.noSpecification')}</option>
                  <option value="true">{t('search.filterOptions.withPhotos')}</option>
                  <option value="false">{t('search.filterOptions.withoutPhotos')}</option>
                </select>
              </div>
            </div>

            {/* Filter actions */}
            {hasActiveFilters() && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-2 px-3 py-1 text-sm text-spotify-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>{t('search.clearFilters')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Results */}
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
          <Pagination />
        </>
      ) : (
        <Card className="text-center py-16">
          <div className="space-y-6">
            <div className="w-20 h-20 bg-spotify-gray-700 rounded-full flex-center mx-auto">
              <Search className="h-10 w-10 text-spotify-gray-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">
                {t('search.noResults')}
              </h3>
              <p className="text-spotify-gray-400 max-w-md mx-auto">
                {t('search.noResultsMessage')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => {
                  setSearchQuery('')
                  clearFilters()
                  setCurrentPage(1)
                  updateURL({ q: '', page: '1' })
                }}
                variant="secondary"
              >
                {t('search.resetSearch')}
              </Button>
              <Button
                as={Link}
                to="/post"
                variant="primary"
                icon={Plus}
              >
                {t('search.postReview')}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}