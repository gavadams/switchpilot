import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../lib/auth/admin'
import { createServerSupabaseClient } from '../../../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - List all sources
export async function GET() {
  try {
    await requireAdmin()

    const supabase = await createServerSupabaseClient()

    const { data: sources, error } = await supabase
      .from('scraping_sources')
      .select('*')
      .order('priority', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching scraping sources:', error)
      return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 })
    }

    return NextResponse.json({ sources: sources || [] })
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// POST - Add new source
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { name, url, priority, scraper_config, is_active } = body

    // Validate required fields
    if (!name || !url || !scraper_config) {
      return NextResponse.json({ error: 'Missing required fields: name, url, scraper_config' }, { status: 400 })
    }

    // Validate scraper_config structure
    if (
      !scraper_config.selectors ||
      !scraper_config.parsing ||
      !scraper_config.options
    ) {
      return NextResponse.json(
        { error: 'Invalid scraper_config: must include selectors, parsing, and options' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('scraping_sources')
      .insert({
        name,
        url,
        priority: priority || 1,
        scraper_config,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating scraping source:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ source: data })
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// PATCH - Update source
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing source ID' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('scraping_sources')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating scraping source:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ source: data })
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// DELETE - Remove source
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing source ID' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    const { error } = await supabase.from('scraping_sources').delete().eq('id', id)

    if (error) {
      console.error('Error deleting scraping source:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

