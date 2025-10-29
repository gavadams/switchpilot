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

    // Check if user has admin role by checking admin_users table
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: adminUser, error: adminError } = await (supabase as any)
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (adminError) {
        // If table doesn't exist or user is not admin, return false
        return false
      }

      return !!adminUser
    } catch (error) {
      // If table doesn't exist, fall back to false
      return false
    }
  } catch (error) {
    return false
  }
}

/**
 * Require admin authentication - throws error if user is not admin
 * Use this in API routes to protect admin endpoints
 * @throws Error if user is not authenticated or not an admin
 */
export async function requireAdmin(): Promise<void> {
  console.log('🔧 requireAdmin called')
  const adminStatus = await isAdmin()
  console.log('🔧 Admin status result:', adminStatus)

  if (!adminStatus) {
    throw new Error('Unauthorized: Admin access required')
  }
  console.log('🔧 Admin check passed successfully')
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

