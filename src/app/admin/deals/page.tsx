'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/features/admin/StatCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Edit, Trash2, Copy, CreditCard, Search } from 'lucide-react'
import { BankDeal } from '@/types/database'
import { DEAL_TEMPLATES } from '@/lib/data/deal-templates'
import { validateDeal } from '@/lib/admin/deal-validator'

export const dynamic = 'force-dynamic'

interface DealsResponse {
  deals: BankDeal[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function DealsManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [deals, setDeals] = useState<BankDeal[]>([])
  const [stats, setStats] = useState({
    totalDeals: 0,
    activeDeals: 0,
    addedThisMonth: 0,
    updatedThisWeek: 0
  })
  const [filters, setFilters] = useState({
    search: '',
    status: 'all' as 'all' | 'active' | 'inactive',
    source: 'all' as 'all' | 'Manual' | 'Scrimpr' | 'MSE'
  })
  const [page, setPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDeal, setEditingDeal] = useState<BankDeal | null>(null)
  const [formData, setFormData] = useState({
    bank_name: '',
    reward_amount: 0,
    required_direct_debits: 2,
    min_pay_in: 0,
    debit_card_transactions: 0,
    expiry_date: '',
    time_to_payout: '30 days',
    is_active: true,
    affiliate_url: '',
    commission_rate: 0
  })

  useEffect(() => {
    fetchDeals()
    fetchStats()
  }, [page, filters])

  const fetchDeals = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        status: filters.status,
        source: filters.source
      })
      if (filters.search) {
        params.append('search', filters.search)
      }

      const res = await fetch(`/api/admin/deals?${params}`)
      if (res.ok) {
        const data: DealsResponse = await res.json()
        setDeals(data.deals)
      }
    } catch (error) {
      console.error('Error fetching deals:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/deals/stats')
      if (res.ok) {
        const data = await res.json()
        setStats({
          totalDeals: data.totalDeals || 0,
          activeDeals: data.activeDeals || 0,
          addedThisMonth: data.addedThisMonth || 0,
          updatedThisWeek: data.updatedThisWeek || 0
        })
      }
    } catch (error) {
      console.error('Error fetching deal stats:', error)
      // Fallback to calculating from deals array
      const total = deals.length
      const active = deals.filter(d => d.is_active).length
      setStats({
        totalDeals: total,
        activeDeals: active,
        addedThisMonth: 0,
        updatedThisWeek: 0
      })
    }
  }

  const handleSaveDeal = async () => {
    const validation = validateDeal(formData)
    if (!validation.valid) {
      alert(validation.errors.join('\n'))
      return
    }

    try {
      const url = editingDeal ? '/api/admin/deals' : '/api/admin/deals'
      const method = editingDeal ? 'PATCH' : 'POST'
      const body = editingDeal
        ? { id: editingDeal.id, ...formData }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setShowAddModal(false)
        setEditingDeal(null)
        resetForm()
        fetchDeals()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save deal')
      }
    } catch (error) {
      console.error('Error saving deal:', error)
      alert('Failed to save deal')
    }
  }

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to deactivate this deal?')) return

    try {
      const res = await fetch(`/api/admin/deals?id=${dealId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchDeals()
      }
    } catch (error) {
      console.error('Error deleting deal:', error)
      alert('Failed to delete deal')
    }
  }

  const handleDuplicateDeal = async (dealId: string) => {
    try {
      const res = await fetch('/api/admin/deals/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dealId })
      })

      if (res.ok) {
        fetchDeals()
      }
    } catch (error) {
      console.error('Error duplicating deal:', error)
      alert('Failed to duplicate deal')
    }
  }

  const handleToggleActive = async (deal: BankDeal) => {
    try {
      const res = await fetch('/api/admin/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deal.id,
          is_active: !deal.is_active
        })
      })

      if (res.ok) {
        fetchDeals()
      }
    } catch (error) {
      console.error('Error toggling deal:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      bank_name: '',
      reward_amount: 0,
      required_direct_debits: 2,
      min_pay_in: 0,
      debit_card_transactions: 0,
      expiry_date: '',
      time_to_payout: '30 days',
      is_active: true,
      affiliate_url: '',
      commission_rate: 0
    })
  }

  const openEditModal = (deal: BankDeal) => {
    setEditingDeal(deal)
    setFormData({
      bank_name: deal.bank_name,
      reward_amount: deal.reward_amount,
      required_direct_debits: deal.required_direct_debits,
      min_pay_in: deal.min_pay_in,
      debit_card_transactions: deal.debit_card_transactions,
      expiry_date: deal.expiry_date || '',
      time_to_payout: deal.time_to_payout,
      is_active: deal.is_active,
      affiliate_url: deal.affiliate_url || '',
      commission_rate: deal.commission_rate
    })
    setShowAddModal(true)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return 'Invalid date'
    }
  }

  return (
    <DashboardLayout
      title="Deals Management"
      breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Deals' }]}
    >
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title="Total Deals"
          value={stats.totalDeals}
          icon={<CreditCard className="h-4 w-4" />}
        />
        <StatCard
          title="Active Deals"
          value={stats.activeDeals}
          icon={<CreditCard className="h-4 w-4" />}
        />
        <StatCard
          title="Added This Month"
          value={stats.addedThisMonth}
          icon={<Plus className="h-4 w-4" />}
        />
        <StatCard
          title="Updated This Week"
          value={stats.updatedThisWeek}
          icon={<Edit className="h-4 w-4" />}
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by bank name..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value })
                    setPage(1)
                  }}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={filters.status}
              onValueChange={(value: 'all' | 'active' | 'inactive') => {
                setFilters({ ...filters, status: value })
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.source}
              onValueChange={(value: 'all' | 'Manual' | 'Scrimpr' | 'MSE') => {
                setFilters({ ...filters, source: value })
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Scrimpr">Scrimpr</SelectItem>
                <SelectItem value="MSE">MSE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deals Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bank Deals</CardTitle>
              <CardDescription>
                {deals.length} of {stats.totalDeals} deals
              </CardDescription>
            </div>
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingDeal(null) }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Deal
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-neutral-200 shadow-xl max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingDeal ? 'Edit Deal' : 'Add New Deal'}</DialogTitle>
                  <DialogDescription>
                    {editingDeal ? 'Update deal information' : 'Create a new bank switching deal'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Bank Name *</Label>
                      <Input
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        placeholder="e.g., HSBC"
                      />
                    </div>
                    <div>
                      <Label>Reward Amount (£) *</Label>
                      <Input
                        type="number"
                        value={formData.reward_amount}
                        onChange={(e) => setFormData({ ...formData, reward_amount: parseFloat(e.target.value) || 0 })}
                        placeholder="175.00"
                      />
                    </div>
                    <div>
                      <Label>Required Direct Debits</Label>
                      <Input
                        type="number"
                        value={formData.required_direct_debits}
                        onChange={(e) => setFormData({ ...formData, required_direct_debits: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="10"
                      />
                    </div>
                    <div>
                      <Label>Min Pay-in (£)</Label>
                      <Input
                        type="number"
                        value={formData.min_pay_in}
                        onChange={(e) => setFormData({ ...formData, min_pay_in: parseFloat(e.target.value) || 0 })}
                        placeholder="1000"
                      />
                    </div>
                    <div>
                      <Label>Debit Card Transactions</Label>
                      <Input
                        type="number"
                        value={formData.debit_card_transactions}
                        onChange={(e) => setFormData({ ...formData, debit_card_transactions: parseInt(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label>Time to Payout</Label>
                      <Select
                        value={formData.time_to_payout}
                        onValueChange={(value) => setFormData({ ...formData, time_to_payout: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30 days">30 days</SelectItem>
                          <SelectItem value="60 days">60 days</SelectItem>
                          <SelectItem value="90 days">90 days</SelectItem>
                          <SelectItem value="120 days">120 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Expiry Date</Label>
                      <Input
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Affiliate URL</Label>
                      <Input
                        value={formData.affiliate_url}
                        onChange={(e) => setFormData({ ...formData, affiliate_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Commission Rate (%)</Label>
                      <Input
                        type="number"
                        value={formData.commission_rate}
                        onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                        placeholder="5.00"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); setEditingDeal(null) }}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveDeal}>
                      {editingDeal ? 'Update Deal' : 'Save Deal'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : deals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No deals found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank Name</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Required DDs</TableHead>
                  <TableHead>Min Pay-in</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.bank_name}</TableCell>
                    <TableCell>£{deal.reward_amount.toFixed(2)}</TableCell>
                    <TableCell>{deal.required_direct_debits}</TableCell>
                    <TableCell>£{deal.min_pay_in.toFixed(2)}</TableCell>
                    <TableCell>{formatDate(deal.expiry_date)}</TableCell>
                    <TableCell>
                      <Badge variant={deal.source_name === 'Manual' ? 'default' : 'secondary'}>
                        {deal.source_name || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={deal.is_active}
                        onCheckedChange={() => handleToggleActive(deal)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(deal)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateDeal(deal.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDeal(deal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

