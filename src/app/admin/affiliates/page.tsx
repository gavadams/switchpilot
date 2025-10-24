'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AdminBankDeal, AdminProduct } from '@/types'
import BankDealRow from '@/components/features/admin/BankDealRow'
import ProductRow from '@/components/features/admin/ProductRow'
import AddBankDealAffiliateDialog from '@/components/features/admin/AddBankDealAffiliateDialog'
import AddProductDialog from '@/components/features/admin/AddProductDialog'
import { Search, Loader2, AlertCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminAffiliatesPage() {
  const [bankDeals, setBankDeals] = useState<AdminBankDeal[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Bank deals filters
  const [dealSearch, setDealSearch] = useState('')
  const [dealActiveFilter, setDealActiveFilter] = useState('all')
  const [dealAffiliateFilter, setDealAffiliateFilter] = useState('all')
  
  // Products filters
  const [productSearch, setProductSearch] = useState('')
  const [productTypeFilter, setProductTypeFilter] = useState('all')
  const [productActiveFilter, setProductActiveFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [dealsRes, productsRes] = await Promise.all([
        fetch('/api/admin/affiliates/bank-deals'),
        fetch('/api/admin/affiliates/products')
      ])

      if (!dealsRes.ok || !productsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const dealsData = await dealsRes.json()
      const productsData = await productsRes.json()

      setBankDeals(dealsData)
      setProducts(productsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Bank deal handlers
  const handleUpdateBankDeal = async (dealId: string, updates: Partial<AdminBankDeal>) => {
    try {
      const res = await fetch('/api/admin/affiliates/bank-deals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, ...updates })
      })

      if (!res.ok) throw new Error('Failed to update')

      const updated = await res.json()
      setBankDeals(prev => prev.map(d => d.id === dealId ? updated : d))
    } catch (err) {
      console.error('Update failed:', err)
      alert('Failed to update bank deal')
    }
  }

  const handleDeleteBankDealAffiliate = async (dealId: string) => {
    try {
      const res = await fetch(`/api/admin/affiliates/bank-deals?dealId=${dealId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete')

      const updated = await res.json()
      setBankDeals(prev => prev.map(d => d.id === dealId ? updated : d))
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to remove affiliate data')
    }
  }

  const handleAddBankDealAffiliate = async (
    dealId: string,
    data: { affiliateUrl: string; affiliateProvider: string; commissionRate: number }
  ) => {
    try {
      const res = await fetch('/api/admin/affiliates/bank-deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, ...data })
      })

      if (!res.ok) throw new Error('Failed to add')

      const updated = await res.json()
      setBankDeals(prev => prev.map(d => d.id === dealId ? updated : d))
    } catch (err) {
      console.error('Add failed:', err)
      alert('Failed to add affiliate data')
    }
  }

  // Product handlers
  const handleUpdateProduct = async (productId: string, updates: Partial<AdminProduct>) => {
    try {
      const res = await fetch('/api/admin/affiliates/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, ...updates })
      })

      if (!res.ok) throw new Error('Failed to update')

      const updated = await res.json()
      setProducts(prev => prev.map(p => p.id === productId ? updated : p))
    } catch (err) {
      console.error('Update failed:', err)
      alert('Failed to update product')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/admin/affiliates/products?productId=${productId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete')

      setProducts(prev => prev.filter(p => p.id !== productId))
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete product')
    }
  }

  const handleAddProduct = async (data: Omit<AdminProduct, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const res = await fetch('/api/admin/affiliates/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) throw new Error('Failed to add')

      const newProduct = await res.json()
      setProducts(prev => [...prev, newProduct])
    } catch (err) {
      console.error('Add failed:', err)
      alert('Failed to add product')
    }
  }

  // Filter bank deals
  const filteredBankDeals = bankDeals.filter(deal => {
    const matchesSearch = deal.bank_name.toLowerCase().includes(dealSearch.toLowerCase())
    const matchesActive = dealActiveFilter === 'all' || 
      (dealActiveFilter === 'active' ? deal.is_active : !deal.is_active)
    const matchesAffiliate = dealAffiliateFilter === 'all' ||
      (dealAffiliateFilter === 'with' ? !!deal.affiliate_url : !deal.affiliate_url)
    
    return matchesSearch && matchesActive && matchesAffiliate
  })

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.product_name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.provider_name.toLowerCase().includes(productSearch.toLowerCase())
    const matchesType = productTypeFilter === 'all' || product.product_type === productTypeFilter
    const matchesActive = productActiveFilter === 'all' ||
      (productActiveFilter === 'active' ? product.is_active : !product.is_active)
    
    return matchesSearch && matchesType && matchesActive
  })

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Affiliate Management</h1>
          <p className="text-muted-foreground">Manage affiliate links for bank deals and products</p>
        </div>
        <Link href="/admin/affiliates/performance">
          <Button variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Performance
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="bank-deals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bank-deals">
            Bank Deals
            <Badge variant="secondary" className="ml-2">{bankDeals.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="products">
            Products
            <Badge variant="secondary" className="ml-2">{products.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bank-deals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bank Deal Affiliates</CardTitle>
                  <CardDescription>Manage affiliate links for bank switching deals</CardDescription>
                </div>
                <AddBankDealAffiliateDialog deals={bankDeals} onAdd={handleAddBankDealAffiliate} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search bank deals..."
                      value={dealSearch}
                      onChange={(e) => setDealSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={dealActiveFilter} onValueChange={setDealActiveFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dealAffiliateFilter} onValueChange={setDealAffiliateFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Deals</SelectItem>
                    <SelectItem value="with">With Affiliate</SelectItem>
                    <SelectItem value="without">Without Affiliate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-4 text-left font-medium">Bank</th>
                      <th className="p-4 text-left font-medium">Affiliate URL</th>
                      <th className="p-4 text-left font-medium">Provider</th>
                      <th className="p-4 text-left font-medium">Commission</th>
                      <th className="p-4 text-left font-medium">Status</th>
                      <th className="p-4 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBankDeals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No bank deals found
                        </td>
                      </tr>
                    ) : (
                      filteredBankDeals.map(deal => (
                        <BankDealRow
                          key={deal.id}
                          deal={deal}
                          onUpdate={handleUpdateBankDeal}
                          onDelete={handleDeleteBankDealAffiliate}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Affiliate Products</CardTitle>
                  <CardDescription>Manage credit cards, savings, loans, and more</CardDescription>
                </div>
                <AddProductDialog onAdd={handleAddProduct} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="savings_account">Savings</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                    <SelectItem value="mortgage">Mortgage</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={productActiveFilter} onValueChange={setProductActiveFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-4 text-left font-medium">Product</th>
                      <th className="p-4 text-left font-medium">Provider</th>
                      <th className="p-4 text-left font-medium">Type</th>
                      <th className="p-4 text-left font-medium">Affiliate URL</th>
                      <th className="p-4 text-left font-medium">Commission</th>
                      <th className="p-4 text-left font-medium">Status</th>
                      <th className="p-4 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No products found
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(product => (
                        <ProductRow
                          key={product.id}
                          product={product}
                          onUpdate={handleUpdateProduct}
                          onDelete={handleDeleteProduct}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

