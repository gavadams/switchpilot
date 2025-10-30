import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrapingSource } from '@/types/scraping'
import { Play, Edit, Trash2, ExternalLink, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SourceCardProps {
  source: ScrapingSource
  onScrape: (sourceId: string) => void
  onEdit: (source: ScrapingSource) => void
  onDelete: (sourceId: string) => void
  onTest: (sourceId: string) => void
}

export default function SourceCard({
  source,
  onScrape,
  onEdit,
  onDelete,
  onTest
}: SourceCardProps) {
  const getStatusBadge = () => {
    if (!source.is_active) {
      return <Badge variant="secondary">Inactive</Badge>
    }

    switch (source.last_scrape_status) {
      case 'success':
        return (
          <Badge variant="default" className="bg-green-500/10 text-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Success
          </Badge>
        )
      case 'partial':
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Partial
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">Never Scraped</Badge>
    }
  }

  const getLastScrapedText = () => {
    if (!source.last_scraped_at) {
      return 'Never scraped'
    }
    return formatDistanceToNow(new Date(source.last_scraped_at), { addSuffix: true })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {source.name}
              <Badge variant="outline">Priority: {source.priority}</Badge>
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <ExternalLink className="h-3 w-3" />
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline truncate"
              >
                {source.url}
              </a>
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Last Scraped</div>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {getLastScrapedText()}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Deals Found</div>
              <div className="font-medium mt-1">{source.last_scrape_deals_found || 0}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button size="sm" onClick={() => onScrape(source.id)}>
              <Play className="h-4 w-4 mr-1" />
              Scrape Now
            </Button>
            <Button size="sm" variant="outline" onClick={() => onEdit(source)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => onTest(source.id)}>
              Test
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(source.id)}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

