import { NextRequest, NextResponse } from 'next/server'
import { MultiSourceSyncService } from '@/lib/scraping/multi-source-sync'
import { HealthMonitor } from '@/lib/scraping/health-monitor'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Run multi-source scraping
    const syncService = new MultiSourceSyncService()
    const results = await syncService.syncAllSources()

    // Check health after scraping
    const healthMonitor = new HealthMonitor()
    const overallHealth = await healthMonitor.getOverallHealth()

    // Send alerts if any source failed repeatedly
    for (const result of results) {
      if (result.errors.length > 0) {
        await healthMonitor.sendHealthAlert(result.sourceId, result.errors[0])
      }
    }

    return NextResponse.json({
      success: true,
      results,
      scrapedSources: results.length,
      totalDealsFound: results.reduce((sum, r) => sum + r.dealsFound, 0),
      health: overallHealth
    })
  } catch (error) {
    console.error('Cron scraping error:', error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

