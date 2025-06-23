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
  Sliders
} from 'lucide-react'
import { useI18n } from '../contexts/I18nContext'
import { supabase } from '../lib/supabase'
import { Database } from '../lib/database.types'
import { ReviewCard } from '../components/ReviewCard'

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
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-gray-500">...</span>
            ) : (
              <button
                onClick={() => handlePageChange(page as number)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
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
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('search.title')}</h1>
            <p className="text-gray-600 mt-1">
              {totalCount > 0 ? `${totalCount}${t('search.resultsFound')}` : t('search.noResults')}
            </p>
          </div>
          
          {/* Search form */}
          <form onSubmit={handleSearch} className="flex space-x-2 lg:w-96">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search.searchPlaceholder')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('search.searchButton')}
            </button>
          </form>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-4">
            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">{t('search.sortOptions.newest')}</option>
                <option value="oldest">{t('search.sortOptions.oldest')}</option>
                <option value="rating">{t('search.sortOptions.rating')}</option>
                <option value="rent_low">{t('search.sortOptions.rentLow')}</option>
                <option value="rent_high">{t('search.sortOptions.rentHigh')}</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <SortAsc className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                hasActiveFilters()
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Sliders className="h-4 w-4" />
              <span>{t('search.filters')}</span>
              {hasActiveFilters() && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  ON
                </span>
              )}
            </button>
          </div>

          {/* Results info */}
          <div className="text-sm text-gray-600">
            {totalCount > 0 && (
              <span>
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} / {totalCount}件
              </span>
            )}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Rent range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder={t('search.filterOptions.maxRent')}
                    value={filters.maxRent || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      maxRent: e.target.value ? parseInt(e.target.value) : null
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Layout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Minimum rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('search.filterOptions.minRating')}
                </label>
                <select
                  value={filters.minRating || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    minRating: e.target.value ? parseInt(e.target.value) : null
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('search.filterOptions.photos')}
                </label>
                <select
                  value={filters.hasImages === null ? '' : filters.hasImages.toString()}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    hasImages: e.target.value === '' ? null : e.target.value === 'true'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>{t('search.clearFilters')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : reviews.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          <Pagination />
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('search.noResults')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('search.noResultsMessage')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setSearchQuery('')
                clearFilters()
                setCurrentPage(1)
                updateURL({ q: '', page: '1' })
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('search.resetSearch')}
            </button>
            <Link
              to="/post"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('search.postReview')}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}