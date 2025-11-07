import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/admin/audit-logger'

export const dynamic = 'force-dynamic'

// GET - List audit logs with filters
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()

    const { searchParams } = new URL(req.url)
    const adminId = searchParams.get('adminId') || undefined
    const actionType = searchParams.get('actionType') || undefined
    const targetUser = searchParams.get('targetUser') || undefined
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('admin_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (adminId) {
      query = query.eq('admin_id', adminId)
    }

    if (actionType) {
      query = query.eq('action_type', actionType)
    }

    if (targetUser) {
      query = query.ilike('target_email', `%${targetUser}%`)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    await logAdminAction({
      actionType: 'audit_log_view',
      targetType: 'audit_log',
      actionDetails: { filters: { adminId, actionType, targetUser, dateFrom, dateTo }, count: count || 0 }
    }, req)

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}

// POST - Export audit logs to CSV
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()

    const body = await req.json()
    const { filters } = body

    let query = supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10000) // Max export limit

    if (filters?.adminId) {
      query = query.eq('admin_id', filters.adminId)
    }

    if (filters?.actionType) {
      query = query.eq('action_type', filters.actionType)
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    // Generate CSV
    const csvHeader = 'Timestamp,Admin Email,Action Type,Target Type,Target Email,Result,IP Address\n'
    const csvRows = (data || []).map(log => 
      `${log.created_at},${log.admin_email || ''},${log.action_type},${log.target_type || ''},${log.target_email || ''},${log.result},${log.ip_address || ''}`
    ).join('\n')
    const csv = csvHeader + csvRows

    await logAdminAction({
      actionType: 'audit_log_export',
      targetType: 'audit_log',
      actionDetails: { filters, count: data?.length || 0 }
    }, req)

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-log-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting audit logs:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export audit logs' },
      { status: 500 }
    )
  }
}

