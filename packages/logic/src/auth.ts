import { supabase } from './supabase'

export const authService = {
  async signUp(email: string, password: string, nickname: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname,
        },
      },
    })
    if (error) throw error
  },

  async signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}