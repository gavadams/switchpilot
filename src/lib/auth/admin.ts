// Admin authentication utilities
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
      console.log('No authenticated user:', authError?.message)
      return false
    }

    // Check if user has admin role by checking admin_users table
    try {
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (adminError || !adminUser) {
        console.log('User is not admin:', adminError?.message)
        return false
      }

      console.log('User is admin:', user.id)
      return true
    } catch (error) {
      console.log('Error checking admin status:', error)
      return false
    }
  } catch (error) {
    console.log('Error in isAdmin:', error)
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

