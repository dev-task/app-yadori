import React, { useState, useEffect } from 'react'
import { MessageCircle, Send, User, MoreVertical, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { supabase } from '../lib/supabase'
import { Database } from '../lib/database.types'

type Comment = Database['public']['Tables']['comments']['Row'] & {
  users: {
    nickname: string
  }
}

interface CommentSectionProps {
  reviewId: number
  initialComments?: Comment[]
  onCommentCountChange?: (count: number) => void
}

export const CommentSection: React.FC<CommentSectionProps> = ({ 
  reviewId, 
  initialComments = [],
  onCommentCountChange 
}) => {
  const { user } = useAuth()
  const { t } = useI18n()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [showDropdown, setShowDropdown] = useState<number | null>(null)

  useEffect(() => {
    setComments(initialComments)
  }, [initialComments])

  useEffect(() => {
    onCommentCountChange?.(comments.length)
  }, [comments.length, onCommentCountChange])

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          users!inner(nickname)
        `)
        .eq('review_id', reviewId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          review_id: reviewId,
          user_id: user.id,
          body: newComment.trim()
        })
        .select(`
          *,
          users!inner(nickname)
        `)
        .single()

      if (error) throw error

      setComments(prev => [...prev, data])
      setNewComment('')
    } catch (error: any) {
      console.error('Error posting comment:', error)
      setError(t('errors.updateError'))
    } finally {
      setLoading(false)
    }
  }

  const handleEditComment = async (commentId: number) => {
    if (!editText.trim()) return

    try {
      const { error } = await supabase
        .from('comments')
        .update({ body: editText.trim() })
        .eq('id', commentId)

      if (error) throw error

      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, body: editText.trim() }
          : comment
      ))
      setEditingId(null)
      setEditText('')
      setShowDropdown(null)
    } catch (error) {
      console.error('Error editing comment:', error)
      setError(t('errors.updateError'))
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm(t('comments.deleteConfirm'))) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      setComments(prev => prev.filter(comment => comment.id !== commentId))
      setShowDropdown(null)
    } catch (error) {
      console.error('Error deleting comment:', error)
      setError(t('errors.deleteError'))
    }
  }

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditText(comment.body)
    setShowDropdown(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes < 1 ? t('comments.timeAgo.justNow') : `${diffInMinutes}${t('comments.timeAgo.minutesAgo')}`
    } else if (diffInHours < 24) {
      return `${diffInHours}${t('comments.timeAgo.hoursAgo')}`
    } else if (diffInHours < 24 * 7) {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}${t('comments.timeAgo.daysAgo')}`
    } else {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <MessageCircle className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t('comments.title')} ({comments.length})
        </h3>
      </div>

      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('comments.placeholder')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={loading}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {newComment.length}/500{t('comments.characterLimit')}
                </span>
                <button
                  type="submit"
                  disabled={loading || !newComment.trim() || newComment.length > 500}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('comments.posting')}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {t('comments.post')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">{t('comments.loginRequired')}</p>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>{t('comments.noComments')}</p>
            <p className="text-sm mt-1">{t('comments.noCommentsMessage')}</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3 group">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 text-sm">
                      {comment.users.nickname}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </p>
                  </div>
                  
                  {user && user.id === comment.user_id && (
                    <div className="relative">
                      <button
                        onClick={() => setShowDropdown(showDropdown === comment.id ? null : comment.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-100 transition-all duration-200"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </button>
                      
                      {showDropdown === comment.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                          <button
                            onClick={() => startEdit(comment)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Edit2 className="h-3 w-3 mr-2" />
                            {t('comments.edit')}
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            {t('comments.delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {editingId === comment.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditComment(comment.id)}
                        disabled={!editText.trim() || editText.length > 500}
                        className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {t('comments.save')}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 transition-colors"
                      >
                        {t('comments.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-800 text-sm leading-relaxed mt-1 whitespace-pre-wrap">
                    {comment.body}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Click outside handler */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(null)}
        />
      )}
    </div>
  )
}