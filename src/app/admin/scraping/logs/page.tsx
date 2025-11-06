'use client'

// Admin scraping logs page  - View scraping history and results

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { ScrapingLog } from '@/types/scraping'

export const dynamic = 'force-dynamic'

export default function ScrapingLogsPage() {
  const [logs, setLogs] = useState<ScrapingLog[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [page, sourceFilter, statusFilter])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      let url = `/api/admin/scraping/logs?page=${page}&limit=20`
      if (sourceFilter !== 'all') url += `&sourceId=${sourceFilter}`
      if (statusFilter !== 'all') url += `&status=${statusFilter}`

      const response = await fetch(url, {
        credentials: 'include'
      })
      console.log('Logs response:', response.status, response.statusText)
      if (response.ok) {
        const data = await response.json()
        console.log('Logs data:', data)
        setLogs(data.logs || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch logs:', response.status, errorText)
        // Show user-friendly error message
        alert(`Failed to load logs: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-700">Success</Badge>
      case 'partial':
        return <Badge className="bg-yellow-500/10 text-yellow-700">Partial</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Scraping Logs</h2>
        <p className="text-muted-foreground">View scraping history and results</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {/* Add dynamic source list if needed */}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No logs found</div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="border rounded">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleExpand(log.id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div>
                        {expandedLogs.has(log.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{log.source_name || 'Unknown Source'}</div>
                        <div className="text-sm text-muted-foreground">
                          {mounted && log.created_at ? (() => {
                            try {
                              const date = new Date(log.created_at)
                              if (isNaN(date.getTime())) return 'Invalid date'
                              return date.toLocaleString()
                            } catch {
                              return 'Invalid date'
                            }
                          })() : log.created_at ? 'Loading...' : 'No date'}
                        </div>
                      </div>
                      <div className="text-sm">
                        {log.deals_found} found • {log.deals_added} added • {log.deals_updated} updated
                      </div>
                      <div>{getStatusBadge(log.status)}</div>
                    </div>
                  </div>
                  {expandedLogs.has(log.id) && (
                    <div className="p-4 border-t bg-muted/30">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Duration:</strong> {log.duration_seconds || 0}s
                        </div>
                        <div>
                          <strong>Deals Deactivated:</strong> {log.deals_deactivated || 0}
                        </div>
                        {log.error_message && (
                          <div className="col-span-2">
                            <strong>Error:</strong> <span className="text-red-600">{log.error_message}</span>
                          </div>
                        )}
                      </div>
                      {log.scrape_data && (
                        <div className="mt-4">
                          <strong>Full Data:</strong>
                          <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto max-h-48">
                            {JSON.stringify(log.scrape_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

