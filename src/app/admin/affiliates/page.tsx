'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
// Removed unused Select imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Loader2, AlertCircle, TrendingUp, Plus, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

// Bank deal type
interface BankDeal {
  id: string
  bank_name: string
  reward_amount: number
  is_active: boolean
  affiliate_url?: string
  affiliate_provider?: string
  commission_rate?: number
  tracking_enabled: boolean
}

// Product type
interface Product {
  id: string
  product_name: string
  provider_name: string
  product_type: string
  affiliate_url: string
  affiliate_provider?: string
  affiliate_commission: number
  is_active: boolean
}

export default function AdminAffiliatesPage() {
  console.log('AdminAffiliatesPage: Component rendered')

  const [bankDeals, setBankDeals] = useState<BankDeal[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [dealSearch, setDealSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      console.log('Frontend: Starting data fetch...')
      setLoading(true)
      setError(null)

      console.log('Frontend: Making API calls...')
      const [dealsRes, productsRes] = await Promise.all([
        fetch('/api/admin/affiliates/bank-deals'),
        fetch('/api/admin/affiliates/products')
      ])

      console.log('Frontend: API responses received', {
        dealsOk: dealsRes.ok,
        dealsStatus: dealsRes.status,
        productsOk: productsRes.ok,
        productsStatus: productsRes.status
      })

      if (!dealsRes.ok || !productsRes.ok) {
        throw new Error(`Failed to fetch data: deals=${dealsRes.status}, products=${productsRes.status}`)
      }

      const dealsData = await dealsRes.json()
      const productsData = await productsRes.json()

      console.log('Frontend: Data parsed', {
        dealsCount: dealsData?.length || 0,
        productsCount: productsData?.length || 0
      })

      setBankDeals(dealsData)
      setProducts(productsData)
      console.log('Frontend: Data set successfully')
    } catch (err) {
      console.error('Frontend: Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Filter data
  const filteredBankDeals = bankDeals.filter(deal =>
    deal.bank_name.toLowerCase().includes(dealSearch.toLowerCase())
  )

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.provider_name.toLowerCase().includes(productSearch.toLowerCase())
  )

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
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Affiliate Link
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
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

              {/* Table */}
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-4 text-left font-medium">Bank</th>
                      <th className="p-4 text-left font-medium">Reward</th>
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
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No bank deals found
                        </td>
                      </tr>
                    ) : (
                      filteredBankDeals.map(deal => (
                        <tr key={deal.id} className="border-t">
                          <td className="p-4 font-medium">{deal.bank_name}</td>
                          <td className="p-4">£{deal.reward_amount}</td>
                          <td className="p-4">
                            {deal.affiliate_url ? (
                              <span className="text-sm text-blue-600 truncate max-w-xs block">
                                {deal.affiliate_url}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">No affiliate link</span>
                            )}
                          </td>
                          <td className="p-4">{deal.affiliate_provider || '-'}</td>
                          <td className="p-4">
                            {deal.commission_rate ? `£${deal.commission_rate}` : '-'}
                          </td>
                          <td className="p-4">
                            <Badge variant={deal.tracking_enabled ? "default" : "secondary"}>
                              {deal.tracking_enabled ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
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
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Product
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
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

              {/* Table */}
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-4 text-left font-medium">Product</th>
                      <th className="p-4 text-left font-medium">Provider</th>
                      <th className="p-4 text-left font-medium">Type</th>
                      <th className="p-4 text-left font-medium">Commission</th>
                      <th className="p-4 text-left font-medium">Status</th>
                      <th className="p-4 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No products found
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(product => (
                        <tr key={product.id} className="border-t">
                          <td className="p-4 font-medium">{product.product_name}</td>
                          <td className="p-4">{product.provider_name}</td>
                          <td className="p-4">
                            <Badge variant="outline">
                              {product.product_type.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-4">£{product.affiliate_commission}</td>
                          <td className="p-4">
                            <Badge variant={product.is_active ? "default" : "secondary"}>
                              {product.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
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

