import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

interface PushNotificationPayload {
  to: string[]
  title: string
  body: string
  data?: Record<string, any>
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
    const { to, title, body, data }: PushNotificationPayload = await req.json()

    if (!to || !Array.isArray(to) || to.length === 0) {
      throw new Error("Push tokens array is required")
    }

    if (!title || !body) {
      throw new Error("Title and body are required")
    }

    // Prepare messages for Expo Push API
    const messages = to.map(pushToken => ({
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
    }))

    // Send to Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    if (!response.ok) {
      throw new Error(`Expo Push API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        messagesSent: messages.length
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  } catch (error) {
    console.error('Push notification error:', error)
    
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