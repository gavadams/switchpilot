'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { SyncResult } from '@/types/scraping'

interface ScrapeProgressProps {
  isRunning: boolean
  results?: SyncResult[]
  totalSources?: number
  currentSource?: string
}

export default function ScrapeProgress({
  isRunning,
  results = [],
  totalSources = 0,
  currentSource
}: ScrapeProgressProps) {
  const completed = results.length
  const progress = totalSources > 0 ? (completed / totalSources) * 100 : 0

  if (!isRunning && results.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isRunning ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Scraping in progress...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Scraping Complete
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRunning && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress: {completed} / {totalSources} sources</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
            {currentSource && (
              <div className="text-sm text-muted-foreground mt-2">
                Currently scraping: <span className="font-medium">{currentSource}</span>
              </div>
            )}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Results:</div>
            {results.map(result => (
              <div
                key={result.sourceId}
                className="flex items-center justify-between p-2 border rounded text-sm"
              >
                <div>
                  <span className="font-medium">{result.sourceName}</span>
                  <span className="text-muted-foreground ml-2">
                    {result.dealsFound} deals found • {result.dealsAdded} added • {result.dealsUpdated} updated
                  </span>
                </div>
                {result.errors.length > 0 ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </div>
            ))}
          </div>
        )}

        {!isRunning && results.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-sm">
              <strong>Total:</strong> {results.reduce((sum, r) => sum + r.dealsFound, 0)} deals found,
              {' '}
              {results.reduce((sum, r) => sum + r.dealsAdded, 0)} added,
              {' '}
              {results.reduce((sum, r) => sum + r.dealsUpdated, 0)} updated
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

