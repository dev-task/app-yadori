import { supabase } from './supabase'
import type { Database } from './types'

type Review = Database['public']['Tables']['reviews']['Row']
type ReviewInsert = Database['public']['Tables']['reviews']['Insert']
type ReviewUpdate = Database['public']['Tables']['reviews']['Update']

export const reviewsApi = {
  async getReviews(options?: {
    limit?: number
    offset?: number
    search?: string
    sortBy?: 'newest' | 'oldest' | 'rating'
  }) {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        users!reviews_user_id_fkey(nickname),
        review_images(image_url)
      `)

    if (options?.search) {
      query = query.ilike('address_text', `%${options.search}%`)
    }

    switch (options?.sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getReviewById(id: number) {
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
  },

  async createReview(review: ReviewInsert) {
    const { data, error } = await supabase
      .from('reviews')
      .insert(review)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateReview(id: number, updates: ReviewUpdate) {
    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteReview(id: number) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export const likesApi = {
  async toggleLike(reviewId: number, userId: string) {
    // Check if like exists
    const { data: existingLike } = await supabase
      .from('likes')
      .select('*')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingLike) {
      // Remove like
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId)
      
      if (error) throw error
      return false
    } else {
      // Add like
      const { error } = await supabase
        .from('likes')
        .insert({ review_id: reviewId, user_id: userId })
      
      if (error) throw error
      return true
    }
  },

  async getLikeCount(reviewId: number) {
    const { count, error } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('review_id', reviewId)

    if (error) throw error
    return count || 0
  },

  async isLikedByUser(reviewId: number, userId: string) {
    const { data, error } = await supabase
      .from('likes')
      .select('*')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return !!data
  }
}

export const commentsApi = {
  async getComments(reviewId: number) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        users!comments_user_id_fkey(nickname)
      `)
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  },

  async createComment(reviewId: number, userId: string, body: string) {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        review_id: reviewId,
        user_id: userId,
        body: body.trim()
      })
      .select(`
        *,
        users!comments_user_id_fkey(nickname)
      `)
      .single()

    if (error) throw error
    return data
  },

  async updateComment(commentId: number, body: string) {
    const { data, error } = await supabase
      .from('comments')
      .update({ body: body.trim() })
      .eq('id', commentId)
      .select(`
        *,
        users!comments_user_id_fkey(nickname)
      `)
      .single()

    if (error) throw error
    return data
  },

  async deleteComment(commentId: number) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error
  }
}