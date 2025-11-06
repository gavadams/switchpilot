import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../lib/auth/admin'
import { FlexibleScraper } from '../../../../../lib/scraping/flexible-scraper'
import { ScraperConfig } from '../../../../../types/scraping'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { url, scraper_config } = body

    if (!url || !scraper_config) {
      return NextResponse.json({ error: 'Missing required fields: url, scraper_config' }, { status: 400 })
    }

    // Validate scraper_config structure
    if (!scraper_config.selectors || !scraper_config.parsing || !scraper_config.options) {
      return NextResponse.json(
        { error: 'Invalid scraper_config: must include selectors, parsing, and options' },
        { status: 400 }
      )
    }

    // Create scraper and test
    const config: ScraperConfig = scraper_config
    const scraper = new FlexibleScraper(url, config)

    const startTime = Date.now()
    const result = await scraper.scrapeDeals()
    const duration = Date.now() - startTime

    if (!result.success) {
      return NextResponse.json({
        success: false,
        dealsFound: 0,
        deals: [],
        errors: [result.error || 'Scraping failed'],
        duration
      })
    }

    // Return first 3 deals as preview
    const previewDeals = result.deals.slice(0, 3)

    return NextResponse.json({
      success: true,
      dealsFound: result.deals.length,
      deals: previewDeals,
      errors: [],
      duration
    })
  } catch (error) {
    console.error('Test scrape config error:', error)
    return NextResponse.json(
      {
        success: false,
        dealsFound: 0,
        deals: [],
        errors: [(error as Error).message || 'Unknown error occurred'],
        duration: 0
      },
      { status: 500 }
    )
  }
}

