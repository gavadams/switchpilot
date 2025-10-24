'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AffiliateProduct } from '../../../lib/supabase/affiliate-products'
import { 
  ExternalLink,
  Banknote,
  CheckCircle,
  Star,
  Clock,
  Shield,
  Coins
} from 'lucide-react'

interface AffiliateOfferModalProps {
  product: AffiliateProduct | null
  isOpen: boolean
  onClose: () => void
  onProceed: () => void
}

export default function AffiliateOfferModal({ 
  product, 
  isOpen, 
  onClose, 
  onProceed 
}: AffiliateOfferModalProps) {
  const [isTrackingClick, setIsTrackingClick] = useState(false)

  if (!product) return null

  const keyFeatures = (product.key_features as unknown as string[]) || []

  const handleProceed = async () => {
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

      // Proceed to external link
      onProceed()
    } catch (error) {
      console.error('Error tracking affiliate click:', error)
      // Still proceed even if tracking fails
      onProceed()
    } finally {
      setIsTrackingClick(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-neutral-800 mb-2">
                {product.product_name}
              </DialogTitle>
              <DialogDescription className="text-lg text-neutral-600">
                {product.provider_name}
              </DialogDescription>
            </div>
            {product.affiliate_commission > 0 && (
              <div className="bg-gradient-to-r from-success-500 to-success-600 text-white rounded-lg p-4 text-center min-w-[100px]">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Coins className="w-5 h-5" />
                  <span className="text-xl font-bold">£{product.affiliate_commission}</span>
                </div>
                <div className="text-sm font-medium opacity-90">You Earn</div>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* What You Get Section */}
          {product.affiliate_commission > 0 && (
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Banknote className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-primary-800 text-lg">What You Get</h3>
              </div>
              <div className="space-y-2">
                <p className="text-primary-700">
                  <strong>Earn £{product.affiliate_commission}</strong> when you successfully apply for this product through our link.
                </p>
                <p className="text-sm text-primary-600">
                  This reward is paid directly to you by the provider once your application is approved and you meet their terms.
                </p>
              </div>
            </div>
          )}

          {/* Product Description */}
          {product.description && (
            <div>
              <h3 className="font-semibold text-neutral-800 mb-2">About This Product</h3>
              <p className="text-neutral-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Key Features */}
          {keyFeatures.length > 0 && (
            <div>
              <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-primary-600" />
                Key Features
              </h3>
              <div className="space-y-2">
                {keyFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success-600 mt-0.5 shrink-0" />
                    <span className="text-neutral-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 border border-neutral-200 rounded-lg p-4">
            <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-neutral-600" />
              Important Terms
            </h3>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
                <span>Reward is typically paid within 30-60 days of successful application</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
                <span>You must complete the full application process to qualify</span>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
                <span>Standard provider terms and conditions apply</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleProceed}
              disabled={isTrackingClick}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold"
            >
              {isTrackingClick ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Opening...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Apply Now
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
