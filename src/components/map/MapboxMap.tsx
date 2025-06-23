import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { reverseGeocode, handleGeocodingError, assessAddressQuality } from '../../utils/geocoding'
import { useI18n } from '../../contexts/I18nContext'

// Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''

interface MapboxMapProps {
  onLocationChange: (location: {
    address: string
    latitude: number
    longitude: number
    confidence?: number
    quality?: 'high' | 'medium' | 'low'
  }) => void
  selectedLocation?: {
    address: string
    latitude: number
    longitude: number
  } | null
  className?: string
}

export const MapboxMap: React.FC<MapboxMapProps> = ({
  onLocationChange,
  selectedLocation,
  className = ''
}) => {
  const { t } = useI18n()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapError, setMapError] = useState('')
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)
  const [lastGeocodedPosition, setLastGeocodedPosition] = useState<{lng: number, lat: number} | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Check if Mapbox token is available
    if (!mapboxgl.accessToken) {
      setMapError('Mapbox APIキーが設定されていません')
      return
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11', // Dark theme to match Spotify design
        center: [139.7671, 35.6812], // Tokyo Station coordinates
        zoom: 12,
        attributionControl: false
      })

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-left')

      // Create custom marker element with enhanced styling
      const markerElement = document.createElement('div')
      markerElement.className = 'custom-marker'
      markerElement.style.width = '32px'
      markerElement.style.height = '32px'
      markerElement.style.borderRadius = '50%'
      markerElement.style.backgroundColor = '#1db954'
      markerElement.style.border = '3px solid white'
      markerElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'
      markerElement.style.cursor = 'grab'
      markerElement.style.transition = 'transform 0.2s ease'
      markerElement.style.position = 'relative'
      markerElement.style.zIndex = '1000'

      // Add pulse animation
      const pulseElement = document.createElement('div')
      pulseElement.style.position = 'absolute'
      pulseElement.style.top = '-3px'
      pulseElement.style.left = '-3px'
      pulseElement.style.width = '38px'
      pulseElement.style.height = '38px'
      pulseElement.style.borderRadius = '50%'
      pulseElement.style.backgroundColor = '#1db954'
      pulseElement.style.opacity = '0.3'
      pulseElement.style.animation = 'pulse 2s infinite'
      pulseElement.style.pointerEvents = 'none'
      markerElement.appendChild(pulseElement)

      // Add CSS animation for pulse
      if (!document.getElementById('mapbox-marker-styles')) {
        const style = document.createElement('style')
        style.id = 'mapbox-marker-styles'
        style.textContent = `
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 0.3;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.1;
            }
            100% {
              transform: scale(1);
              opacity: 0.3;
            }
          }
          .custom-marker:hover {
            transform: scale(1.1) !important;
          }
          .custom-marker.dragging {
            transform: scale(1.2) !important;
            cursor: grabbing !important;
          }
        `
        document.head.appendChild(style)
      }

      marker.current = new mapboxgl.Marker({
        element: markerElement,
        draggable: true
      })
        .setLngLat([139.7671, 35.6812])
        .addTo(map.current)

      // Handle marker drag start
      marker.current.on('dragstart', () => {
        markerElement.classList.add('dragging')
        pulseElement.style.display = 'none' // Hide pulse during drag
      })

      // Handle marker drag end with debouncing
      let dragEndTimeout: NodeJS.Timeout
      marker.current.on('dragend', async () => {
        if (!marker.current) return
        
        markerElement.classList.remove('dragging')
        pulseElement.style.display = 'block' // Show pulse after drag
        
        // Debounce reverse geocoding calls
        clearTimeout(dragEndTimeout)
        dragEndTimeout = setTimeout(async () => {
          const lngLat = marker.current!.getLngLat()
          await performReverseGeocode(lngLat.lng, lngLat.lat, 'drag')
        }, 500)
      })

      // Handle map click with debouncing
      let clickTimeout: NodeJS.Timeout
      map.current.on('click', async (e) => {
        if (!marker.current) return
        
        const { lng, lat } = e.lngLat
        marker.current.setLngLat([lng, lat])
        
        // Debounce reverse geocoding calls
        clearTimeout(clickTimeout)
        clickTimeout = setTimeout(async () => {
          await performReverseGeocode(lng, lat, 'click')
        }, 300)
      })

      map.current.on('load', () => {
        setIsMapLoaded(true)
        // Initial reverse geocode for default location
        performReverseGeocode(139.7671, 35.6812, 'initial')
      })

      map.current.on('error', (e) => {
        console.error('Map error:', e)
        setMapError('地図の読み込みに失敗しました')
      })

    } catch (error) {
      console.error('Error initializing map:', error)
      setMapError('地図の初期化に失敗しました')
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update marker position when selectedLocation changes
  useEffect(() => {
    if (!map.current || !marker.current || !selectedLocation) return

    const { latitude, longitude } = selectedLocation
    marker.current.setLngLat([longitude, latitude])
    map.current.flyTo({
      center: [longitude, latitude],
      zoom: Math.max(map.current.getZoom(), 15),
      duration: 1000
    })

    // Update last geocoded position to prevent unnecessary API calls
    setLastGeocodedPosition({ lng: longitude, lat: latitude })
  }, [selectedLocation])

  // Enhanced reverse geocoding function with caching and error handling
  const performReverseGeocode = async (
    longitude: number, 
    latitude: number, 
    trigger: 'initial' | 'click' | 'drag'
  ) => {
    // Prevent unnecessary API calls for the same position
    if (lastGeocodedPosition && 
        Math.abs(lastGeocodedPosition.lng - longitude) < 0.0001 && 
        Math.abs(lastGeocodedPosition.lat - latitude) < 0.0001) {
      return
    }

    setIsReverseGeocoding(true)
    setLastGeocodedPosition({ lng: longitude, lat: latitude })
    
    try {
      // Use different precision based on trigger
      const precision = trigger === 'drag' ? 'medium' : 'high'
      
      const locationData = await reverseGeocode(longitude, latitude, {
        language: 'ja',
        types: ['address', 'poi', 'place'],
        country: 'JP',
        precision
      })
      
      // Assess address quality
      const { quality } = assessAddressQuality(locationData)
      
      onLocationChange({
        address: locationData.address,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        confidence: locationData.confidence,
        quality
      })
    } catch (error: any) {
      console.error('Reverse geocoding error:', error)
      const errorMessage = handleGeocodingError(error)
      
      // Fallback to coordinates with error indication
      onLocationChange({
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${errorMessage})`,
        latitude,
        longitude,
        confidence: 0.1,
        quality: 'low'
      })
    } finally {
      setIsReverseGeocoding(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapContainer}
        className="w-full h-full rounded-xl overflow-hidden"
        style={{ minHeight: '400px' }}
      />
      
      {/* Loading State */}
      {!isMapLoaded && !mapError && (
        <div className="absolute inset-0 bg-spotify-gray-800 rounded-xl flex-center">
          <div className="text-center space-y-4">
            <div className="spinner w-8 h-8 mx-auto"></div>
            <p className="text-spotify-gray-400 text-sm">地図を読み込み中...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {mapError && (
        <div className="absolute inset-0 bg-spotify-gray-800 rounded-xl flex-center">
          <div className="text-center space-y-4 p-6">
            <div className="w-16 h-16 bg-red-500 bg-opacity-20 rounded-full flex-center mx-auto">
              <span className="text-red-400 text-2xl">!</span>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">地図を表示できません</h3>
              <p className="text-spotify-gray-400 text-sm">
                {mapError}
                {!mapboxgl.accessToken && (
                  <>
                    <br />
                    環境変数 VITE_MAPBOX_ACCESS_TOKEN を設定してください。
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reverse Geocoding Loading Indicator */}
      {isReverseGeocoding && isMapLoaded && (
        <div className="absolute top-4 left-4 bg-spotify-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg px-3 py-2 border border-spotify-gray-600 flex items-center space-x-2">
          <div className="spinner w-4 h-4"></div>
          <span className="text-spotify-gray-300 text-xs">住所を取得中...</span>
        </div>
      )}

      {/* Map Instructions Overlay */}
      {isMapLoaded && !mapError && !isReverseGeocoding && (
        <div className="absolute bottom-4 left-4 bg-spotify-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg px-3 py-2 border border-spotify-gray-600">
          <p className="text-spotify-gray-300 text-xs">
            地図をクリックまたはピンをドラッグして位置を選択
          </p>
        </div>
      )}

      {/* Zoom Level Indicator */}
      {isMapLoaded && map.current && (
        <div className="absolute top-4 right-4 bg-spotify-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg px-2 py-1 border border-spotify-gray-600">
          <span className="text-spotify-gray-400 text-xs">
            ズーム: {Math.round(map.current.getZoom())}
          </span>
        </div>
      )}
    </div>
  )
}