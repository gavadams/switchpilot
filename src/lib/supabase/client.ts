import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../../types/supabase'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, environment variables might not be available
    // Return a dummy client that won't be used during static generation
    if (typeof window === 'undefined') {
      // Server-side during build - return a mock client
      return createBrowserClient<Database>(
        'https://placeholder.supabase.co',
        'placeholder-anon-key'
      )
    }
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
