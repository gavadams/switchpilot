'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Database } from '../../../types/supabase'
import { 
  Plus, 
  Search, 
  Edit, 
  MoreHorizontal,
  Filter,
  Download,
  Upload
} from 'lucide-react'
import AddBankAffiliateModal from '../../../components/features/admin/AddBankAffiliateModal'
import AddProductModal from '../../../components/features/admin/AddProductModal'
import QuickEditAffiliate from '../../../components/features/admin/QuickEditAffiliate'
import BulkAffiliateActions from '../../../components/features/admin/BulkAffiliateActions'
import AffiliatePreview from '../../../components/features/admin/AffiliatePreview'
// import { getAllBankDealsWithAffiliates, getAllAffiliateProducts } from '../../../lib/supabase/admin-affiliates'

type BankDeal = Database['public']['Tables']['bank_deals']['Row']
type AffiliateProduct = Database['public']['Tables']['affiliate_products']['Row']

export default function AdminAffiliatesPage() {
  const [bankDeals, setBankDeals] = useState<BankDeal[]>([])
  const [affiliateProducts, setAffiliateProducts] = useState<AffiliateProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showBankModal, setShowBankModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingDeal, setEditingDeal] = useState<BankDeal | null>(null)
  const [editingProduct, setEditingProduct] = useState<AffiliateProduct | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // TODO: Implement real data fetching
      // const [dealsData, productsData] = await Promise.all([
      //   getAllBankDealsWithAffiliates(),
      //   getAllAffiliateProducts()
      // ])
      setBankDeals([])
      setAffiliateProducts([])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBankAffiliate = () => {
    setEditingDeal(null)
    setShowBankModal(true)
  }

  const handleEditBankAffiliate = (deal: BankDeal) => {
    setEditingDeal(deal)
    setShowBankModal(true)
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setShowProductModal(true)
  }

  const handleEditProduct = (product: AffiliateProduct) => {
    setEditingProduct(product)
    setShowProductModal(true)
  }

  const filteredBankDeals = bankDeals.filter(deal =>
    deal.bank_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredProducts = affiliateProducts.filter(product =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.provider_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading affiliate data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">Affiliate Management</h1>
          <p className="text-neutral-600 mt-2">Manage bank deal and product affiliate links</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <Input
                  placeholder="Search bank deals and products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <BulkAffiliateActions
          selectedItems={selectedItems}
          onClearSelection={() => setSelectedItems([])}
          onBulkAction={(action) => {
            console.log('Bulk action:', action, selectedItems)
            // TODO: Implement bulk actions
          }}
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="bank-deals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bank-deals">Bank Deals ({bankDeals.length})</TabsTrigger>
          <TabsTrigger value="products">Products ({affiliateProducts.length})</TabsTrigger>
        </TabsList>

        {/* Bank Deals Tab */}
        <TabsContent value="bank-deals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bank Deal Affiliates</CardTitle>
                  <CardDescription>
                    Manage affiliate links for bank switching deals
                  </CardDescription>
                </div>
                <Button onClick={handleAddBankAffiliate} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Affiliate Link
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredBankDeals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-600 mb-4">No bank deals found</p>
                  <Button onClick={handleAddBankAffiliate}>
                    Add First Affiliate Link
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.length === filteredBankDeals.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems(filteredBankDeals.map(deal => deal.id))
                              } else {
                                setSelectedItems([])
                              }
                            }}
                          />
                        </th>
                        <th className="text-left p-3 font-medium">Bank Name</th>
                        <th className="text-left p-3 font-medium">Current Reward</th>
                        <th className="text-left p-3 font-medium">Affiliate URL</th>
                        <th className="text-left p-3 font-medium">Provider</th>
                        <th className="text-left p-3 font-medium">Commission</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBankDeals.map((deal) => (
                        <tr key={deal.id} className="border-b hover:bg-neutral-50">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(deal.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItems([...selectedItems, deal.id])
                                } else {
                                  setSelectedItems(selectedItems.filter(id => id !== deal.id))
                                }
                              }}
                            />
                          </td>
                          <td className="p-3 font-medium">{deal.bank_name}</td>
                          <td className="p-3">£{deal.reward_amount}</td>
                          <td className="p-3">
                            {deal.affiliate_url ? (
                              <QuickEditAffiliate
                                value={deal.affiliate_url}
                                onSave={(newValue) => {
                                  // TODO: Update affiliate URL
                                  console.log('Update URL:', deal.id, newValue)
                                }}
                                type="url"
                              />
                            ) : (
                              <span className="text-neutral-400">No affiliate link</span>
                            )}
                          </td>
                          <td className="p-3">
                            {deal.affiliate_provider || (
                              <span className="text-neutral-400">Not set</span>
                            )}
                          </td>
                          <td className="p-3">
                            {deal.commission_rate ? (
                              <QuickEditAffiliate
                                value={deal.commission_rate.toString()}
                                onSave={(newValue) => {
                                  // TODO: Update commission
                                  console.log('Update commission:', deal.id, newValue)
                                }}
                                type="number"
                              />
                            ) : (
                              <span className="text-neutral-400">Not set</span>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge variant={deal.tracking_enabled ? "default" : "secondary"}>
                              {deal.tracking_enabled ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditBankAffiliate(deal)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AffiliatePreview
                                type="bank_deal"
                                id={deal.id}
                                name={deal.bank_name}
                                url={deal.affiliate_url || ''}
                              />
                              <Button size="sm" variant="outline">
                                <MoreHorizontal className="w-4 h-4" />
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

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Affiliate Products</CardTitle>
                  <CardDescription>
                    Manage affiliate products and their commission rates
                  </CardDescription>
                </div>
                <Button onClick={handleAddProduct} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Product
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-600 mb-4">No affiliate products found</p>
                  <Button onClick={handleAddProduct}>
                    Add First Product
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.length === filteredProducts.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems(filteredProducts.map(product => product.id))
                              } else {
                                setSelectedItems([])
                              }
                            }}
                          />
                        </th>
                        <th className="text-left p-3 font-medium">Product Type</th>
                        <th className="text-left p-3 font-medium">Provider</th>
                        <th className="text-left p-3 font-medium">Product Name</th>
                        <th className="text-left p-3 font-medium">Affiliate URL</th>
                        <th className="text-left p-3 font-medium">Commission</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-neutral-50">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(product.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItems([...selectedItems, product.id])
                                } else {
                                  setSelectedItems(selectedItems.filter(id => id !== product.id))
                                }
                              }}
                            />
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">
                              {product.product_type.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium">{product.provider_name}</td>
                          <td className="p-3">{product.product_name}</td>
                          <td className="p-3">
                            <QuickEditAffiliate
                              value={product.affiliate_url}
                              onSave={(newValue) => {
                                // TODO: Update affiliate URL
                                console.log('Update URL:', product.id, newValue)
                              }}
                              type="url"
                            />
                          </td>
                          <td className="p-3">
                            <QuickEditAffiliate
                              value={product.affiliate_commission.toString()}
                              onSave={(newValue) => {
                                // TODO: Update commission
                                console.log('Update commission:', product.id, newValue)
                              }}
                              type="number"
                            />
                          </td>
                          <td className="p-3">
                            <Badge variant={product.is_active ? "default" : "secondary"}>
                              {product.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AffiliatePreview
                                type="product"
                                id={product.id}
                                name={product.product_name}
                                url={product.affiliate_url}
                              />
                              <Button size="sm" variant="outline">
                                <MoreHorizontal className="w-4 h-4" />
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
      <AddBankAffiliateModal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        deal={editingDeal}
        onSave={(data) => {
          console.log('Save bank affiliate:', data)
          setShowBankModal(false)
          fetchData()
        }}
      />

      <AddProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        product={editingProduct}
        onSave={(data) => {
          console.log('Save product:', data)
          setShowProductModal(false)
          fetchData()
        }}
      />
    </div>
  )
}
