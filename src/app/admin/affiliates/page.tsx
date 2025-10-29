'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Loader2, AlertCircle, TrendingUp, Edit, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import EditBankDealModal from '../../../components/features/admin/EditBankDealModal'
import EditProductModal from '../../../components/features/admin/EditProductModal'
import ConfirmDeleteDialog from '../../../components/features/admin/ConfirmDeleteDialog'
import AddBankDealModal from '../../../components/features/admin/AddBankDealModal'
import AddProductModal from '../../../components/features/admin/AddProductModal'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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
interface AffiliateProduct {
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
  const [bankDeals, setBankDeals] = useState<BankDeal[]>([])
  const [products, setProducts] = useState<AffiliateProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [dealSearch, setDealSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')

  // Modal state
  const [editingBankDeal, setEditingBankDeal] = useState<BankDeal | null>(null)
  const [editingProduct, setEditingProduct] = useState<AffiliateProduct | null>(null)
  const [deletingBankDeal, setDeletingBankDeal] = useState<BankDeal | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<AffiliateProduct | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showAddBankDeal, setShowAddBankDeal] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [dealsRes, productsRes] = await Promise.all([
        fetch('/api/admin/affiliates/bank-deals'),
        fetch('/api/admin/affiliates/products')
      ])

      if (!dealsRes.ok || !productsRes.ok) {
        throw new Error(`Failed to fetch data: deals=${dealsRes.status}, products=${productsRes.status}`)
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
  }, [])

  // Handler functions
  const handleUpdateBankDeal = async (dealId: string, data: {
    affiliateUrl: string
    affiliateProvider: string
    commissionRate: number
    trackingEnabled: boolean
  }) => {
    try {
      const response = await fetch('/api/admin/affiliates/bank-deals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          affiliateUrl: data.affiliateUrl,
          affiliateProvider: data.affiliateProvider,
          commissionRate: data.commissionRate,
          trackingEnabled: data.trackingEnabled
        })
      })

      if (!response.ok) throw new Error('Failed to update bank deal')

      await fetchData() // Refresh data
    } catch (error) {
      console.error('Error updating bank deal:', error)
      throw error
    }
  }

  const handleUpdateProduct = async (productId: string, data: {
    productName: string
    providerName: string
    productType: string
    description: string
    affiliateUrl: string
    affiliateProvider: string
    affiliateCommission: number
    isActive: boolean
  }) => {
    try {
      const response = await fetch('/api/admin/affiliates/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productName: data.productName,
          providerName: data.providerName,
          productType: data.productType,
          description: data.description,
          affiliateUrl: data.affiliateUrl,
          affiliateProvider: data.affiliateProvider,
          affiliateCommission: data.affiliateCommission,
          isActive: data.isActive
        })
      })

      if (!response.ok) throw new Error('Failed to update product')

      await fetchData() // Refresh data
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  const handleDeleteBankDeal = async () => {
    if (!deletingBankDeal) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/affiliates/bank-deals?dealId=${deletingBankDeal.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete bank deal affiliate')

      await fetchData() // Refresh data
      setDeletingBankDeal(null)
    } catch (error) {
      console.error('Error deleting bank deal affiliate:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/affiliates/products?productId=${deletingProduct.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete product')

      await fetchData() // Refresh data
      setDeletingProduct(null)
    } catch (error) {
      console.error('Error deleting product:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddBankDeal = async (dealId: string, data: {
    affiliateUrl: string
    affiliateProvider: string
    commissionRate: number
    trackingEnabled: boolean
  }) => {
    try {
      const response = await fetch('/api/admin/affiliates/bank-deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          affiliateUrl: data.affiliateUrl,
          affiliateProvider: data.affiliateProvider,
          commissionRate: data.commissionRate
        })
      })

      if (!response.ok) throw new Error('Failed to add bank deal affiliate')

      await fetchData() // Refresh data
    } catch (error) {
      console.error('Error adding bank deal affiliate:', error)
      throw error
    }
  }

  const handleAddProduct = async (data: {
    productName: string
    providerName: string
    productType: string
    description: string
    affiliateUrl: string
    affiliateProvider: string
    affiliateCommission: number
    isActive: boolean
  }) => {
    try {
      const response = await fetch('/api/admin/affiliates/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: data.productName,
          providerName: data.providerName,
          productType: data.productType,
          description: data.description,
          affiliateUrl: data.affiliateUrl,
          affiliateProvider: data.affiliateProvider,
          affiliateCommission: data.affiliateCommission,
          isActive: data.isActive
        })
      })

      if (!response.ok) throw new Error('Failed to create product')

      await fetchData() // Refresh data
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Affiliate Management</h2>
          <p className="text-muted-foreground">Manage affiliate links for bank deals and products</p>
        </div>
        <Link href="/admin/affiliates/performance">
          <Button variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Performance
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="bank-deals" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="bank-deals">Bank Deals ({filteredBankDeals.length})</TabsTrigger>
            <TabsTrigger value="products">Products ({filteredProducts.length})</TabsTrigger>
          </TabsList>
                  <div className="flex gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search bank deals..."
                        className="pl-9 w-64"
                        value={dealSearch}
                        onChange={e => setDealSearch(e.target.value)}
                      />
                    </div>
              <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                        placeholder="Search products..."
                        className="pl-9 w-64"
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

        <TabsContent value="bank-deals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bank Deal Affiliates</CardTitle>
                  <CardDescription>Manage affiliate links for various bank deals.</CardDescription>
                </div>
                <Button onClick={() => setShowAddBankDeal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Affiliate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredBankDeals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No bank deals found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Bank Name</th>
                        <th className="text-left p-4 font-medium">Reward</th>
                        <th className="text-left p-4 font-medium">Affiliate URL</th>
                        <th className="text-left p-4 font-medium">Provider</th>
                        <th className="text-left p-4 font-medium">Commission</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBankDeals.map(deal => (
                        <tr key={deal.id} className="border-b">
                          <td className="p-4 font-medium">{deal.bank_name}</td>
                          <td className="p-4">£{deal.reward_amount.toFixed(2)}</td>
                          <td className="p-4">
                            <Link href={deal.affiliate_url || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                              {deal.affiliate_url ? `${deal.affiliate_url.substring(0, 30)}...` : 'N/A'}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                          <td className="p-4">{deal.affiliate_provider || 'N/A'}</td>
                          <td className="p-4">{deal.commission_rate ? `${deal.commission_rate}%` : 'N/A'}</td>
                          <td className="p-4">
                            <Badge variant={deal.is_active ? 'default' : 'destructive'}>
                              {deal.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingBankDeal(deal)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeletingBankDeal(deal)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Affiliate Products</CardTitle>
                  <CardDescription>Manage various affiliate products.</CardDescription>
                </div>
                <Button onClick={() => setShowAddProduct(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No products found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Product Name</th>
                        <th className="text-left p-4 font-medium">Provider</th>
                        <th className="text-left p-4 font-medium">Type</th>
                        <th className="text-left p-4 font-medium">Affiliate URL</th>
                        <th className="text-left p-4 font-medium">Commission</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(product => (
                        <tr key={product.id} className="border-b">
                          <td className="p-4 font-medium">{product.product_name}</td>
                          <td className="p-4">{product.provider_name}</td>
                          <td className="p-4">{product.product_type}</td>
                          <td className="p-4">
                            <Link href={product.affiliate_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                              {`${product.affiliate_url.substring(0, 30)}...`}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                          <td className="p-4">£{product.affiliate_commission.toFixed(2)}</td>
                          <td className="p-4">
                            <Badge variant={product.is_active ? 'default' : 'destructive'}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingProduct(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeletingProduct(product)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <EditBankDealModal
        deal={editingBankDeal}
        open={!!editingBankDeal}
        onOpenChange={(open) => !open && setEditingBankDeal(null)}
        onSave={handleUpdateBankDeal}
      />

      <EditProductModal
        product={editingProduct}
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        onSave={handleUpdateProduct}
      />

      <ConfirmDeleteDialog
        open={!!deletingBankDeal}
        onOpenChange={(open) => !open && setDeletingBankDeal(null)}
        title="Delete Bank Deal Affiliate"
        description={`Are you sure you want to remove affiliate data from "${deletingBankDeal?.bank_name}"? This will disable tracking and remove commission settings.`}
        confirmText="Remove Affiliate"
        onConfirm={handleDeleteBankDeal}
        isDeleting={isDeleting}
      />

      <ConfirmDeleteDialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        title="Delete Affiliate Product"
        description={`Are you sure you want to delete "${deletingProduct?.product_name}"? This action cannot be undone.`}
        confirmText="Delete Product"
        onConfirm={handleDeleteProduct}
        isDeleting={isDeleting}
      />

      <AddBankDealModal
        deals={bankDeals}
        open={showAddBankDeal}
        onOpenChange={setShowAddBankDeal}
        onSave={handleAddBankDeal}
      />

      <AddProductModal
        open={showAddProduct}
        onOpenChange={setShowAddProduct}
        onSave={handleAddProduct}
      />
    </div>
  )
}