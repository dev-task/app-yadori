import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables exist
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing'
  })
  throw new Error('Missing Supabase environment variables')
}

// Only check for placeholder values if they are the exact placeholder strings
const isPlaceholderUrl = supabaseUrl === 'your_supabase_project_url'
const isPlaceholderKey = supabaseAnonKey === 'your_supabase_anon_key'

if (isPlaceholderUrl || isPlaceholderKey) {
  console.error('Supabase environment variables contain placeholder values. Please update your .env file with actual values.')
  throw new Error('Supabase environment variables contain placeholder values. Please update your .env file.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)