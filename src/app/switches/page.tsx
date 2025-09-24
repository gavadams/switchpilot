'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function SwitchesPage() {
  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Bank Switches</CardTitle>
            <CardDescription>
              Track your current and completed bank switching activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Coming soon - Your active and completed bank switches will be displayed here 
              with progress tracking and status updates.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lloyds Bank Switch</CardTitle>
                  <CardDescription>Started 2 days ago</CardDescription>
                </div>
                <Badge variant="secondary">In Progress</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon - Switch progress and steps</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Halifax Switch</CardTitle>
                  <CardDescription>Completed 1 week ago</CardDescription>
                </div>
                <Badge variant="default">Completed</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon - Switch details and earnings</p>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
