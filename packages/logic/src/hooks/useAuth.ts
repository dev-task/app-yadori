import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import { signUp as authSignUp, signIn as authSignIn, signOut as authSignOut } from '../auth'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        session,
        user: session?.user ?? null,
        loading: false
      })
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthState({
        session,
        user: session?.user ?? null,
        loading: false
      })

      // Create user profile if signing up
      if (event === 'SIGNED_UP' && session?.user) {
        const { error } = await supabase
          .from('users')
          .insert([
            {
              id: session.user.id,
              email: session.user.email || '',
              nickname: session.user.user_metadata?.nickname || '',
            },
          ])
        
        if (error) {
          console.error('Error creating user profile:', error)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, nickname: string) => {
    setAuthState(prev => ({ ...prev, loading: true }))
    try {
      await authSignUp(email, password, nickname)
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
  }

  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true }))
    try {
      await authSignIn(email, password)
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
  }

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true }))
    try {
      await authSignOut()
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
  }

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
  }
}