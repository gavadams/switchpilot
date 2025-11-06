// Admin sources management page
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Search, Edit, Trash2 } from 'lucide-react'
import SourceCard from '../../../../components/features/admin/SourceCard'
import AddSourceModal from '../../../../components/features/admin/AddSourceModal'
import ConfirmDeleteDialog from '../../../../components/features/admin/ConfirmDeleteDialog'
import { ScrapingSource, ScraperConfig } from '@/types/scraping'

interface SourceFormData {
  name: string
  url: string
  priority: number
  is_active: boolean
  scraper_config: ScraperConfig
}

export const dynamic = 'force-dynamic'

export default function SourcesManagementPage() {
  const [sources, setSources] = useState<ScrapingSource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSource, setEditingSource] = useState<ScrapingSource | null>(null)
  const [deletingSource, setDeletingSource] = useState<ScrapingSource | null>(null)

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/scraping-sources')
      if (response.ok) {
        const { sources: sourcesData } = await response.json()
        setSources(sourcesData || [])
      }
    } catch (error) {
      console.error('Error fetching sources:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSave = async (data: SourceFormData) => {
    try {
      if (editingSource) {
        // Update
        const response = await fetch('/api/admin/scraping-sources', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingSource.id, ...data })
        })
        if (!response.ok) throw new Error('Failed to update source')
      } else {
        // Create
        const response = await fetch('/api/admin/scraping-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        if (!response.ok) throw new Error('Failed to create source')
      }
      await fetchSources()
      setShowAddModal(false)
      setEditingSource(null)
    } catch (error) {
      console.error('Error saving source:', error)
      alert('Failed to save source')
    }
  }

  const handleDelete = async () => {
    if (!deletingSource) return
    try {
      const response = await fetch(`/api/admin/scraping-sources?id=${deletingSource.id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete source')
      await fetchSources()
      setDeletingSource(null)
    } catch (error) {
      console.error('Error deleting source:', error)
      alert('Failed to delete source')
    }
  }

  const handleScrape = async (sourceId: string) => {
    try {
      const response = await fetch(`/api/admin/scrape?sourceId=${sourceId}`, {
        method: 'POST'
      })
      if (response.ok) {
        alert('Scraping started')
        setTimeout(() => fetchSources(), 2000)
      }
    } catch (error) {
      console.error('Error scraping:', error)
    }
  }

  const handleTest = async (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId)
    if (!source) return
    
    try {
      const response = await fetch('/api/admin/test-scrape-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: source.url,
          scraper_config: source.scraper_config
        })
      })
      const result = await response.json()
      alert(result.success ? `Test successful: Found ${result.dealsFound} deals` : `Test failed: ${result.errors.join(', ')}`)
    } catch (error) {
      alert('Test failed')
    }
  }

  const filteredSources = sources.filter(source =>
    source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    source.url.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Scraping Sources</h2>
          <p className="text-muted-foreground">Manage scraping sources and configurations</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sources..."
                className="pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Badge variant="outline">{filteredSources.length} source(s)</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No sources found matching your search' : 'No sources configured yet'}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSources.map(source => (
                <SourceCard
                  key={source.id}
                  source={source}
                  onScrape={handleScrape}
                  onEdit={setEditingSource}
                  onDelete={setDeletingSource}
                  onTest={handleTest}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddSourceModal
        open={showAddModal || !!editingSource}
        onOpenChange={open => {
          if (!open) {
            setShowAddModal(false)
            setEditingSource(null)
          }
        }}
        onSave={handleSave}
        source={editingSource || undefined}
      />

      <ConfirmDeleteDialog
        open={!!deletingSource}
        onOpenChange={open => !open && setDeletingSource(null)}
        title="Delete Scraping Source"
        description={`Are you sure you want to delete "${deletingSource?.name}"? This action cannot be undone.`}
        confirmText="Delete Source"
        onConfirm={handleDelete}
        isDeleting={false}
      />
    </div>
  )
}

