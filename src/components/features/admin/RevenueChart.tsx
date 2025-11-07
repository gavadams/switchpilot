'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface RevenueDataPoint {
  month: string
  ddRevenue: number
  affiliateRevenue: number
  total: number
}

interface RevenueChartProps {
  data: RevenueDataPoint[]
  view?: 'line' | 'area'
  height?: number
}

export default function RevenueChart({ data, view = 'line', height = 300 }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Over Time</CardTitle>
        <CardDescription>Last 12 months revenue breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {view === 'area' ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `£${value.toFixed(2)}`} />
              <Legend />
              <Area
                type="monotone"
                dataKey="ddRevenue"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                name="Direct Debits"
              />
              <Area
                type="monotone"
                dataKey="affiliateRevenue"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                name="Affiliate"
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `£${value.toFixed(2)}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="ddRevenue"
                stroke="#10b981"
                strokeWidth={2}
                name="Direct Debits"
              />
              <Line
                type="monotone"
                dataKey="affiliateRevenue"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Affiliate"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

