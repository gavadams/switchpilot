'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DealsPage() {
  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Bank Switching Deals</CardTitle>
            <CardDescription>
              Discover the latest bank switching offers and rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Coming soon - Available bank deals will be displayed here with reward amounts, 
              requirements, and expiry dates.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Lloyds Bank</CardTitle>
              <CardDescription>£200 switching reward</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon - Deal details</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Halifax</CardTitle>
              <CardDescription>£175 switching reward</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon - Deal details</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>First Direct</CardTitle>
              <CardDescription>£175 switching reward</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon - Deal details</p>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
