'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Download, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { AdminAuditLog } from '@/types/database'

export const dynamic = 'force-dynamic'

interface AuditLogsResponse {
  logs: AdminAuditLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function AuditLogPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AdminAuditLog[]>([])
  const [filters, setFilters] = useState({
    adminId: '',
    actionType: '',
    targetUser: '',
    dateFrom: '',
    dateTo: ''
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchLogs()
  }, [page, filters])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '100'
      })
      if (filters.adminId) params.append('adminId', filters.adminId)
      if (filters.actionType) params.append('actionType', filters.actionType)
      if (filters.targetUser) params.append('targetUser', filters.targetUser)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)

      const res = await fetch(`/api/admin/audit?${params}`)
      if (res.ok) {
        const data: AuditLogsResponse = await res.json()
        setLogs(data.logs)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch('/api/admin/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-log-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error)
      alert('Failed to export audit logs')
    }
  }

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      return date.toLocaleString('en-GB')
    } catch {
      return 'Invalid date'
    }
  }

  return (
    <DashboardLayout
      title="Audit Log"
      breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Audit Log' }]}
    >
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <div>
              <Input
                placeholder="Admin email..."
                value={filters.adminId}
                onChange={(e) => {
                  setFilters({ ...filters, adminId: e.target.value })
                  setPage(1)
                }}
              />
            </div>
            <div>
              <Input
                placeholder="Action type..."
                value={filters.actionType}
                onChange={(e) => {
                  setFilters({ ...filters, actionType: e.target.value })
                  setPage(1)
                }}
              />
            </div>
            <div>
              <Input
                placeholder="Target user..."
                value={filters.targetUser}
                onChange={(e) => {
                  setFilters({ ...filters, targetUser: e.target.value })
                  setPage(1)
                }}
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="From date..."
                value={filters.dateFrom}
                onChange={(e) => {
                  setFilters({ ...filters, dateFrom: e.target.value })
                  setPage(1)
                }}
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="To date..."
                value={filters.dateTo}
                onChange={(e) => {
                  setFilters({ ...filters, dateTo: e.target.value })
                  setPage(1)
                }}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>All admin actions are logged here</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const isExpanded = expandedRows.has(log.id)
                    return (
                      <>
                        <TableRow
                          key={log.id}
                          className="cursor-pointer"
                          onClick={() => toggleRow(log.id)}
                        >
                          <TableCell>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell>{formatDate(log.created_at)}</TableCell>
                          <TableCell>{log.admin_email || '—'}</TableCell>
                          <TableCell>{log.action_type}</TableCell>
                          <TableCell>
                            {log.target_email || log.target_id || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.result === 'success' ? 'default' : 'destructive'}>
                              {log.result}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.ip_address || '—'}</TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-muted/50">
                              <div className="p-4 space-y-2">
                                <div>
                                  <strong>Action Details:</strong>
                                  <pre className="mt-1 text-xs bg-background p-2 rounded overflow-auto">
                                    {JSON.stringify(log.action_details, null, 2)}
                                  </pre>
                                </div>
                                {log.error_message && (
                                  <div>
                                    <strong>Error:</strong>
                                    <p className="text-sm text-red-600">{log.error_message}</p>
                                  </div>
                                )}
                                {log.user_agent && (
                                  <div>
                                    <strong>User Agent:</strong>
                                    <p className="text-xs text-muted-foreground">{log.user_agent}</p>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

