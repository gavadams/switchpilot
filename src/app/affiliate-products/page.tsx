'use client'

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AffiliateProduct, getAffiliateProducts, getProductTypes, searchAffiliateProducts } from '../../lib/supabase/affiliate-products'
import ProductCard from '../../components/features/affiliate/ProductCard'
import { 
  Search, 
  Grid, 
  Package, 
  TrendingUp, 
  DollarSign,
  Info,
  CheckCircle,
  ExternalLink
} from 'lucide-react'

export default function AffiliateProductsPage() {
  const [products, setProducts] = useState<AffiliateProduct[]>([])
  const [productTypes, setProductTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')

  // Fetch products and types
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [productsData, typesData] = await Promise.all([
          getAffiliateProducts(),
          getProductTypes()
        ])
        
        setProducts(productsData)
        setProductTypes(['all', ...typesData])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handle search
  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      // Reset to all products
      try {
        const allProducts = await getAffiliateProducts()
        setProducts(allProducts)
      } catch (err) {
        console.error('Error fetching all products:', err)
      }
      return
    }

    try {
      const searchResults = await searchAffiliateProducts(term)
      setProducts(searchResults)
    } catch (err) {
      console.error('Error searching products:', err)
    }
  }

  // Handle type filter
  const handleTypeFilter = async (type: string) => {
    setSelectedType(type)
    try {
      const filteredProducts = await getAffiliateProducts(type === 'all' ? undefined : type)
      setProducts(filteredProducts)
    } catch (err) {
      console.error('Error filtering products:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-neutral-600">Loading products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-4">
            Recommended Financial Products
          </h1>
        </div>
        
        <Card className="card-professional border-0">
          <CardContent className="text-center py-12">
            <p className="text-neutral-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-4">
          Recommended Financial Products
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Discover great financial products and services. We earn a small commission when you apply through our links, helping us keep SwitchPilot free.
        </p>
      </div>

      {/* Search and Filter */}
      <Card className="card-professional border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <Input
                  placeholder="Search products or providers..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    handleSearch(e.target.value)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {productTypes.map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTypeFilter(type)}
                  className="capitalize"
                >
                  {type === 'all' ? 'All Products' : type.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Affiliate Disclosure */}
      <Card className="card-professional border-0 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Affiliate Disclosure</h4>
              <p className="text-sm text-blue-700 mb-3">
                SwitchPilot earns commission when you click through and apply for products via our affiliate links. 
                This comes at no extra cost to you and helps us keep the platform free.
              </p>
              <div className="flex items-center gap-4 text-xs text-blue-600">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>No extra cost to you</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Helps keep platform free</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Same products, better deals</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* No Results */}
      {products.length === 0 && (
        <Card className="card-professional border-0">
          <CardContent className="text-center py-12">
            <Package className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">No products found</h3>
            <p className="text-neutral-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'No products available in this category'}
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  handleSearch('')
                }}
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {products.length > 0 && (
        <Card className="card-professional border-0">
          <CardContent className="text-center py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-bold text-primary-600 mb-1">{products.length}</div>
                <p className="text-sm text-neutral-600">Available Products</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-success-600 mb-1">
                  {productTypes.length - 1}
                </div>
                <p className="text-sm text-neutral-600">Product Categories</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent-600 mb-1">
                  £{Math.max(...products.map(p => p.affiliate_commission || 0), 0)}
                </div>
                <p className="text-sm text-neutral-600">Highest Commission</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
