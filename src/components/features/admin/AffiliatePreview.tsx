'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '../../ui/toast'
import { 
  Eye, 
  ExternalLink, 
  Edit, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Smartphone,
  Monitor
} from 'lucide-react'

interface AffiliatePreviewProps {
  type: 'bank_deal' | 'product'
  id: string
  name: string
  url: string
}

export default function AffiliatePreview({
  type,
  id,
  name,
  url
}: AffiliatePreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'warning' | 'error'
    message: string
  } | null>(null)
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const { addToast } = useToast()

  const handleTestLink = async () => {
    if (!url) {
      addToast({
        title: "No URL",
        description: "No affiliate URL to test",
        variant: "error"
      })
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      // Simulate link testing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock test result
      const isWorking = Math.random() > 0.3 // 70% chance of working
      
      if (isWorking) {
        setTestResult({
          status: 'success',
          message: 'Link is working correctly'
        })
      } else {
        setTestResult({
          status: 'warning',
          message: 'Link redirects to different URL'
        })
      }
    } catch (err) {
      setTestResult({
        status: 'error',
        message: 'Link is broken or inaccessible'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleOpenLink = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const getTestResultIcon = () => {
    if (!testResult) return null
    
    switch (testResult.status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
    }
  }

  const getTestResultColor = () => {
    if (!testResult) return ''
    
    switch (testResult.status) {
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Eye className="w-4 h-4" />
        Preview
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Affiliate Preview
            </DialogTitle>
            <DialogDescription>
              Preview how this {type === 'bank_deal' ? 'bank deal' : 'product'} appears to users
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Preview Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('desktop')}
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  Desktop
                </Button>
                <Button
                  variant={viewMode === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('mobile')}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Mobile
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestLink}
                  disabled={isTesting || !url}
                  className="gap-2"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  {isTesting ? 'Testing...' : 'Test Link'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenLink}
                  disabled={!url}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Link
                </Button>
              </div>
            </div>

            {/* Test Results */}
            {testResult && (
              <Card className={`border-l-4 ${
                testResult.status === 'success' ? 'border-green-500' :
                testResult.status === 'warning' ? 'border-yellow-500' :
                'border-red-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    {getTestResultIcon()}
                    <span className={`font-medium ${getTestResultColor()}`}>
                      {testResult.message}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preview Content */}
            <div className={`border rounded-lg p-4 ${
              viewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
            }`}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{name}</h3>
                    <p className="text-sm text-neutral-600">
                      {type === 'bank_deal' ? 'Bank Switching Deal' : 'Affiliate Product'}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {type === 'bank_deal' ? 'Bank Deal' : 'Product'}
                  </Badge>
                </div>

                {/* Affiliate Link Section */}
                {url && (
                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="w-4 h-4 text-primary-600" />
                      <span className="font-semibold text-primary-800">
                        {type === 'bank_deal' ? 'Apply Now' : 'Get This Product'}
                      </span>
                    </div>
                    <p className="text-sm text-primary-700 mb-3">
                      {type === 'bank_deal' 
                        ? 'Use our referral link to apply for this bank account and get the best deal.'
                        : 'Click to view this product and earn commission through our link.'
                      }
                    </p>
                    <Button
                      className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                      onClick={handleOpenLink}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {type === 'bank_deal' ? 'Apply Now' : 'View Product'}
                    </Button>
                  </div>
                )}

                {/* Commission Info */}
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">Commission:</span>
                    <span className="font-medium">£0.00</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">Status:</span>
                    <Badge variant="default" className="text-xs">Active</Badge>
                  </div>
                </div>

                {/* Click Tracking Info */}
                <div className="text-xs text-neutral-500">
                  <p>• Clicks will be tracked automatically</p>
                  <p>• Commission earned on successful conversions</p>
                  <p>• Link opens in new tab for user convenience</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-neutral-600">
                ID: {id}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
