import { createServerSupabaseClient } from '../supabase/server'
import { Conflict } from '@/types/scraping'

export class ConflictResolver {
  private async getSupabase() {
    return await createServerSupabaseClient()
  }

  /**
   * When multiple sources have same bank deal with different data,
   * resolve conflicts based on priority
   */
  public async resolveConflicts(): Promise<Conflict[]> {
    const supabase = await this.getSupabase()

    // Find deals with same bank_name from multiple sources
    const { data: deals } = await supabase
      .from('bank_deals')
      .select('*')
      .not('source_name', 'is', null)
      .order('source_priority', { ascending: false })

    if (!deals || deals.length === 0) {
      return []
    }

    // Group deals by bank name (case-insensitive)
    const dealsByBank = new Map<string, typeof deals>()
    deals.forEach(deal => {
      const key = deal.bank_name.toLowerCase()
      if (!dealsByBank.has(key)) {
        dealsByBank.set(key, [])
      }
      dealsByBank.get(key)!.push(deal)
    })

    const conflicts: Conflict[] = []

    // Find conflicts (same bank from different sources with different data)
    for (const [bankName, bankDeals] of dealsByBank.entries()) {
      if (bankDeals.length < 2) {
        continue // Only one source, no conflict
      }

      // Sort by priority (highest first)
      bankDeals.sort((a, b) => (b.source_priority || 0) - (a.source_priority || 0))

      // Check if there are actual differences
      const highestPriority = bankDeals[0]
      const conflictingDeals = bankDeals.filter(
        deal =>
          deal.source_name !== highestPriority.source_name &&
          (deal.reward_amount !== highestPriority.reward_amount ||
            deal.required_direct_debits !== highestPriority.required_direct_debits ||
            deal.min_pay_in !== highestPriority.min_pay_in)
      )

      if (conflictingDeals.length > 0) {
        // Create conflict record
        const conflict: Conflict = {
          id: `${highestPriority.id}-${conflictingDeals[0].id}`,
          bankName: highestPriority.bank_name,
          dealId: highestPriority.id,
          sourceA: {
            sourceId: highestPriority.source_name || 'unknown',
            sourceName: highestPriority.source_name || 'Unknown',
            priority: highestPriority.source_priority || 0,
            data: {
              rewardAmount: highestPriority.reward_amount,
              requiredDirectDebits: highestPriority.required_direct_debits,
              minPayIn: highestPriority.min_pay_in,
              expiryDate: highestPriority.expiry_date
            }
          },
          sourceB: {
            sourceId: conflictingDeals[0].source_name || 'unknown',
            sourceName: conflictingDeals[0].source_name || 'Unknown',
            priority: conflictingDeals[0].source_priority || 0,
            data: {
              rewardAmount: conflictingDeals[0].reward_amount,
              requiredDirectDebits: conflictingDeals[0].required_direct_debits,
              minPayIn: conflictingDeals[0].min_pay_in,
              expiryDate: conflictingDeals[0].expiry_date
            }
          },
          resolved: false,
          resolvedBy: null,
          resolvedAt: null,
          resolution: null,
          createdAt: new Date().toISOString()
        }

        conflicts.push(conflict)

        // Auto-resolve: update lower priority deal to match highest priority
        // (Or keep highest priority and mark others as reviewed)
        if (highestPriority.source_priority! > conflictingDeals[0].source_priority!) {
          // Highest priority wins - update conflicting deal
          await supabase
            .from('bank_deals')
            .update({
              reward_amount: highestPriority.reward_amount,
              required_direct_debits: highestPriority.required_direct_debits,
              min_pay_in: highestPriority.min_pay_in,
              expiry_date: highestPriority.expiry_date,
              source_name: highestPriority.source_name,
              source_priority: highestPriority.source_priority,
              updated_at: new Date().toISOString()
            })
            .eq('id', conflictingDeals[0].id)

          conflict.resolved = true
          conflict.resolution = 'sourceA'
          conflict.resolvedAt = new Date().toISOString()
        }
      }
    }

    return conflicts
  }

  /**
   * Create conflict report for admin
   */
  public async generateConflictReport(): Promise<{
    unresolved: Conflict[]
    resolved: Conflict[]
    summary: {
      total: number
      unresolved: number
      resolved: number
    }
  }> {
    const conflicts = await this.resolveConflicts()

    const unresolved = conflicts.filter(c => !c.resolved)
    const resolved = conflicts.filter(c => c.resolved)

    return {
      unresolved,
      resolved,
      summary: {
        total: conflicts.length,
        unresolved: unresolved.length,
        resolved: resolved.length
      }
    }
  }

  /**
   * Manually resolve a conflict
   */
  public async manualResolve(
    conflictId: string,
    resolution: 'sourceA' | 'sourceB',
    resolvedBy: string
  ): Promise<void> {
    const supabase = await this.getSupabase()
    
    // Parse conflict ID (format: "dealIdA-dealIdB")
    const [dealIdA, dealIdB] = conflictId.split('-')
    if (!dealIdA || !dealIdB) {
      throw new Error('Invalid conflict ID format')
    }

    // Get both deals
    const { data: deals, error } = await supabase
      .from('bank_deals')
      .select('*')
      .in('id', [dealIdA, dealIdB])

    if (error || !deals || deals.length !== 2) {
      throw new Error('Failed to find conflicting deals')
    }

    const dealA = deals.find(d => d.id === dealIdA)
    const dealB = deals.find(d => d.id === dealIdB)

    if (!dealA || !dealB) {
      throw new Error('One or both deals not found')
    }

    // Determine which deal to use as the source of truth
    const sourceDeal = resolution === 'sourceA' ? dealA : dealB
    const targetDeal = resolution === 'sourceB' ? dealA : dealB

    // Update target deal to match source deal
    await supabase
      .from('bank_deals')
      .update({
        reward_amount: sourceDeal.reward_amount,
        required_direct_debits: sourceDeal.required_direct_debits,
        min_pay_in: sourceDeal.min_pay_in,
        expiry_date: sourceDeal.expiry_date,
        source_name: sourceDeal.source_name,
        source_priority: sourceDeal.source_priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetDeal.id)
  }
}

