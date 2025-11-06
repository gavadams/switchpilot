import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../lib/auth/admin'
import { createServerSupabaseClient } from '../../../../../lib/supabase/server'
import { MultiSourceSyncService } from '../../../../../lib/scraping/multi-source-sync'
import { ScrapingSource } from '../../../../../types/scraping'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const supabase = await createServerSupabaseClient()

    // Check if specific source requested
    const { searchParams } = new URL(request.url)
    const sourceId = searchParams.get('sourceId')

    const startTime = Date.now()
    const syncService = new MultiSourceSyncService()

    let results

    if (sourceId) {
      // Scrape single source
      const { data: source, error: sourceError } = await supabase
        .from('scraping_sources')
        .select('*')
        .eq('id', sourceId)
        .single()

      if (sourceError || !source) {
        return NextResponse.json({ error: 'Source not found' }, { status: 404 })
      }

      const result = await syncService.syncSource(source as ScrapingSource)
      results = [result]
    } else {
      // Scrape all active sources
      results = await syncService.syncAllSources()
    }

    const duration = Math.floor((Date.now() - startTime) / 1000)

    // Log results for each source
    for (const result of results) {
      await supabase.from('scraping_logs').insert({
        source_id: result.sourceId,
        source_name: result.sourceName,
        deals_found: result.dealsFound,
        deals_added: result.dealsAdded,
        deals_updated: result.dealsUpdated,
        deals_deactivated: result.dealsDeactivated,
        status: result.errors.length === 0 ? 'success' : result.dealsFound > 0 ? 'partial' : 'failed',
        error_message: result.errors.join('; ') || null,
        duration_seconds: Math.floor(result.duration / 1000),
        scrape_data: result
      })
    }

    return NextResponse.json({
      success: true,
      results,
      totalDuration: duration
    })
  } catch (error) {
    console.error('Scraping error:', error)

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

