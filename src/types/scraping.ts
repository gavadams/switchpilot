/**
 * Type definitions for the multi-source scraping system
 */

export interface ScraperConfig {
  selectors: {
    dealContainer: string
    bankName: string
    rewardAmount: string
    requirements: string
    expiryDate: string
  }
  parsing: {
    rewardAmountRegex: string
    directDebitsRegex: string
    payInRegex: string
    expiryDateFormat: string
  }
  options: {
    userAgent: string
    timeout: number
    retryAttempts: number
  }
}

export interface ScrapedDeal {
  bankName: string
  rewardAmount: number
  requirements: {
    directDebitsRequired: number
    minPayIn: number
    debitCardTransactions: number
    otherRequirements: string[]
  }
  expiryDate: Date | null
  timeToPayout: string
  sourceUrl: string
  rawData?: {
    rewardText?: string
    requirementsText?: string
    expiryText?: string
    [key: string]: unknown
  }
}

export interface ScrapingSource {
  id: string
  name: string
  url: string
  is_active: boolean
  priority: number
  scraper_config: ScraperConfig
  last_scraped_at: string | null
  last_scrape_status: string | null
  last_scrape_deals_found: number
  created_at: string
  updated_at: string
}

export interface SyncResult {
  sourceId: string
  sourceName: string
  dealsFound: number
  dealsAdded: number
  dealsUpdated: number
  dealsDeactivated: number
  errors: string[]
  duration: number
}

export interface ScrapingLog {
  id: string
  source_id: string | null
  source_name: string | null
  deals_found: number
  deals_added: number
  deals_updated: number
  deals_deactivated: number
  status: string | null
  error_message: string | null
  duration_seconds: number | null
  scrape_data: Record<string, unknown> | null
  created_at: string
}

export interface Conflict {
  id: string
  bankName: string
  dealId: string
  sourceA: {
    sourceId: string
    sourceName: string
    priority: number
    data: {
      rewardAmount: number
      requiredDirectDebits: number
      minPayIn: number
      expiryDate: string | null
    }
  }
  sourceB: {
    sourceId: string
    sourceName: string
    priority: number
    data: {
      rewardAmount: number
      requiredDirectDebits: number
      minPayIn: number
      expiryDate: string | null
    }
  }
  resolved: boolean
  resolvedBy: string | null
  resolvedAt: string | null
  resolution: 'sourceA' | 'sourceB' | 'manual' | null
  createdAt: string
}

export interface HealthStatus {
  sourceId: string
  sourceName: string
  status: 'healthy' | 'warning' | 'critical'
  successRate: number
  averageDealsFound: number
  lastSuccessAt: string | null
  consecutiveFailures: number
  issues: string[]
}

export interface ScrapeTestResult {
  success: boolean
  dealsFound: number
  deals: ScrapedDeal[]
  errors: string[]
  duration: number
}

