import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { getRevenueOverTime, getRevenueMetrics } from '@/lib/supabase/admin-data'
import { logAdminAction } from '@/lib/admin/audit-logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'csv'
    const months = parseInt(searchParams.get('months') || '12')

    const data = await getRevenueOverTime(months)
    const metrics = await getRevenueMetrics()

    await logAdminAction({
      actionType: 'revenue_export',
      targetType: 'revenue',
      actionDetails: { format, months }
    }, req)

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Month,Direct Debits Revenue,Affiliate Revenue,Total Revenue\n'
      const csvRows = data.map(d => 
        `${d.month},${d.ddRevenue},${d.affiliateRevenue},${d.total}`
      ).join('\n')
      const csv = csvHeader + csvRows

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="revenue-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({ data, metrics })
  } catch (error) {
    console.error('Error exporting revenue:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export revenue' },
      { status: 500 }
    )
  }
}

