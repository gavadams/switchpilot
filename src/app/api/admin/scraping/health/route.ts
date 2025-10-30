import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { HealthMonitor } from '@/lib/scraping/health-monitor'

export const dynamic = 'force-dynamic'

// GET - Overall health or specific source health
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const sourceId = searchParams.get('sourceId')

    const healthMonitor = new HealthMonitor()

    if (sourceId) {
      // Get specific source health
      const health = await healthMonitor.checkSourceHealth(sourceId)
      return NextResponse.json({ health })
    } else {
      // Get overall health
      const overallHealth = await healthMonitor.getOverallHealth()
      return NextResponse.json(overallHealth)
    }
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Unknown error occurred' },
      { status: 500 }
    )
  }
}

