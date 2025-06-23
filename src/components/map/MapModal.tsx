import React, { useState, useCallback } from 'react'
import { X, MapPin, Search, Navigation, Check, AlertCircle, Zap, Info } from 'lucide-react'
import { useI18n } from '../../contexts/I18nContext'
import { MapboxMap } from './MapboxMap'
import { AddressSearchBar } from './AddressSearchBar'
import { Card, Button, Badge } from '../ui'

interface MapModalProps {
  isOpen: boolean
  onClose: () => void
  onLocationSelect: (location: {
    address: string
    latitude: number
    longitude: number
  }) => void
  initialAddress?: string
}

interface SelectedLocation {
  address: string
  latitude: number
  longitude: number
  confidence?: number
  quality?: 'high' | 'medium' | 'low'
}

export const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialAddress = ''
}) => {
  const { t } = useI18n()
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLocationChange = useCallback((location: SelectedLocation) => {
    setSelectedLocation(location)
    setError('')
  }, [])

  const handleSearchLocationSelect = useCallback((location: SelectedLocation) => {
    setSelectedLocation(location)
    setError('')
  }, [])

  const handleConfirm = async () => {
    if (!selectedLocation) {
      setError(t('map.pleaseSelectLocation'))
      return
    }

    setIsLoading(true)
    try {
      // Final validation and processing
      const finalLocation = {
        address: selectedLocation.address,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      }

      onLocationSelect(finalLocation)
      onClose()
    } catch (error) {
      console.error('Error confirming location:', error)
      setError(t('map.locationSelectError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedLocation(null)
    setError('')
    onClose()
  }

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          handleLocationChange({
            address: t('map.currentLocation'),
            latitude,
            longitude,
            confidence: 0.9,
            quality: 'high'
          })
          setIsLoading(false)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setError(t('map.geolocationError'))
          setIsLoading(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    } else {
      setError(t('map.geolocationNotSupported'))
    }
  }

  const getQualityBadge = (quality?: 'high' | 'medium' | 'low') => {
    if (!quality) return null

    const variants = {
      high: { variant: 'success' as const, label: '高精度' },
      medium: { variant: 'warning' as const, label: '中精度' },
      low: { variant: 'error' as const, label: '低精度' }
    }

    const config = variants[quality]
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>
  }

  const getQualityMessage = (quality?: 'high' | 'medium' | 'low') => {
    switch (quality) {
      case 'high':
        return '正確な住所が取得されました'
      case 'medium':
        return 'おおよその住所です。必要に応じて手動で調整してください'
      case 'low':
        return '住所の取得に問題があります。検索バーで住所を入力することをお勧めします'
      default:
        return ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-spotify-gray-900 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-spotify-xl border border-spotify-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-spotify-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-spotify-green-500 bg-opacity-20 rounded-xl flex-center">
              <MapPin className="h-5 w-5 text-spotify-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('map.selectLocation')}</h2>
              <p className="text-spotify-gray-400 text-sm">{t('map.selectLocationDescription')}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-spotify-gray-700 text-spotify-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search Bar and Controls */}
        <div className="p-6 border-b border-spotify-gray-700 space-y-4">
          <AddressSearchBar
            onLocationSelect={handleSearchLocationSelect}
            placeholder={t('map.searchPlaceholder')}
            initialValue={initialAddress}
          />
          
          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCurrentLocation}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-spotify-gray-800 hover:bg-spotify-gray-700 text-spotify-gray-300 hover:text-white rounded-lg transition-colors border border-spotify-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="spinner w-4 h-4"></div>
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                <span className="text-sm">{t('map.useCurrentLocation')}</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-2 text-spotify-gray-500 text-xs">
              <Zap className="h-3 w-3" />
              <span>住所を検索するか、地図上をクリックしてください</span>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative min-h-0">
          <MapboxMap
            onLocationChange={handleLocationChange}
            selectedLocation={selectedLocation}
            className="w-full h-full"
          />
        </div>

        {/* Selected Location Info */}
        {selectedLocation && (
          <div className="p-6 border-t border-spotify-gray-700">
            <Card className="bg-spotify-gray-800 border-spotify-gray-600">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="w-8 h-8 bg-spotify-green-500 bg-opacity-20 rounded-lg flex-center flex-shrink-0 mt-1">
                      <MapPin className="h-4 w-4 text-spotify-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-white font-medium">{t('map.selectedLocation')}</h3>
                        {getQualityBadge(selectedLocation.quality)}
                      </div>
                      <p className="text-spotify-gray-300 text-sm leading-relaxed">
                        {selectedLocation.address}
                      </p>
                      <p className="text-spotify-gray-500 text-xs mt-1">
                        {t('map.coordinates')}: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quality Information */}
                {selectedLocation.quality && selectedLocation.quality !== 'high' && (
                  <div className="flex items-start space-x-2 p-3 bg-spotify-gray-700 bg-opacity-50 rounded-lg">
                    <Info className="h-4 w-4 text-spotify-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-spotify-gray-300 text-sm">
                        {getQualityMessage(selectedLocation.quality)}
                      </p>
                      {selectedLocation.confidence && (
                        <p className="text-spotify-gray-500 text-xs mt-1">
                          信頼度: {Math.round(selectedLocation.confidence * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="px-6 pb-2">
            <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-spotify-gray-700">
          <div className="text-spotify-gray-500 text-sm">
            {t('map.dragPinToAdjust')}
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={handleClose}
              variant="secondary"
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              variant="primary"
              disabled={!selectedLocation || isLoading}
              loading={isLoading}
              icon={Check}
            >
              {t('map.selectThisLocation')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}