'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Database } from '../../../types/supabase'
import DealCard from './DealCard'
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react'

type BankDeal = Database['public']['Tables']['bank_deals']['Row']

interface DealsGridProps {
  deals: BankDeal[]
  onStartSwitch: (dealId: string) => void
  loading?: boolean
}

type SortOption = 'reward_high' | 'reward_low' | 'expiry_soon' | 'bank_name'

export default function DealsGrid({ deals, onStartSwitch, loading = false }: DealsGridProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBanks, setSelectedBanks] = useState<string[]>([])
  const [minReward, setMinReward] = useState(0)
  const [maxReward, setMaxReward] = useState(500)
  const [minDirectDebits, setMinDirectDebits] = useState(0)
  const [sortBy, setSortBy] = useState<SortOption>('reward_high')
  const [showFilters, setShowFilters] = useState(false)
  const [hideExpired, setHideExpired] = useState(true)

  // Get unique banks for filter
  const availableBanks = useMemo(() => {
    return Array.from(new Set(deals.map(deal => deal.bank_name))).sort()
  }, [deals])

  // Get max reward amount for slider
  const maxRewardAmount = useMemo(() => {
    return Math.max(...deals.map(deal => deal.reward_amount), 500)
  }, [deals])

  // Filter and sort deals
  const filteredAndSortedDeals = useMemo(() => {
    const filtered = deals.filter(deal => {
      // Search filter
      if (searchTerm && !deal.bank_name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // Bank filter
      if (selectedBanks.length > 0 && !selectedBanks.includes(deal.bank_name)) {
        return false
      }

      // Reward amount filter
      if (deal.reward_amount < minReward || deal.reward_amount > maxReward) {
        return false
      }

      // Direct debits filter
      if (deal.required_direct_debits < minDirectDebits) {
        return false
      }

      // Expired filter
      if (hideExpired && deal.expiry_date) {
        const expiryDate = new Date(deal.expiry_date)
        const now = new Date()
        if (expiryDate < now) {
          return false
        }
      }

      return true
    })

    // Sort deals
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'reward_high':
          return b.reward_amount - a.reward_amount
        case 'reward_low':
          return a.reward_amount - b.reward_amount
        case 'expiry_soon':
          if (!a.expiry_date || !b.expiry_date) return 0
          return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
        case 'bank_name':
          return a.bank_name.localeCompare(b.bank_name)
        default:
          return 0
      }
    })

    return filtered
  }, [deals, searchTerm, selectedBanks, minReward, maxReward, minDirectDebits, sortBy, hideExpired])

  const handleBankToggle = (bankName: string) => {
    setSelectedBanks(prev => 
      prev.includes(bankName) 
        ? prev.filter(bank => bank !== bankName)
        : [...prev, bankName]
    )
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedBanks([])
    setMinReward(0)
    setMaxReward(maxRewardAmount)
    setMinDirectDebits(0)
    setSortBy('reward_high')
    setHideExpired(true)
  }

  const hasActiveFilters = searchTerm || selectedBanks.length > 0 || minReward > 0 || maxReward < maxRewardAmount || minDirectDebits > 0 || !hideExpired

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-neutral-600">Loading deals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <Card className="card-professional border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Find Your Perfect Deal</CardTitle>
              <CardDescription>
                {filteredAndSortedDeals.length} of {deals.length} deals match your criteria
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <Input
              placeholder="Search by bank name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-professional"
            />
          </div>

          {/* Sort and Expired Filter */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="sort" className="text-sm font-medium text-neutral-700">
                Sort by:
              </Label>
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-48 bg-white border-neutral-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-neutral-200 shadow-lg">
                  <SelectItem value="reward_high">
                    <div className="flex items-center gap-2">
                      <SortDesc className="w-4 h-4" />
                      Reward (High to Low)
                    </div>
                  </SelectItem>
                  <SelectItem value="reward_low">
                    <div className="flex items-center gap-2">
                      <SortAsc className="w-4 h-4" />
                      Reward (Low to High)
                    </div>
                  </SelectItem>
                  <SelectItem value="expiry_soon">Expiry (Soonest First)</SelectItem>
                  <SelectItem value="bank_name">Bank Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Hide Expired Toggle */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="hideExpired"
                checked={hideExpired}
                onCheckedChange={(checked) => setHideExpired(checked as boolean)}
              />
              <Label htmlFor="hideExpired" className="text-sm font-medium text-neutral-700">
                Hide expired deals
              </Label>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearAllFilters}
              className="flex items-center gap-2 text-sm"
            >
              <X className="w-4 h-4" />
              Clear all filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Filters Sidebar */}
      {showFilters && (
        <Card className="card-professional border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bank Filter */}
            <div>
              <Label className="text-sm font-medium text-neutral-700 mb-3 block">
                Banks
              </Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availableBanks.map(bank => (
                  <div key={bank} className="flex items-center space-x-2">
                    <Checkbox
                      id={bank}
                      checked={selectedBanks.includes(bank)}
                      onCheckedChange={() => handleBankToggle(bank)}
                    />
                    <Label htmlFor={bank} className="text-sm text-neutral-600">
                      {bank}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Reward Amount Range */}
            <div>
              <Label className="text-sm font-medium text-neutral-700 mb-3 block">
                Reward Amount: £{minReward} - £{maxReward}
              </Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="minReward" className="text-xs text-neutral-500 w-12">
                    Min: £
                  </Label>
                  <Input
                    id="minReward"
                    type="number"
                    value={minReward}
                    onChange={(e) => setMinReward(Number(e.target.value))}
                    className="input-professional"
                    min="0"
                    max={maxRewardAmount}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="maxReward" className="text-xs text-neutral-500 w-12">
                    Max: £
                  </Label>
                  <Input
                    id="maxReward"
                    type="number"
                    value={maxReward}
                    onChange={(e) => setMaxReward(Number(e.target.value))}
                    className="input-professional"
                    min={minReward}
                    max={maxRewardAmount}
                  />
                </div>
              </div>
            </div>

            {/* Direct Debits Filter */}
            <div>
              <Label className="text-sm font-medium text-neutral-700 mb-3 block">
                Minimum Direct Debits
              </Label>
              <Select value={minDirectDebits.toString()} onValueChange={(value) => setMinDirectDebits(Number(value))}>
                <SelectTrigger className="bg-white border-neutral-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-neutral-200 shadow-lg">
                  <SelectItem value="0">Any amount</SelectItem>
                  <SelectItem value="1">1 or more</SelectItem>
                  <SelectItem value="2">2 or more</SelectItem>
                  <SelectItem value="3">3 or more</SelectItem>
                  <SelectItem value="4">4 or more</SelectItem>
                  <SelectItem value="5">5 or more</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deals Grid */}
      {filteredAndSortedDeals.length === 0 ? (
        <Card className="card-professional border-0">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">No deals found</h3>
            <p className="text-neutral-600 mb-4">
              {hasActiveFilters 
                ? "Try adjusting your filters to see more deals."
                : "No bank switching deals are currently available."
              }
            </p>
            {hasActiveFilters && (
              <Button onClick={clearAllFilters} variant="outline">
                Clear all filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedDeals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onStartSwitch={onStartSwitch}
            />
          ))}
        </div>
      )}
    </div>
  )
}
