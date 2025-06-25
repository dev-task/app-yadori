import { supabase } from './supabase'
import type { Database } from './types'

type Review = Database['public']['Tables']['reviews']['Row']
type ReviewInsert = Database['public']['Tables']['reviews']['Insert']

export const getReviews = async (limit?: number) => {
  let query = supabase
    .from('reviews')
    .select(`
      *,
      users!reviews_user_id_fkey(nickname),
      review_images(image_url)
    `)
    .order('created_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getReview = async (id: number) => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      users!reviews_user_id_fkey(nickname),
      review_images(id, image_url),
      comments(
        id,
        body,
        created_at,
        user_id,
        users!comments_user_id_fkey(nickname)
      )
    `)
    .eq('id', id)
    .order('created_at', { foreignTable: 'comments', ascending: true })
    .single()

  if (error) throw error
  return data
}

export const createReview = async (review: ReviewInsert) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateReview = async (id: number, updates: Partial<ReviewInsert>) => {
  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export const updateUserProfile = async (userId: string, updates: {
  nickname?: string
  bio?: string
}) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const createUserProfile = async (profile: {
  id: string
  email: string
  nickname: string
  bio?: string
}) => {
  const { data, error } = await supabase
    .from('users')
    .insert(profile)
    .select()
    .single()

  if (error) throw error
  return data
}