import { supabase } from '@/integrations/supabase/client';
import { logError } from './errorLogger';

/**
 * Log an audit event for the current user.
 * Routes through a SECURITY DEFINER RPC so users cannot forge entries.
 * Non-blocking — errors are logged but not thrown.
 */
export const logAuditEvent = async (
  action: string,
  tableName: string,
  recordId?: string,
  details?: Record<string, unknown>
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase.rpc as any)('log_audit_event', {
      _action: action,
      _table_name: tableName,
      _record_id: recordId ?? null,
      _details: details ?? {},
    });
  } catch (error) {
    logError('auditLog', error);
  }
};
