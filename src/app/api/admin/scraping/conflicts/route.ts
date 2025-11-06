// API route for conflict resolution
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../lib/auth/admin'
import { ConflictResolver } from '../../../../../lib/scraping/conflict-resolver'

export const dynamic = 'force-dynamic'

// GET - List conflicts
export async function GET(request: NextRequest) {
  try {
    try {
      await requireAdmin()
    } catch (authError) {
      console.error('Admin auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const unresolvedOnly = searchParams.get('unresolvedOnly') === 'true'

    const resolver = new ConflictResolver()
    const report = await resolver.generateConflictReport()

    if (unresolvedOnly) {
      return NextResponse.json({ 
        conflicts: report.unresolved, 
        summary: report.summary 
      })
    }

    return NextResponse.json({
      conflicts: [...report.unresolved, ...report.resolved],
      summary: report.summary
    })
  } catch (error) {
    console.error('Conflict resolution error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Unknown error occurred' },
      { status: 500 }
    )
  }
}

// POST - Manually resolve conflict
export async function POST(request: NextRequest) {
  try {
    try {
      await requireAdmin()
    } catch (authError) {
      console.error('Admin auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { conflictId, resolution, resolvedBy } = body

    if (!conflictId || !resolution || !resolvedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: conflictId, resolution, resolvedBy' },
        { status: 400 }
      )
    }

    const resolver = new ConflictResolver()
    await resolver.manualResolve(conflictId, resolution, resolvedBy)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Manual resolve error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Unknown error occurred' },
      { status: 500 }
    )
  }
}

