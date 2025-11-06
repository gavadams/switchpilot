'use client'

// Admin scraping conflicts page - Resolve data conflicts between sources

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { Conflict } from '@/types/scraping'

export const dynamic = 'force-dynamic'

interface ConflictReport {
  conflicts: Conflict[]
  summary: {
    total: number
    unresolved: number
    resolved: number
  }
}

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [summary, setSummary] = useState({ total: 0, unresolved: 0, resolved: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved')
  const [resolving, setResolving] = useState<string | null>(null)

  useEffect(() => {
    fetchConflicts()
  }, [filter])

  const fetchConflicts = async () => {
    try {
      setLoading(true)
      const url = `/api/admin/scraping/conflicts${filter === 'unresolved' ? '?unresolvedOnly=true' : ''}`
      const response = await fetch(url, { credentials: 'include' })
      
      if (response.ok) {
        const data: ConflictReport = await response.json()
        setConflicts(data.conflicts || [])
        setSummary(data.summary || { total: 0, unresolved: 0, resolved: 0 })
      } else {
        console.error('Failed to fetch conflicts:', response.status)
      }
    } catch (error) {
      console.error('Error fetching conflicts:', error)
    } finally {
      setLoading(false)
    }
  }

  const resolveConflict = async (conflictId: string, resolution: 'sourceA' | 'sourceB') => {
    try {
      setResolving(conflictId)
      const response = await fetch('/api/admin/scraping/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conflictId,
          resolution,
          resolvedBy: 'admin' // TODO: Get actual admin user ID
        })
      })

      if (response.ok) {
        await fetchConflicts()
      } else {
        alert('Failed to resolve conflict')
      }
    } catch (error) {
      console.error('Error resolving conflict:', error)
      alert('Failed to resolve conflict')
    } finally {
      setResolving(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No expiry'
    try {
      return new Date(dateString).toLocaleDateString('en-GB')
    } catch {
      return 'Invalid date'
    }
  }

  if (loading && conflicts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Source Conflicts</h2>
        <p className="text-muted-foreground">Resolve data conflicts between multiple scraping sources</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conflicts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.unresolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unresolved')}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter conflicts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conflicts</SelectItem>
                  <SelectItem value="unresolved">Unresolved Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchConflicts} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {conflicts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filter === 'unresolved' ? 'No unresolved conflicts' : 'No conflicts found'}
            </div>
          ) : (
            <div className="space-y-4">
              {conflicts.map((conflict) => (
                <Card key={conflict.id} className={conflict.resolved ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{conflict.bankName}</CardTitle>
                        <CardDescription>
                          Conflict between {conflict.sourceA.sourceName} and {conflict.sourceB.sourceName}
                        </CardDescription>
                      </div>
                      {conflict.resolved ? (
                        <Badge className="bg-green-500/10 text-green-700">Resolved</Badge>
                      ) : (
                        <Badge variant="destructive">Unresolved</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {/* Source A */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{conflict.sourceA.sourceName}</div>
                          <Badge variant="outline">Priority: {conflict.sourceA.priority}</Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>Reward: {formatCurrency(conflict.sourceA.data.rewardAmount)}</div>
                          <div>Direct Debits: {conflict.sourceA.data.requiredDirectDebits}</div>
                          <div>Min Pay In: {formatCurrency(conflict.sourceA.data.minPayIn)}</div>
                          <div>Expiry: {formatDate(conflict.sourceA.data.expiryDate)}</div>
                        </div>
                      </div>

                      {/* Source B */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{conflict.sourceB.sourceName}</div>
                          <Badge variant="outline">Priority: {conflict.sourceB.priority}</Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>Reward: {formatCurrency(conflict.sourceB.data.rewardAmount)}</div>
                          <div>Direct Debits: {conflict.sourceB.data.requiredDirectDebits}</div>
                          <div>Min Pay In: {formatCurrency(conflict.sourceB.data.minPayIn)}</div>
                          <div>Expiry: {formatDate(conflict.sourceB.data.expiryDate)}</div>
                        </div>
                      </div>
                    </div>

                    {!conflict.resolved && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => resolveConflict(conflict.id, 'sourceA')}
                          disabled={resolving === conflict.id}
                          variant={conflict.sourceA.priority > conflict.sourceB.priority ? 'default' : 'outline'}
                          size="sm"
                        >
                          {resolving === conflict.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Use {conflict.sourceA.sourceName}
                          {conflict.sourceA.priority > conflict.sourceB.priority && ' (Higher Priority)'}
                        </Button>
                        <Button
                          onClick={() => resolveConflict(conflict.id, 'sourceB')}
                          disabled={resolving === conflict.id}
                          variant={conflict.sourceB.priority > conflict.sourceA.priority ? 'default' : 'outline'}
                          size="sm"
                        >
                          {resolving === conflict.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Use {conflict.sourceB.sourceName}
                          {conflict.sourceB.priority > conflict.sourceA.priority && ' (Higher Priority)'}
                        </Button>
                      </div>
                    )}

                    {conflict.resolved && conflict.resolvedAt && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Resolved {new Date(conflict.resolvedAt).toLocaleString()} by {conflict.resolvedBy || 'System'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

