import { supabase } from '@/integrations/supabase/client';
import { logError } from './errorLogger';

/**
 * Log an audit event for the current user.
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

    await supabase.from('audit_log' as any).insert({
      user_id: user.id,
      action,
      table_name: tableName,
      record_id: recordId ?? null,
      details: details ?? {},
    });
  } catch (error) {
    logError('auditLog', error);
  }
};
