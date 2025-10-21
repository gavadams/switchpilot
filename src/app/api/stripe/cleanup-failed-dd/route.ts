import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

interface CleanupFailedDDRequest {
  dd_id: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dd_id }: CleanupFailedDDRequest = await request.json()

    if (!dd_id) {
      return NextResponse.json({ error: 'Missing DD ID' }, { status: 400 })
    }

    // Verify the DD belongs to the user
    const { data: directDebit, error: ddError } = await supabase
      .from('direct_debits')
      .select('id, user_id, status')
      .eq('id', dd_id)
      .eq('user_id', user.id)
      .single()

    if (ddError || !directDebit) {
      return NextResponse.json({ error: 'Direct Debit not found' }, { status: 404 })
    }

    // Only clean up if DD is still pending (payment failed before completion)
    if (directDebit.status === 'pending') {
      // Delete the failed DD record
      const { error: deleteError } = await supabase
        .from('direct_debits')
        .delete()
        .eq('id', dd_id)

      if (deleteError) {
        console.error('Error deleting failed DD:', deleteError)
        return NextResponse.json({ error: 'Failed to cleanup DD' }, { status: 500 })
      }

      console.log('Cleaned up failed DD:', dd_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cleaning up failed DD:', error)
    return NextResponse.json({ error: 'Failed to cleanup DD' }, { status: 500 })
  }
}
