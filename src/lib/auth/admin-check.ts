// Client-side admin check utilities
// Note: For server-side checks, use src/lib/auth/admin.ts

'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

/**
 * Check if the current user is an admin (client-side)
 * @returns Promise<boolean> - true if user is admin, false otherwise
 */
export async function isAdminClient(): Promise<boolean> {
  try {
    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    // Check profiles table for is_admin flag or admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single()

    if (!profileError && profile) {
      if (profile.is_admin === true || profile.role === 'admin') {
        return true
      }
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
        return true
      }
    } catch (error) {
      // Ignore errors
    }

    return false
  } catch (error) {
    console.error('Error in isAdminClient:', error)
    return false
  }
}

/**
 * Hook to check admin status (for use in components)
 * Returns admin status and loading state
 */
export function useAdminStatus() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function checkAdmin() {
      const adminStatus = await isAdminClient()
      setIsAdmin(adminStatus)
      setLoading(false)
    }
    checkAdmin()
  }, [])

  return { isAdmin, loading }
}

