import { createServerSupabaseClient } from '../supabase/server'

/**
 * Check if the current user is an admin
 * @returns Promise<boolean> - true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError) {
      // If column doesn't exist yet, return false
      console.warn('Admin check failed:', profileError.message)
      return false
    }

    if (!profile) {
      return false
    }

    return profile.is_admin === true
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Require admin authentication - throws error if user is not admin
 * Use this in API routes to protect admin endpoints
 * @throws Error if user is not authenticated or not an admin
 */
export async function requireAdmin(): Promise<void> {
  const adminStatus = await isAdmin()
  
  if (!adminStatus) {
    throw new Error('Unauthorized: Admin access required')
  }
}

/**
 * Get the current authenticated user's profile including admin status
 * @returns Promise with user profile or null
 */
export async function getCurrentUserProfile() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return null
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      return null
    }
    
    return profile
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

