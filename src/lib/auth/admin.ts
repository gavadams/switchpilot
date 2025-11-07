// Admin authentication utilities
import { createServerSupabaseClient } from '../supabase/server'

/**
 * Check if the current user is an admin
 * Checks both admin_users table AND profiles.is_admin/role
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

    // Check profiles table for is_admin flag or admin role
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, role')
        .eq('id', user.id)
        .single()

      if (!profileError && profile) {
        if (profile.is_admin === true || profile.role === 'admin') {
          console.log('User is admin (via profiles):', user.id)
          return true
        }
      }
    } catch (error) {
      console.log('Error checking profile admin status:', error)
    }

    // Also check admin_users table (for backward compatibility)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: adminUser, error: adminError } = await (supabase as any)
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!adminError && adminUser) {
        console.log('User is admin (via admin_users):', user.id)
        return true
      }
    } catch (error) {
      console.log('Error checking admin_users table:', error)
    }

    return false
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
 * Check admin authentication and return user object if authorized
 * @returns Promise with authorized user object or null
 */
export async function checkAdminAuth() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { authorized: false, user: null }
    }

    // Check profiles table for is_admin flag or admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, role, email, full_name')
      .eq('id', user.id)
      .single()

    if (!profileError && profile) {
      const isAdmin = profile.is_admin === true || profile.role === 'admin'
      if (isAdmin) {
        return {
          authorized: true,
          user: { ...user, ...profile }
        }
      }
    }

    // Also check admin_users table
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: adminUser, error: adminError } = await (supabase as any)
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!adminError && adminUser) {
        return {
          authorized: true,
          user: { ...user, ...profile }
        }
      }
    } catch (error) {
      // Ignore admin_users check errors
    }

    return { authorized: false, user: null }
  } catch (error) {
    console.error('Error in checkAdminAuth:', error)
    return { authorized: false, user: null }
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

