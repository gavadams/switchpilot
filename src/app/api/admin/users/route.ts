import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { getAllUsers, getUserStats } from '@/lib/supabase/admin-data'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - List all users with filters
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const filters = {
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') as 'all' | 'active' | 'suspended') || 'all',
      hasActiveSwitches: searchParams.get('hasActiveSwitches') === 'true' ? true : undefined,
      hasActiveDDs: searchParams.get('hasActiveDDs') === 'true' ? true : undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50')
    }

    const result = await getAllUsers(filters)

    await logAdminAction({
      actionType: 'users_list_view',
      targetType: 'users',
      actionDetails: { filters, count: result.total }
    }, req)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST - Create new user manually (for support)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()

    const body = await req.json()
    const { email, full_name, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create user')
    }

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: full_name || null,
        total_earnings: 0,
        is_admin: false,
        role: 'user',
        is_suspended: false
      })
      .select()
      .single()

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    await logAdminAction({
      actionType: 'user_create',
      targetType: 'user',
      targetId: profile.id,
      targetEmail: email,
      actionDetails: { email, full_name }
    }, req)

    return NextResponse.json({ user: profile })
  } catch (error) {
    console.error('Error creating user:', error)
    await logAdminAction({
      actionType: 'user_create',
      result: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Failed to create user'
    }, req)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    )
  }
}

