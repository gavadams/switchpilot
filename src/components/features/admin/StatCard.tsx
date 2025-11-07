'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  change?: {
    value: number
    label: string
  }
  icon?: React.ReactNode
  onClick?: () => void
}

export default function StatCard({
  title,
  value,
  description,
  change,
  icon,
  onClick
}: StatCardProps) {
  const isPositive = change && change.value > 0
  const isNegative = change && change.value < 0
  const isNeutral = change && change.value === 0

  return (
    <Card 
      className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {change && (
          <div className="flex items-center mt-2 text-xs">
            {isPositive && <ArrowUp className="h-3 w-3 text-green-600 mr-1" />}
            {isNegative && <ArrowDown className="h-3 w-3 text-red-600 mr-1" />}
            {isNeutral && <Minus className="h-3 w-3 text-muted-foreground mr-1" />}
            <span className={isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'}>
              {change.value > 0 ? '+' : ''}{change.value}% {change.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

