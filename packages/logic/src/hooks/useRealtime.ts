import { useEffect, useRef } from 'react'
import { supabase } from '../supabase'

export interface RealtimeSubscriptionConfig {
  table: string
  filter?: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
  onChange?: (payload: any) => void
}

export const useRealtime = (configs: RealtimeSubscriptionConfig[]) => {
  const channelsRef = useRef<any[]>([])

  useEffect(() => {
    // Setup subscriptions
    configs.forEach((config, index) => {
      const channelName = `realtime_${config.table}_${index}`
      
      let channel = supabase.channel(channelName)

      const changeHandler = (payload: any) => {
        console.log(`Realtime change in ${config.table}:`, payload)
        
        switch (payload.eventType) {
          case 'INSERT':
            config.onInsert?.(payload)
            break
          case 'UPDATE':
            config.onUpdate?.(payload)
            break
          case 'DELETE':
            config.onDelete?.(payload)
            break
        }
        
        config.onChange?.(payload)
      }

      channel = channel.on(
        'postgres_changes',
        {
          event: config.event || '*',
          schema: 'public',
          table: config.table,
          ...(config.filter && { filter: config.filter })
        },
        changeHandler
      )

      channel.subscribe((status) => {
        console.log(`Subscription status for ${config.table}:`, status)
      })

      channelsRef.current.push(channel)
    })

    // Cleanup function
    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel)
      })
      channelsRef.current = []
    }
  }, [])

  return {
    cleanup: () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel)
      })
      channelsRef.current = []
    }
  }
}

// Specific hooks for common use cases
export const useLikesRealtime = (reviewId: number, onLikesChange: (count: number) => void) => {
  return useRealtime([
    {
      table: 'likes',
      filter: `review_id=eq.${reviewId}`,
      onChange: async () => {
        // Fetch updated like count
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('review_id', reviewId)
        
        onLikesChange(count || 0)
      }
    }
  ])
}

export const useCommentsRealtime = (reviewId: number, onCommentsChange: (comments: any[]) => void) => {
  return useRealtime([
    {
      table: 'comments',
      filter: `review_id=eq.${reviewId}`,
      onChange: async () => {
        // Fetch updated comments
        const { data } = await supabase
          .from('comments')
          .select(`
            *,
            users!comments_user_id_fkey(nickname)
          `)
          .eq('review_id', reviewId)
          .order('created_at', { ascending: true })
        
        onCommentsChange(data || [])
      }
    }
  ])
}