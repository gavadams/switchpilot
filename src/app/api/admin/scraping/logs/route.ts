// API route for scraping logs
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../lib/auth/admin'
import { createServerSupabaseClient } from '../../../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Scraping logs with filters
export async function GET(request: NextRequest) {
  try {
    try {
      await requireAdmin()
    } catch (authError) {
      console.error('Admin auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sourceId = searchParams.get('sourceId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const supabase = await createServerSupabaseClient()
    let query = supabase.from('scraping_logs').select('*', { count: 'exact' })

    // Apply filters
    if (sourceId && sourceId !== 'all') {
      query = query.eq('source_id', sourceId)
    }
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.order('created_at', { ascending: false }).range(from, to)

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Error fetching scraping logs:', error)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Scraping logs error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Unknown error occurred' },
      { status: 500 }
    )
  }
}

