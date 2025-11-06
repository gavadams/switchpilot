'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogOverlay } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, TestTube, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ScraperConfig, ScrapedDeal } from '@/types/scraping'
import { getAllTemplates, getTemplate } from '../../../lib/scraping/source-templates'

interface AddSourceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: {
    name: string
    url: string
    priority: number
    is_active: boolean
    scraper_config: ScraperConfig
  }) => Promise<void>
  source?: {
    id: string
    name: string
    url: string
    priority: number
    is_active: boolean
    scraper_config: ScraperConfig
  }
}

export default function AddSourceModal({ open, onOpenChange, onSave, source }: AddSourceModalProps) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [priority, setPriority] = useState(1)
  const [isActive, setIsActive] = useState(true)
  const [scraperConfig, setScraperConfig] = useState<ScraperConfig>({
    selectors: {
      dealContainer: '',
      bankName: '',
      rewardAmount: '',
      requirements: '',
      expiryDate: ''
    },
    parsing: {
      rewardAmountRegex: '£([0-9,]+)',
      directDebitsRegex: '([0-9]+)\\s*(?:direct debit|DD)',
      payInRegex: '(?:pay in|deposit)\\s*£([0-9,]+)',
      expiryDateFormat: 'DD/MM/YYYY'
    },
    options: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timeout: 30000,
      retryAttempts: 3
    }
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    dealsFound: number
    deals: ScrapedDeal[]
    errors: string[]
  } | null>(null)

  const templates = getAllTemplates()

  useEffect(() => {
    if (source) {
      setName(source.name)
      setUrl(source.url)
      setPriority(source.priority)
      setIsActive(source.is_active)
      setScraperConfig(source.scraper_config)
    } else {
      // Reset form
      setName('')
      setUrl('')
      setPriority(1)
      setIsActive(true)
      setTestResult(null)
    }
  }, [source, open])

  const handleTemplateSelect = (templateKey: string) => {
    const template = getTemplate(templateKey)
    if (template) {
      setScraperConfig(template.config)
    }
  }

  const handleTest = async () => {
    if (!url) {
      alert('Please enter a URL first')
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/admin/test-scrape-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          scraper_config: scraperConfig
        })
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        dealsFound: 0,
        deals: [],
        errors: [(error as Error).message || 'Test failed']
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    if (!name || !url) {
      alert('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        name,
        url,
        priority,
        is_active: isActive,
        scraper_config: scraperConfig
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving source:', error)
      alert('Failed to save source')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-neutral-200 shadow-xl">
        <DialogHeader>
          <DialogTitle>{source ? 'Edit Scraping Source' : 'Add New Scraping Source'}</DialogTitle>
          <DialogDescription>
            Configure a new scraping source with CSS selectors and parsing rules
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="selectors">Selectors</TabsTrigger>
            <TabsTrigger value="parsing">Parsing</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">Start from Template (Optional)</Label>
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.name} value={template.name.toLowerCase().replace(/\s+/g, '')}>
                      {template.name} - {template.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Source Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Scrimpr, MoneySavingExpert"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Source URL *</Label>
              <Input
                id="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/bank-deals"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority (1-10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={e => setPriority(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox id="active" checked={isActive} onCheckedChange={checked => setIsActive(!!checked)} />
                <Label htmlFor="active" className="cursor-pointer">Active</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="selectors" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              CSS selectors to locate elements on the page. Use browser DevTools to find these.
            </div>

            {Object.entries(scraperConfig.selectors).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`selector-${key}`} className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()} *
                </Label>
                <Input
                  id={`selector-${key}`}
                  value={value}
                  onChange={e =>
                    setScraperConfig({
                      ...scraperConfig,
                      selectors: { ...scraperConfig.selectors, [key]: e.target.value }
                    })
                  }
                  placeholder={`.${key.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase()}`}
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="parsing" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Regex patterns to extract data from text. Use capture groups (parentheses) for the values.
            </div>

            {Object.entries(scraperConfig.parsing).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`parsing-${key}`} className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()} *
                </Label>
                <Input
                  id={`parsing-${key}`}
                  value={value}
                  onChange={e =>
                    setScraperConfig({
                      ...scraperConfig,
                      parsing: { ...scraperConfig.parsing, [key]: e.target.value }
                    })
                  }
                  placeholder={value}
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userAgent">User Agent</Label>
              <Textarea
                id="userAgent"
                value={scraperConfig.options.userAgent}
                onChange={e =>
                  setScraperConfig({
                    ...scraperConfig,
                    options: { ...scraperConfig.options, userAgent: e.target.value }
                  })
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={scraperConfig.options.timeout}
                  onChange={e =>
                    setScraperConfig({
                      ...scraperConfig,
                      options: { ...scraperConfig.options, timeout: parseInt(e.target.value) || 30000 }
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retries">Retry Attempts</Label>
                <Input
                  id="retries"
                  type="number"
                  min="1"
                  max="10"
                  value={scraperConfig.options.retryAttempts}
                  onChange={e =>
                    setScraperConfig({
                      ...scraperConfig,
                      options: { ...scraperConfig.options, retryAttempts: parseInt(e.target.value) || 3 }
                    })
                  }
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Test Section */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Test Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Test your configuration before saving to see if it works correctly
              </p>
            </div>
            <Button onClick={handleTest} disabled={isTesting || !url}>
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Config
                </>
              )}
            </Button>
          </div>

          {testResult && (
            <div className={`p-4 rounded border ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">
                  {testResult.success ? `Success: Found ${testResult.dealsFound} deals` : 'Test Failed'}
                </span>
              </div>

              {testResult.errors.length > 0 && (
                <div className="text-sm text-red-600 mb-2">
                  <strong>Errors:</strong>
                  <ul className="list-disc list-inside">
                    {testResult.errors.map((error, idx) => <li key={idx}>{error}</li>)}
                  </ul>
                </div>
              )}

              {testResult.deals.length > 0 && (
                <div className="text-sm mt-2">
                  <strong>Preview (first {testResult.deals.length} deals):</strong>
                  <div className="mt-2 space-y-1">
                    {testResult.deals.map((deal, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border text-xs">
                        <div><strong>{deal.bankName}</strong> - £{deal.rewardAmount}</div>
                        <div className="text-muted-foreground">
                          {deal.requirements.directDebitsRequired} DDs required
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Source'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

