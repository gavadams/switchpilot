'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CreditCard, 
  Plus, 
  Filter, 
  SortAsc, 
  Loader2,
  AlertCircle,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getUserDirectDebits, getDirectDebitStats } from '../../../lib/supabase/direct-debits'
import { Database } from '../../../types/supabase'

type DirectDebit = Database['public']['Tables']['direct_debits']['Row']
import DirectDebitCard from './DirectDebitCard'

interface DirectDebitsListProps {
  onSetupNew: () => void
  className?: string
}

type StatusFilter = 'all' | 'active' | 'pending' | 'cancelled' | 'failed'
type CategoryFilter = 'all' | 'service' | 'charity'
type SortBy = 'amount' | 'setup_date' | 'next_collection' | 'provider'

export default function DirectDebitsList({ onSetupNew, className }: DirectDebitsListProps) {
  const { user } = useAuth()
  const [directDebits, setDirectDebits] = useState<DirectDebit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('setup_date')
  const [stats, setStats] = useState({
    activeCount: 0,
    monthlyTotal: 0,
    totalCollected: 0
  })

  const fetchDirectDebits = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      
      const [ddData, statsData] = await Promise.all([
        getUserDirectDebits(user.id),
        getDirectDebitStats(user.id)
      ])
      
      setDirectDebits(ddData)
      setStats(statsData)
    } catch (err) {
      console.error('Error fetching direct debits:', err)
      setError('Failed to load direct debits')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchDirectDebits()
  }, [user?.id, fetchDirectDebits])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getCategoryFromProvider = (provider: string): 'service' | 'charity' => {
    return provider.startsWith('charity_') ? 'charity' : 'service'
  }

  const filteredAndSortedDebits = directDebits
    .filter(dd => {
      // Status filter
      if (statusFilter !== 'all' && dd.status !== statusFilter) return false
      
      // Category filter
      if (categoryFilter !== 'all') {
        const category = getCategoryFromProvider(dd.provider)
        if (category !== categoryFilter) return false
      }
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount
        case 'setup_date':
          return new Date(b.setup_date).getTime() - new Date(a.setup_date).getTime()
        case 'next_collection':
          if (!a.next_collection_date && !b.next_collection_date) return 0
          if (!a.next_collection_date) return 1
          if (!b.next_collection_date) return -1
          return new Date(a.next_collection_date).getTime() - new Date(b.next_collection_date).getTime()
        case 'provider':
          return a.provider.localeCompare(b.provider)
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <Card className={`card-professional border-0 ${className}`}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-neutral-600">Loading direct debits...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`card-professional border-0 ${className}`}>
        <CardContent className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">Failed to load direct debits</h3>
          <p className="text-neutral-600 mb-4">{error}</p>
          <Button onClick={fetchDirectDebits} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-professional border-0">
          <CardContent className="text-center p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">Active DDs</span>
            </div>
            <div className="text-2xl font-bold text-primary-600">{stats.activeCount}</div>
          </CardContent>
        </Card>
        
        <Card className="card-professional border-0">
          <CardContent className="text-center p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-accent-600" />
              <span className="text-sm font-medium text-accent-700">Monthly Total</span>
            </div>
            <div className="text-2xl font-bold text-accent-600">{formatCurrency(stats.monthlyTotal)}</div>
          </CardContent>
        </Card>
        
        <Card className="card-professional border-0">
          <CardContent className="text-center p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-success-600" />
              <span className="text-sm font-medium text-success-700">Total Collected</span>
            </div>
            <div className="text-2xl font-bold text-success-600">{formatCurrency(stats.totalCollected)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="card-professional border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-600" />
                <label className="text-sm font-medium text-neutral-700">Status:</label>
                <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-neutral-700">Category:</label>
                <Select value={categoryFilter} onValueChange={(value: CategoryFilter) => setCategoryFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="service">Services</SelectItem>
                    <SelectItem value="charity">Charities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4 text-neutral-600" />
                <label className="text-sm font-medium text-neutral-700">Sort:</label>
                <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="setup_date">Setup Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="next_collection">Next Collection</SelectItem>
                    <SelectItem value="provider">Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={onSetupNew} className="bg-primary-500 hover:bg-primary-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Setup New Direct Debit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Direct Debits Grid */}
      {filteredAndSortedDebits.length === 0 ? (
        <Card className="card-professional border-0">
          <CardContent className="text-center py-12">
            <CreditCard className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">
              {directDebits.length === 0 ? 'No direct debits yet' : 'No direct debits match your filter'}
            </h3>
            <p className="text-neutral-600 mb-6">
              {directDebits.length === 0 
                ? 'Set up your first direct debit to start building your switching requirements!'
                : 'Try adjusting your filters to see more direct debits.'
              }
            </p>
            {directDebits.length === 0 && (
              <Button onClick={onSetupNew} className="bg-primary-500 hover:bg-primary-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Setup Your First Direct Debit
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedDebits.map((directDebit) => (
            <DirectDebitCard
              key={directDebit.id}
              directDebit={directDebit}
              onUpdate={fetchDirectDebits}
            />
          ))}
        </div>
      )}
    </div>
  )
}
