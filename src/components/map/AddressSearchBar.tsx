import React, { useState, useEffect, useRef } from 'react'
import { Search, MapPin, X, Loader, Building, Navigation, Home } from 'lucide-react'
import { useI18n } from '../../contexts/I18nContext'
import { geocodeAddress, GeocodingResult, getAddressType, handleGeocodingError, normalizeAddress, validateAddress } from '../../utils/geocoding'

interface AddressSearchBarProps {
  onLocationSelect: (location: {
    address: string
    latitude: number
    longitude: number
  }) => void
  placeholder?: string
  initialValue?: string
  className?: string
}

export const AddressSearchBar: React.FC<AddressSearchBarProps> = ({
  onLocationSelect,
  placeholder,
  initialValue = '',
  className = ''
}) => {
  const { t } = useI18n()
  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isComposing, setIsComposing] = useState(false) // IME入力中かどうか
  const debounceRef = useRef<NodeJS.Timeout>()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // サジェスト表示のためのデバウンス検索（地図は移動しない）
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // IME入力中は検索を実行しない
    if (isComposing) {
      return
    }

    const normalizedQuery = normalizeAddress(query)
    
    if (!validateAddress(normalizedQuery)) {
      setResults([])
      setShowResults(false)
      setError('')
      setSelectedIndex(-1)
      return
    }

    debounceRef.current = setTimeout(() => {
      searchAddressesForSuggestions(normalizedQuery)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, isComposing]) // isComposingを依存配列に追加

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showResults || results.length === 0 || isComposing) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : results.length - 1
          )
          break
        case 'Enter':
          event.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleResultSelect(results[selectedIndex])
          } else {
            // Enterキーが押された場合、現在の入力で検索実行
            handleSearchSubmit()
          }
          break
        case 'Escape':
          setShowResults(false)
          setSelectedIndex(-1)
          inputRef.current?.blur()
          break
      }
    }

    if (showResults) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [showResults, results, selectedIndex, query, isComposing])

  // サジェスト表示用の検索（地図は移動しない）
  const searchAddressesForSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError('')
    setSelectedIndex(-1)

    try {
      const searchResults = await geocodeAddress(searchQuery, {
        country: 'JP',
        language: 'ja',
        limit: 8,
        proximity: [139.7671, 35.6812], // Tokyo Station
        types: ['address', 'poi', 'place']
      })
      
      setResults(searchResults)
      setShowResults(searchResults.length > 0)
    } catch (error: any) {
      console.error('Address search error:', error)
      const errorMessage = handleGeocodingError(error)
      setError(errorMessage)
      setResults([])
      setShowResults(true) // Show error message
    } finally {
      setIsLoading(false)
    }
  }

  // 検索実行（Enterキーまたは検索ボタン押下時）
  const handleSearchSubmit = async () => {
    const normalizedQuery = normalizeAddress(query)
    
    if (!validateAddress(normalizedQuery)) {
      setError('有効な住所を入力してください')
      setShowResults(true)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const searchResults = await geocodeAddress(normalizedQuery, {
        country: 'JP',
        language: 'ja',
        limit: 1, // 最初の結果のみを使用
        proximity: [139.7671, 35.6812],
        types: ['address', 'poi', 'place']
      })
      
      if (searchResults.length > 0) {
        handleResultSelect(searchResults[0])
      } else {
        setError('該当する住所が見つかりませんでした')
        setShowResults(true)
      }
    } catch (error: any) {
      console.error('Address search error:', error)
      const errorMessage = handleGeocodingError(error)
      setError(errorMessage)
      setShowResults(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResultSelect = (result: GeocodingResult) => {
    const [longitude, latitude] = result.center
    setQuery(result.place_name)
    setShowResults(false)
    setError('')
    setSelectedIndex(-1)
    
    // 地図を移動させる
    onLocationSelect({
      address: result.place_name,
      latitude,
      longitude
    })
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
    setError('')
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleInputFocus = () => {
    if (results.length > 0 && !error) {
      setShowResults(true)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setSelectedIndex(-1)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // IME入力中は検索を実行しない
    if (!isComposing) {
      handleSearchSubmit()
    }
  }

  // IME関連のイベントハンドラー
  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  const handleCompositionEnd = () => {
    setIsComposing(false)
  }

  const getCategoryIcon = (result: GeocodingResult) => {
    const addressType = getAddressType(result)
    
    switch (addressType) {
      case 'station':
        return <Navigation className="h-4 w-4 text-spotify-blue-400" />
      case 'administrative':
        return <Building className="h-4 w-4 text-spotify-purple-400" />
      case 'address':
        return <Home className="h-4 w-4 text-spotify-green-400" />
      default:
        return <MapPin className="h-4 w-4 text-spotify-green-400" />
    }
  }

  const getResultTypeLabel = (result: GeocodingResult): string => {
    const addressType = getAddressType(result)
    
    switch (addressType) {
      case 'station':
        return '駅'
      case 'administrative':
        return '地域'
      case 'address':
        return '住所'
      default:
        return 'スポット'
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleFormSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader className="h-5 w-5 text-spotify-green-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-spotify-gray-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder={placeholder || t('map.searchPlaceholder')}
          className="input-field pl-12 pr-20 w-full"
          disabled={isLoading}
          autoComplete="off"
          spellCheck="false"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-spotify-gray-400 hover:text-white transition-colors rounded"
              tabIndex={-1}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          <button
            type="submit"
            disabled={isLoading || !query.trim() || isComposing}
            className="px-3 py-1 bg-spotify-green-500 hover:bg-spotify-green-400 disabled:bg-spotify-gray-600 disabled:cursor-not-allowed text-black text-sm font-medium rounded transition-colors"
          >
            検索
          </button>
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full mt-2 w-full bg-spotify-gray-800 border border-spotify-gray-600 rounded-xl shadow-spotify-lg z-10 max-h-80 overflow-y-auto">
          {error ? (
            <div className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-red-500 bg-opacity-20 rounded-lg flex-center flex-shrink-0">
                  <X className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <p className="text-red-400 text-sm font-medium">検索エラー</p>
                  <p className="text-red-300 text-xs mt-1">{error}</p>
                </div>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center">
              <div className="w-12 h-12 bg-spotify-gray-700 rounded-full flex-center mx-auto mb-3">
                <Search className="h-6 w-6 text-spotify-gray-500" />
              </div>
              <p className="text-spotify-gray-400 text-sm">検索結果が見つかりませんでした</p>
              <p className="text-spotify-gray-500 text-xs mt-1">
                別のキーワードで検索してみてください
              </p>
            </div>
          ) : (
            <div className="py-2">
              <div className="px-4 py-2 border-b border-spotify-gray-700">
                <p className="text-spotify-gray-400 text-xs">
                  候補を選択するか、Enterキーで検索してください
                </p>
              </div>
              {results.map((result, index) => (
                <button
                  key={result.id || index}
                  onClick={() => handleResultSelect(result)}
                  className={`w-full px-4 py-3 text-left transition-colors group ${
                    index === selectedIndex
                      ? 'bg-spotify-gray-700'
                      : 'hover:bg-spotify-gray-700'
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 bg-spotify-green-500 bg-opacity-20 rounded-lg flex-center flex-shrink-0 mt-0.5 transition-colors ${
                      index === selectedIndex ? 'bg-opacity-30' : 'group-hover:bg-opacity-30'
                    }`}>
                      {getCategoryIcon(result)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-white text-sm font-medium truncate">
                          {result.text}
                        </p>
                        <span className="text-xs px-2 py-0.5 bg-spotify-gray-600 text-spotify-gray-300 rounded-full flex-shrink-0">
                          {getResultTypeLabel(result)}
                        </span>
                      </div>
                      <p className="text-spotify-gray-400 text-xs line-clamp-2 leading-relaxed">
                        {result.place_name}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && !showResults && (
        <div className="absolute top-full mt-2 w-full bg-spotify-gray-800 border border-spotify-gray-600 rounded-xl shadow-spotify-lg z-10">
          <div className="p-4 flex items-center space-x-3">
            <div className="spinner w-4 h-4"></div>
            <span className="text-spotify-gray-400 text-sm">{t('map.searching')}</span>
          </div>
        </div>
      )}

      {/* Search hints */}
      {query.length > 0 && query.length < 2 && !isLoading && !isComposing && (
        <div className="absolute top-full mt-2 w-full bg-spotify-gray-800 border border-spotify-gray-600 rounded-xl shadow-spotify-lg z-10">
          <div className="p-4 text-center">
            <p className="text-spotify-gray-400 text-sm">
              2文字以上入力してください
            </p>
          </div>
        </div>
      )}
    </div>
  )
}