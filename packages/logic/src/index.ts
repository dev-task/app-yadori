// Export all shared logic
export * from './supabase'
export * from './auth'
export * from './api'
export * from './types'
export * from './utils/geocoding'
export * from './i18n'
export * from './hooks/useAuth'
export * from './hooks/useI18n'
export * from './hooks/useRealtime'

// Export specific functions that are commonly used
export { 
  getReviews, 
  getReview, 
  createReview, 
  updateReview,
  getUserProfile,
  updateUserProfile,
  createUserProfile
} from './api'