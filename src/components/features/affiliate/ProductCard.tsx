'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '../../ui/toast'
import { AffiliateProduct } from '../../../lib/supabase/affiliate-products'
import { 
  ExternalLink,
  DollarSign,
  CheckCircle,
  Star,
  TrendingUp
} from 'lucide-react'

interface ProductCardProps {
  product: AffiliateProduct
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isTrackingClick, setIsTrackingClick] = useState(false)
  const { addToast } = useToast()

  const handleAffiliateClick = async () => {
    if (!product.affiliate_url) return

    setIsTrackingClick(true)
    try {
      // Track the click
      await fetch('/api/affiliate/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clickType: 'affiliate_product',
          referenceId: product.id
        })
      })

      // Show success toast
      addToast({
        title: "Click tracked!",
        description: "Opening product page...",
        variant: "success",
        duration: 3000
      })

      // Open affiliate link in new tab
      window.open(product.affiliate_url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Error tracking affiliate click:', error)
      
      // Show error toast but still open the link
      addToast({
        title: "Tracking failed",
        description: "Opening product page anyway...",
        variant: "warning",
        duration: 3000
      })
      
      // Still open the link even if tracking fails
      window.open(product.affiliate_url, '_blank', 'noopener,noreferrer')
    } finally {
      setIsTrackingClick(false)
    }
  }

  const getProductTypeColor = (type: string) => {
    const colors = {
      credit_card: 'bg-blue-50 text-blue-700 border-blue-200',
      savings_account: 'bg-green-50 text-green-700 border-green-200',
      investment: 'bg-purple-50 text-purple-700 border-purple-200',
      loan: 'bg-orange-50 text-orange-700 border-orange-200',
      mortgage: 'bg-red-50 text-red-700 border-red-200',
      insurance: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      other: 'bg-gray-50 text-gray-700 border-gray-200'
    }
    return colors[type as keyof typeof colors] || colors.other
  }

  const getProductTypeIcon = (type: string) => {
    const icons = {
      credit_card: '💳',
      savings_account: '💰',
      investment: '📈',
      loan: '🏦',
      mortgage: '🏠',
      insurance: '🛡️',
      other: '📋'
    }
    return icons[type as keyof typeof icons] || icons.other
  }

  const keyFeatures = (product.key_features as unknown as string[]) || []

  return (
    <Card className="card-professional border-0 h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getProductTypeIcon(product.product_type)}</span>
              <Badge 
                variant="outline" 
                className={`text-xs ${getProductTypeColor(product.product_type)}`}
              >
                {product.product_type.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <CardTitle className="text-xl font-bold text-neutral-800 mb-2 break-words">
              {product.product_name}
            </CardTitle>
            <CardDescription className="text-neutral-600 break-words">
              {product.provider_name}
            </CardDescription>
          </div>
          {product.affiliate_commission > 0 && (
            <Badge 
              variant="outline" 
              className="bg-gradient-to-r from-success-50 to-success-100 text-success-700 border-success-200 shrink-0"
            >
              <DollarSign className="w-3 h-3 mr-1" />
              £{product.affiliate_commission}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Description */}
        {product.description && (
          <div className="mb-4">
            <p className="text-sm text-neutral-600 leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* Key Features */}
        {keyFeatures.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="font-semibold text-neutral-800 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary-600" />
              Key Features
            </h4>
            <div className="space-y-2">
              {keyFeatures.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success-600 mt-0.5 shrink-0" />
                  <span className="text-sm text-neutral-700">{feature}</span>
                </div>
              ))}
              {keyFeatures.length > 3 && (
                <p className="text-xs text-neutral-500">
                  +{keyFeatures.length - 3} more features
                </p>
              )}
            </div>
          </div>
        )}

        {/* Affiliate Provider Badge */}
        {product.affiliate_provider && (
          <div className="mb-4">
            <Badge 
              variant="outline" 
              className="bg-gradient-to-r from-accent-50 to-accent-100 text-accent-700 border-accent-200"
            >
              <DollarSign className="w-3 h-3 mr-1" />
              {product.affiliate_provider} • £{product.affiliate_commission || 0} commission
            </Badge>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-auto">
          <Button 
            onClick={handleAffiliateClick}
            disabled={isTrackingClick}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3"
          >
            {isTrackingClick ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Opening...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Learn More
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
