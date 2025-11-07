// Admin data fetching functions
import { createServerSupabaseClient } from './server'
import { Profile, UserSwitch, DirectDebit, AffiliateClick, BankDeal } from '@/types/database'

// User management functions
export interface UserFilters {
  search?: string
  status?: 'all' | 'active' | 'suspended'
  hasActiveSwitches?: boolean
  hasActiveDDs?: boolean
  dateFrom?: string
  dateTo?: string
  sortBy?: 'created_at' | 'total_earnings' | 'last_active' | 'switch_count'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  averageEarnings: number
  newUsersToday: number
  newUsersThisWeek: number
}

export async function getAllUsers(filters: UserFilters = {}) {
  const supabase = await createServerSupabaseClient()
  
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })

  // Apply filters
  if (filters.search) {
    query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`)
  }

  if (filters.status === 'suspended') {
    query = query.eq('is_suspended', true)
  } else if (filters.status === 'active') {
    query = query.eq('is_suspended', false)
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  // Sorting
  const sortBy = filters.sortBy || 'created_at'
  const sortOrder = filters.sortOrder || 'desc'
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Pagination
  const page = filters.page || 1
  const limit = filters.limit || 50
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  return {
    users: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

export async function getUserStats(): Promise<UserStats> {
  const supabase = await createServerSupabaseClient()
  
  const now = new Date()
  const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString()
  const weekStart = new Date(now.setDate(now.getDate() - 7)).toISOString()

  // Get all users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Get active users (not suspended)
  const { count: activeUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_suspended', false)

  // Get suspended users
  const { count: suspendedUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_suspended', true)

  // Get average earnings
  const { data: earningsData } = await supabase
    .from('profiles')
    .select('total_earnings')

  const averageEarnings = earningsData && earningsData.length > 0
    ? earningsData.reduce((sum, p) => sum + (p.total_earnings || 0), 0) / earningsData.length
    : 0

  // Get new users today
  const { count: newUsersToday } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart)

  // Get new users this week
  const { count: newUsersThisWeek } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekStart)

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    suspendedUsers: suspendedUsers || 0,
    averageEarnings: Math.round(averageEarnings * 100) / 100,
    newUsersToday: newUsersToday || 0,
    newUsersThisWeek: newUsersThisWeek || 0
  }
}

export async function getUserDetail(userId: string) {
  const supabase = await createServerSupabaseClient()

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    throw new Error('User not found')
  }

  // Get user switches
  const { data: switches } = await supabase
    .from('user_switches')
    .select(`
      *,
      bank_deals (
        bank_name,
        reward_amount,
        expiry_date,
        time_to_payout,
        required_direct_debits,
        affiliate_url
      )
    `)
    .eq('user_id', userId)
    .order('started_at', { ascending: false })

  // Get direct debits
  const { data: directDebits } = await supabase
    .from('direct_debits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Get affiliate clicks
  const { data: affiliateClicks } = await supabase
    .from('affiliate_clicks')
    .select('*')
    .eq('user_id', userId)
    .order('click_timestamp', { ascending: false })

  // Get payments
  const { data: payments } = await supabase
    .from('dd_payments')
    .select(`
      *,
      direct_debits (
        provider,
        amount
      )
    `)
    .in('direct_debit_id', directDebits?.map(dd => dd.id) || [])
    .order('payment_date', { ascending: false })

  return {
    profile,
    switches: switches || [],
    directDebits: directDebits || [],
    affiliateClicks: affiliateClicks || [],
    payments: payments || []
  }
}

// Revenue functions
export interface RevenueMetrics {
  totalRevenue: number
  monthlyRecurringRevenue: number
  thisMonthRevenue: number
  lastMonthRevenue: number
  averageRevenuePerUser: number
  ddRevenue: number
  affiliateRevenue: number
  ddRevenuePercentage: number
  affiliateRevenuePercentage: number
}

export async function getRevenueMetrics(dateRange?: { from: string; to: string }): Promise<RevenueMetrics> {
  const supabase = await createServerSupabaseClient()

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

  // Get DD revenue (from dd_payments)
  const { data: ddPayments } = await supabase
    .from('dd_payments')
    .select('amount, status, payment_date')
    .eq('status', 'succeeded')

  const totalDDRevenue = ddPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  const thisMonthDD = ddPayments?.filter(p => 
    p.payment_date >= thisMonthStart
  ).reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  const lastMonthDD = ddPayments?.filter(p => 
    p.payment_date >= lastMonthStart && p.payment_date <= lastMonthEnd
  ).reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  // Get affiliate revenue (from affiliate_clicks with status = 'converted')
  const { data: affiliateClicks } = await supabase
    .from('affiliate_clicks')
    .select('commission_earned, status, conversion_timestamp')
    .eq('status', 'converted')

  const totalAffiliateRevenue = affiliateClicks?.reduce((sum, c) => 
    sum + (c.commission_earned || 0), 0
  ) || 0

  const thisMonthAffiliate = affiliateClicks?.filter(c => 
    c.conversion_timestamp && c.conversion_timestamp >= thisMonthStart
  ).reduce((sum, c) => sum + (c.commission_earned || 0), 0) || 0

  const lastMonthAffiliate = affiliateClicks?.filter(c => 
    c.conversion_timestamp && 
    c.conversion_timestamp >= lastMonthStart && 
    c.conversion_timestamp <= lastMonthEnd
  ).reduce((sum, c) => sum + (c.commission_earned || 0), 0) || 0

  const totalRevenue = totalDDRevenue + totalAffiliateRevenue
  const thisMonthRevenue = thisMonthDD + thisMonthAffiliate
  const lastMonthRevenue = lastMonthDD + lastMonthAffiliate

  // Calculate MRR (active DD subscriptions * £1)
  const { data: activeDDs } = await supabase
    .from('direct_debits')
    .select('id')
    .eq('status', 'active')

  const monthlyRecurringRevenue = (activeDDs?.length || 0) * 1 // £1 per DD per month

  // Calculate ARPU
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const averageRevenuePerUser = totalUsers && totalUsers > 0
    ? totalRevenue / totalUsers
    : 0

  const ddRevenuePercentage = totalRevenue > 0
    ? (totalDDRevenue / totalRevenue) * 100
    : 0

  const affiliateRevenuePercentage = totalRevenue > 0
    ? (totalAffiliateRevenue / totalRevenue) * 100
    : 0

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue * 100) / 100,
    thisMonthRevenue: Math.round(thisMonthRevenue * 100) / 100,
    lastMonthRevenue: Math.round(lastMonthRevenue * 100) / 100,
    averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100,
    ddRevenue: Math.round(totalDDRevenue * 100) / 100,
    affiliateRevenue: Math.round(totalAffiliateRevenue * 100) / 100,
    ddRevenuePercentage: Math.round(ddRevenuePercentage * 100) / 100,
    affiliateRevenuePercentage: Math.round(affiliateRevenuePercentage * 100) / 100
  }
}

export async function getRevenueOverTime(months: number = 12) {
  const supabase = await createServerSupabaseClient()

  const now = new Date()
  const data: Array<{ month: string; ddRevenue: number; affiliateRevenue: number; total: number }> = []

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const monthLabel = monthStart.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })

    // Get DD revenue for this month
    const { data: ddPayments } = await supabase
      .from('dd_payments')
      .select('amount')
      .eq('status', 'succeeded')
      .gte('payment_date', monthStart.toISOString())
      .lte('payment_date', monthEnd.toISOString())

    const ddRevenue = ddPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    // Get affiliate revenue for this month
    const { data: affiliateClicks } = await supabase
      .from('affiliate_clicks')
      .select('commission_earned')
      .eq('status', 'converted')
      .gte('conversion_timestamp', monthStart.toISOString())
      .lte('conversion_timestamp', monthEnd.toISOString())

    const affiliateRevenue = affiliateClicks?.reduce((sum, c) => 
      sum + (c.commission_earned || 0), 0
    ) || 0

    data.push({
      month: monthLabel,
      ddRevenue: Math.round(ddRevenue * 100) / 100,
      affiliateRevenue: Math.round(affiliateRevenue * 100) / 100,
      total: Math.round((ddRevenue + affiliateRevenue) * 100) / 100
    })
  }

  return data
}

// Switches functions
export interface SwitchFilters {
  status?: 'all' | 'started' | 'in_progress' | 'completed' | 'failed' | 'stuck'
  bankName?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export async function getAllSwitches(filters: SwitchFilters = {}) {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('user_switches')
    .select(`
      *,
      bank_deals (
        bank_name,
        reward_amount
      ),
      profiles (
        email,
        full_name
      )
    `, { count: 'exact' })

  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'stuck') {
      // Stuck switches: no progress in 7+ days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      query = query.lt('started_at', sevenDaysAgo).neq('status', 'completed')
    } else {
      query = query.eq('status', filters.status)
    }
  }

  if (filters.bankName) {
    query = query.eq('bank_deals.bank_name', filters.bankName)
  }

  if (filters.dateFrom) {
    query = query.gte('started_at', filters.dateFrom)
  }

  if (filters.dateTo) {
    query = query.lte('started_at', filters.dateTo)
  }

  query = query.order('started_at', { ascending: false })

  const page = filters.page || 1
  const limit = filters.limit || 50
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch switches: ${error.message}`)
  }

  return {
    switches: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

export async function getStuckSwitches() {
  const supabase = await createServerSupabaseClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('user_switches')
    .select(`
      *,
      bank_deals (
        bank_name,
        reward_amount
      ),
      profiles (
        email,
        full_name
      )
    `)
    .lt('started_at', sevenDaysAgo)
    .neq('status', 'completed')
    .neq('status', 'failed')
    .order('started_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch stuck switches: ${error.message}`)
  }

  return data || []
}

// System health functions
export interface SystemHealthMetrics {
  database: {
    status: 'operational' | 'issues'
    queryPerformance: number
    recentErrors: number
  }
  stripe: {
    status: 'operational' | 'issues'
    lastSuccessfulPayment: string | null
    failedPayments24h: number
  }
  scraping: {
    status: 'healthy' | 'warning' | 'critical'
    lastSuccessfulScrape: string | null
    sourcesWithIssues: number
  }
  overall: 'healthy' | 'warning' | 'critical'
}

export async function getSystemHealthMetrics(): Promise<SystemHealthMetrics> {
  const supabase = await createServerSupabaseClient()

  // Database health (simplified - would need actual monitoring)
  const { error: dbError } = await supabase.from('profiles').select('id').limit(1)
  const database = {
    status: dbError ? 'issues' as const : 'operational' as const,
    queryPerformance: 0, // Would need actual metrics
    recentErrors: 0 // Would need error logging
  }

  // Stripe health
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  const { data: recentPayments } = await supabase
    .from('dd_payments')
    .select('status, payment_date')
    .gte('payment_date', twentyFourHoursAgo)
    .order('payment_date', { ascending: false })

  const lastSuccessful = recentPayments?.find(p => p.status === 'succeeded')?.payment_date || null
  const failed24h = recentPayments?.filter(p => p.status === 'failed').length || 0

  const stripe = {
    status: failed24h > 10 ? 'issues' as const : 'operational' as const,
    lastSuccessfulPayment: lastSuccessful,
    failedPayments24h: failed24h
  }

  // Scraping health
  const { data: sources } = await supabase
    .from('scraping_sources')
    .select('last_scraped_at, last_scrape_status, is_active')
    .eq('is_active', true)

  const sourcesWithIssues = sources?.filter(s => 
    s.last_scrape_status !== 'success' || 
    !s.last_scraped_at ||
    new Date(s.last_scraped_at) < new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  ).length || 0

  const lastSuccessfulScrape = sources?.reduce((latest, s) => {
    if (!s.last_scraped_at) return latest
    if (!latest) return s.last_scraped_at
    return s.last_scraped_at > latest ? s.last_scraped_at : latest
  }, null as string | null) || null

  let scrapingStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
  if (sourcesWithIssues > sources?.length! / 2) {
    scrapingStatus = 'critical'
  } else if (sourcesWithIssues > 0) {
    scrapingStatus = 'warning'
  }

  // Overall health
  let overall: 'healthy' | 'warning' | 'critical' = 'healthy'
  if (database.status === 'issues' || scrapingStatus === 'critical') {
    overall = 'critical'
  } else if (stripe.status === 'issues' || scrapingStatus === 'warning') {
    overall = 'warning'
  }

  return {
    database,
    stripe,
    scraping: {
      status: scrapingStatus,
      lastSuccessfulScrape,
      sourcesWithIssues
    },
    overall
  }
}

// Fraud detection functions
export interface FlaggedAccount {
  userId: string
  email: string
  riskLevel: 'high' | 'medium' | 'low'
  reason: string
  flaggedDate: string
  status: 'under_review' | 'cleared' | 'banned'
}

export async function getFlaggedAccounts(): Promise<FlaggedAccount[]> {
  // This would typically query a flagged_accounts table
  // For now, return empty array - implementation would depend on fraud detection logic
  return []
}

// Scraping stats (integration with existing scraping system)
export async function getScrapingStats() {
  const supabase = await createServerSupabaseClient()

  const { data: sources } = await supabase
    .from('scraping_sources')
    .select('*')
    .eq('is_active', true)

  const activeSources = sources?.length || 0

  const lastScrape = sources?.reduce((latest, s) => {
    if (!s.last_scraped_at) return latest
    if (!latest) return s.last_scraped_at
    return s.last_scraped_at > latest ? s.last_scraped_at : latest
  }, null as string | null) || null

  // Get overall health from scraping system
  const health = await getSystemHealthMetrics()

  return {
    activeSources,
    lastScrapeTime: lastScrape,
    healthStatus: health.scraping.status
  }
}

// Affiliate stats (integration with existing affiliate system)
export async function getAffiliateStats() {
  const supabase = await createServerSupabaseClient()

  const { data: products } = await supabase
    .from('affiliate_products')
    .select('id')
    .eq('is_active', true)

  const activeProducts = products?.length || 0

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: clicks } = await supabase
    .from('affiliate_clicks')
    .select('status, commission_earned, conversion_timestamp')
    .gte('click_timestamp', thisMonthStart)

  const totalClicks = clicks?.length || 0
  const conversions = clicks?.filter(c => c.status === 'converted').length || 0
  const conversionRate = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0

  return {
    activeProducts,
    totalClicks,
    conversionRate: Math.round(conversionRate * 100) / 100
  }
}

