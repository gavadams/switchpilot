import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/admin/audit-logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()

    const activities: Array<{
      id: string
      type: 'user_registration' | 'switch_completed' | 'payment' | 'system_alert' | 'scraping' | 'affiliate'
      description: string
      timestamp: string
      metadata?: Record<string, unknown>
    }> = []

    // Get recent user registrations
    const { data: newUsers } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    newUsers?.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user_registration',
        description: `New user registered: ${user.email}`,
        timestamp: user.created_at
      })
    })

    // Get recent completed switches
    const { data: completedSwitches } = await supabase
      .from('user_switches')
      .select(`
        id,
        completed_at,
        bank_deals (bank_name)
      `)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5)

    completedSwitches?.forEach(switchItem => {
      const bankDeals = switchItem.bank_deals as { bank_name: string } | null | undefined
      activities.push({
        id: `switch-${switchItem.id}`,
        type: 'switch_completed',
        description: `Switch completed: ${bankDeals?.bank_name || 'Unknown bank'}`,
        timestamp: switchItem.completed_at!
      })
    })

    // Get recent scraping activity
    const { data: scrapingLogs } = await supabase
      .from('scraping_logs')
      .select('id, source_name, deals_found, created_at, status')
      .order('created_at', { ascending: false })
      .limit(5)

    scrapingLogs?.forEach(log => {
      activities.push({
        id: `scraping-${log.id}`,
        type: 'scraping',
        description: `Scraped ${log.source_name}: ${log.deals_found} deals found`,
        timestamp: log.created_at,
        metadata: { status: log.status }
      })
    })

    // Get recent affiliate clicks
    const { data: affiliateClicks } = await supabase
      .from('affiliate_clicks')
      .select('id, click_timestamp, status')
      .order('click_timestamp', { ascending: false })
      .limit(5)

    affiliateClicks?.forEach(click => {
      if (click.status === 'converted') {
        activities.push({
          id: `affiliate-${click.id}`,
          type: 'affiliate',
          description: 'Affiliate conversion completed',
          timestamp: click.click_timestamp
        })
      }
    })

    // Sort by timestamp (newest first) and limit to 20
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    await logAdminAction({
      actionType: 'dashboard_activities_view',
      targetType: 'dashboard',
      actionDetails: { count: activities.length }
    }, req)

    return NextResponse.json(activities.slice(0, 20))
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

