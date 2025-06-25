import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { record } = await req.json()
    
    if (!record || !record.review_id || !record.user_id) {
      throw new Error("Invalid like record")
    }

    // Get review details and review author
    const { data: review, error: reviewError } = await supabaseClient
      .from('reviews')
      .select(`
        id,
        address_text,
        user_id,
        users!reviews_user_id_fkey(nickname)
      `)
      .eq('id', record.review_id)
      .single()

    if (reviewError || !review) {
      throw new Error("Review not found")
    }

    // Don't send notification if user liked their own review
    if (review.user_id === record.user_id) {
      return new Response(
        JSON.stringify({ success: true, message: "Self-like, no notification sent" }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Get liker's nickname
    const { data: liker, error: likerError } = await supabaseClient
      .from('users')
      .select('nickname')
      .eq('id', record.user_id)
      .single()

    if (likerError || !liker) {
      throw new Error("Liker not found")
    }

    // Get review author's push tokens
    const { data: devices, error: devicesError } = await supabaseClient
      .from('user_devices')
      .select('push_token')
      .eq('user_id', review.user_id)
      .eq('active', true)

    if (devicesError) {
      throw new Error("Failed to get user devices")
    }

    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active devices found" }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const pushTokens = devices.map(device => device.push_token)

    // Send push notification
    const notificationResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: pushTokens,
        title: '新しいいいね！',
        body: `${liker.nickname}さんがあなたのレビュー「${review.address_text}」にいいねしました`,
        data: {
          type: 'like',
          reviewId: review.id,
          userId: record.user_id
        }
      })
    })

    const notificationResult = await notificationResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        notification: notificationResult,
        tokensCount: pushTokens.length
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  } catch (error) {
    console.error('Like notification error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
})