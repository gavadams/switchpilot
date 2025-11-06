import { FlexibleScraper } from './flexible-scraper'
import { createServerSupabaseClient } from '../supabase/server'
import { ScrapedDeal, ScraperConfig, ScrapingSource, SyncResult } from '@/types/scraping'

// Multi-source deal scraping service
export class MultiSourceSyncService {
  private async getSupabase() {
    return await createServerSupabaseClient()
  }

  public async syncAllSources(): Promise<SyncResult[]> {
    const supabase = await this.getSupabase()

    // Get all active sources
    const { data: sources, error } = await supabase
      .from('scraping_sources')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (error || !sources || sources.length === 0) {
      throw new Error('No active scraping sources found')
    }

    const results: SyncResult[] = []

    // Scrape each source
    for (const source of sources) {
      const result = await this.syncSource(source as ScrapingSource)
      results.push(result)

      // Update source last scraped info
      await this.updateSourceLastScrape(source.id, result)

      // Wait between sources to be respectful
      await this.delay(2000)
    }

    // After all sources scraped, handle conflicts and deduplication
    await this.handleConflicts(sources as ScrapingSource[])

    return results
  }

  public async syncSource(source: ScrapingSource): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      sourceId: source.id,
      sourceName: source.name,
      dealsFound: 0,
      dealsAdded: 0,
      dealsUpdated: 0,
      dealsDeactivated: 0,
      errors: [],
      duration: 0
    }

    try {
      // Create scraper with source config
      const scraper = new FlexibleScraper(source.url, source.scraper_config)

      // Scrape deals
      const { deals, success, error } = await scraper.scrapeDeals()

      if (!success) {
        result.errors.push(error || 'Scraping failed')
        result.duration = Date.now() - startTime
        return result
      }

      result.dealsFound = deals.length

      // Process each deal
      for (const scrapedDeal of deals) {
        try {
          const processed = await this.processScrapedDeal(scrapedDeal, source)
          if (processed.added) {
            result.dealsAdded++
          } else if (processed.updated) {
            result.dealsUpdated++
          }
        } catch (error) {
          result.errors.push(`Error processing ${scrapedDeal.bankName}: ${(error as Error).message}`)
        }
      }
    } catch (error) {
      result.errors.push((error as Error).message)
    }

    result.duration = Date.now() - startTime
    return result
  }

  private async processScrapedDeal(
    deal: ScrapedDeal,
    source: ScrapingSource
  ): Promise<{ added: boolean; updated: boolean }> {
    const supabase = await this.getSupabase()

    // Check if deal exists (match by bank name, case-insensitive)
    const { data: existingDeals } = await supabase
      .from('bank_deals')
      .select('*')
      .ilike('bank_name', deal.bankName)

    const existingDeal = existingDeals?.[0]

    if (existingDeal) {
      // Update existing deal
      // Only update if this source has higher priority OR deal changed significantly
      const shouldUpdate =
        source.priority >= (existingDeal.source_priority || 0) &&
        (existingDeal.reward_amount !== deal.rewardAmount ||
          existingDeal.required_direct_debits !== deal.requirements.directDebitsRequired)

      if (shouldUpdate) {
        await supabase
          .from('bank_deals')
          .update({
            reward_amount: deal.rewardAmount,
            required_direct_debits: deal.requirements.directDebitsRequired,
            min_pay_in: deal.requirements.minPayIn,
            debit_card_transactions: deal.requirements.debitCardTransactions,
            expiry_date: deal.expiryDate?.toISOString().split('T')[0] || null,
            time_to_payout: deal.timeToPayout,
            source_name: source.name,
            source_priority: source.priority,
            source_url: deal.sourceUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDeal.id)

        return { added: false, updated: true }
      }

      return { added: false, updated: false }
    } else {
      // Add new deal
      await supabase.from('bank_deals').insert({
        bank_name: deal.bankName,
        reward_amount: deal.rewardAmount,
        required_direct_debits: deal.requirements.directDebitsRequired,
        min_pay_in: deal.requirements.minPayIn,
        debit_card_transactions: deal.requirements.debitCardTransactions,
        expiry_date: deal.expiryDate?.toISOString().split('T')[0] || null,
        time_to_payout: deal.timeToPayout,
        is_active: true,
        source_name: source.name,
        source_priority: source.priority,
        source_url: deal.sourceUrl,
        requirements: deal.requirements
      })

      return { added: true, updated: false }
    }
  }

  private async handleConflicts(sources: ScrapingSource[]) {
    // If multiple sources have same bank, trust highest priority
    // This is handled during sync by priority comparison
    // Future: Could log conflicts for admin review
    const supabase = await this.getSupabase()

    // Mark deals not found in ANY active source as inactive
    // This runs after all sources are scraped
    // Note: This is a simple implementation - might want more sophisticated logic
  }

  private async updateSourceLastScrape(sourceId: string, result: SyncResult) {
    const supabase = await this.getSupabase()

    await supabase
      .from('scraping_sources')
      .update({
        last_scraped_at: new Date().toISOString(),
        last_scrape_status:
          result.errors.length === 0 ? 'success' : result.dealsFound > 0 ? 'partial' : 'failed',
        last_scrape_deals_found: result.dealsFound
      })
      .eq('id', sourceId)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

