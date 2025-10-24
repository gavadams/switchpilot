'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateRange, DatePreset } from '@/types'
import { Calendar, X } from 'lucide-react'

interface DateRangeSelectorProps {
  onDateRangeChange: (range: DateRange) => void
  className?: string
}

export default function DateRangeSelector({ onDateRangeChange, className }: DateRangeSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('last30days')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const presets: { value: DatePreset; label: string }[] = [
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'alltime', label: 'All Time' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const calculateDateRange = (preset: DatePreset): DateRange => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (preset) {
      case 'last7days':
        return {
          startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: now.toISOString()
        }
      case 'last30days':
        return {
          startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: now.toISOString()
        }
      case 'last90days':
        return {
          startDate: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: now.toISOString()
        }
      case 'alltime':
        return {
          startDate: null,
          endDate: null
        }
      case 'custom':
        return {
          startDate: customStartDate || null,
          endDate: customEndDate || null
        }
      default:
        return { startDate: null, endDate: null }
    }
  }

  const handlePresetChange = (preset: DatePreset) => {
    setSelectedPreset(preset)
    if (preset !== 'custom') {
      const range = calculateDateRange(preset)
      onDateRangeChange(range)
    }
  }

  const handleCustomApply = () => {
    if (customStartDate && customEndDate) {
      const range = {
        startDate: new Date(customStartDate).toISOString(),
        endDate: new Date(customEndDate + 'T23:59:59').toISOString()
      }
      onDateRangeChange(range)
    }
  }

  const handleClearCustom = () => {
    setCustomStartDate('')
    setCustomEndDate('')
    setSelectedPreset('last30days')
    const range = calculateDateRange('last30days')
    onDateRangeChange(range)
  }

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Date Range</Label>
          </div>

          <div className="flex flex-wrap gap-2">
            {presets.map(preset => (
              <Button
                key={preset.value}
                variant={selectedPreset === preset.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetChange(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {selectedPreset === 'custom' && (
            <div className="space-y-3 pt-2 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="text-sm">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date" className="text-sm">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    min={customStartDate}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCustomApply}
                  disabled={!customStartDate || !customEndDate}
                  size="sm"
                >
                  Apply Custom Range
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCustom}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

