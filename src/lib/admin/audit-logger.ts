// Audit logging system for admin actions
import { createServerSupabaseClient } from '../supabase/server'
import { AdminAuditLogInsert } from '@/types/database'
import type { NextRequest } from 'next/server'

export interface AuditLogEntry {
  actionType: string
  targetType?: string
  targetId?: string
  targetEmail?: string
  actionDetails?: Record<string, unknown>
  result?: 'success' | 'failed'
  errorMessage?: string
}

/**
 * Extract IP address and user agent from NextRequest
 */
export function extractRequestInfo(request: NextRequest | null): {
  ipAddress: string | null
  userAgent: string | null
} {
  if (!request) {
    return { ipAddress: null, userAgent: null }
  }

  // Get IP address from headers (check various headers for proxy support)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ipAddress = forwardedFor?.split(',')[0] || realIp || null

  // Get user agent
  const userAgent = request.headers.get('user-agent') || null

  return { ipAddress, userAgent }
}

/**
 * Log an admin action to the audit log
 * @param entry - Audit log entry details
 * @param request - Optional NextRequest for IP/user agent extraction
 */
export async function logAdminAction(
  entry: AuditLogEntry,
  request?: NextRequest | null
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Cannot log admin action: No authenticated user')
      return
    }

    // Get user email
    const adminEmail = user.email || null

    // Extract IP and user agent from request if provided
    const { ipAddress, userAgent } = extractRequestInfo(request || null)

    // Prepare audit log entry
    const auditLogEntry: AdminAuditLogInsert = {
      admin_id: user.id,
      admin_email: adminEmail,
      action_type: entry.actionType,
      target_type: entry.targetType || null,
      target_id: entry.targetId || null,
      target_email: entry.targetEmail || null,
      action_details: entry.actionDetails || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      result: entry.result || 'success',
      error_message: entry.errorMessage || null
    }

    // Insert into audit log
    const { error: insertError } = await supabase
      .from('admin_audit_log')
      .insert(auditLogEntry)

    if (insertError) {
      console.error('Error inserting audit log:', insertError)
      // Don't throw - audit logging failures shouldn't break the app
    }
  } catch (error) {
    console.error('Error in logAdminAction:', error)
    // Don't throw - audit logging failures shouldn't break the app
  }
}

/**
 * Helper to log successful admin actions
 */
export async function logAdminSuccess(
  actionType: string,
  options: {
    targetType?: string
    targetId?: string
    targetEmail?: string
    actionDetails?: Record<string, unknown>
    request?: NextRequest | null
  } = {}
): Promise<void> {
  await logAdminAction(
    {
      actionType,
      targetType: options.targetType,
      targetId: options.targetId,
      targetEmail: options.targetEmail,
      actionDetails: options.actionDetails,
      result: 'success'
    },
    options.request
  )
}

/**
 * Helper to log failed admin actions
 */
export async function logAdminFailure(
  actionType: string,
  errorMessage: string,
  options: {
    targetType?: string
    targetId?: string
    targetEmail?: string
    actionDetails?: Record<string, unknown>
    request?: NextRequest | null
  } = {}
): Promise<void> {
  await logAdminAction(
    {
      actionType,
      targetType: options.targetType,
      targetId: options.targetId,
      targetEmail: options.targetEmail,
      actionDetails: options.actionDetails,
      result: 'failed',
      errorMessage
    },
    options.request
  )
}

