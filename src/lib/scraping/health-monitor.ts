import { createServerSupabaseClient } from '../supabase/server'
import { HealthStatus } from '@/types/scraping'

export class HealthMonitor {
  private async getSupabase() {
    return await createServerSupabaseClient()
  }

  public async checkSourceHealth(sourceId: string): Promise<HealthStatus> {
    const supabase = await this.getSupabase()

    // Get last 10 scrapes for source
    const { data: logs } = await supabase
      .from('scraping_logs')
      .select('*')
      .eq('source_id', sourceId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!logs || logs.length === 0) {
      // No scrapes yet - return neutral status
      return {
        sourceId,
        sourceName: 'Unknown',
        status: 'warning',
        successRate: 0,
        averageDealsFound: 0,
        lastSuccessAt: null,
        consecutiveFailures: 0,
        issues: ['No scraping history available']
      }
    }

    // Calculate success rate
    const successfulScrapes = logs.filter(
      log => log.status === 'success' || log.status === 'partial'
    )
    const successRate = (successfulScrapes.length / logs.length) * 100

    // Calculate average deals found
    const totalDeals = logs.reduce((sum, log) => sum + (log.deals_found || 0), 0)
    const averageDealsFound = totalDeals / logs.length

    // Find last success
    const lastSuccess = successfulScrapes[0]
    const lastSuccessAt = lastSuccess?.created_at || null

    // Count consecutive failures
    let consecutiveFailures = 0
    for (const log of logs) {
      if (log.status === 'failed') {
        consecutiveFailures++
      } else {
        break
      }
    }

    // Get source name
    const { data: source } = await supabase
      .from('scraping_sources')
      .select('name')
      .eq('id', sourceId)
      .single()

    const issues: string[] = []

    // Determine health status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'

    if (consecutiveFailures >= 3) {
      status = 'critical'
      issues.push(`Source has failed ${consecutiveFailures} consecutive times`)
    } else if (consecutiveFailures >= 2) {
      status = 'warning'
      issues.push(`Source has failed ${consecutiveFailures} consecutive times`)
    }

    if (successRate < 50) {
      status = status === 'critical' ? 'critical' : 'warning'
      issues.push(`Low success rate: ${successRate.toFixed(1)}%`)
    }

    // Check if deal count is dropping significantly (potential site structure change)
    if (logs.length >= 3) {
      const recentAvg = logs.slice(0, 3).reduce((sum, log) => sum + (log.deals_found || 0), 0) / 3
      const olderAvg =
        logs.slice(3, 6).reduce((sum, log) => sum + (log.deals_found || 0), 0) / Math.min(3, logs.length - 3)

      if (olderAvg > 0 && recentAvg < olderAvg * 0.5) {
        status = status === 'critical' ? 'critical' : 'warning'
        issues.push('Deal count dropped significantly - site structure may have changed')
      }
    }

    // Check if last scrape was more than 48 hours ago
    const lastScrape = logs[0]
    if (lastScrape) {
      const lastScrapeDate = new Date(lastScrape.created_at)
      const hoursSinceLastScrape = (Date.now() - lastScrapeDate.getTime()) / (1000 * 60 * 60)

      if (hoursSinceLastScrape > 48) {
        status = status === 'critical' ? 'critical' : 'warning'
        issues.push(`Last scrape was ${Math.floor(hoursSinceLastScrape)} hours ago`)
      }
    }

    return {
      sourceId,
      sourceName: source?.name || 'Unknown',
      status,
      successRate,
      averageDealsFound,
      lastSuccessAt,
      consecutiveFailures,
      issues
    }
  }

  public async getOverallHealth(): Promise<{
    overall: 'healthy' | 'warning' | 'critical'
    sources: HealthStatus[]
    issues: string[]
  }> {
    const supabase = await this.getSupabase()

    // Get all active sources
    const { data: sources } = await supabase
      .from('scraping_sources')
      .select('id')
      .eq('is_active', true)

    if (!sources || sources.length === 0) {
      return {
        overall: 'warning',
        sources: [],
        issues: ['No active scraping sources configured']
      }
    }

    // Check health of each source
    const healthStatuses: HealthStatus[] = []
    for (const source of sources) {
      const health = await this.checkSourceHealth(source.id)
      healthStatuses.push(health)
    }

    // Determine overall status
    const criticalCount = healthStatuses.filter(h => h.status === 'critical').length
    const warningCount = healthStatuses.filter(h => h.status === 'warning').length

    let overall: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (criticalCount > 0) {
      overall = 'critical'
    } else if (warningCount > 0) {
      overall = 'warning'
    }

    // Aggregate issues
    const issues: string[] = []
    healthStatuses.forEach(health => {
      if (health.issues.length > 0) {
        issues.push(`${health.sourceName}: ${health.issues.join(', ')}`)
      }
    })

    return {
      overall,
      sources: healthStatuses,
      issues
    }
  }

  public async sendHealthAlert(sourceId: string, issue: string) {
    // Send alert if source repeatedly fails
    // Email admin, dashboard notification, log alert
    // For now, just log to console - can be extended with email/notification service
    console.error(`Health Alert for source ${sourceId}: ${issue}`)

    // Future: Send email to admin
    // Future: Create notification in database
    // Future: Send to monitoring service (e.g., Sentry)
  }
}

