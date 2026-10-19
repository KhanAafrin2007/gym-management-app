import { supabase } from '../lib/supabase';
import type { AuditLog } from '../types/database';

export const auditService = {
  async getAuditLogs(filters?: { table_name?: string; action?: string; limit?: number }) {
    let query = supabase
      .from('audit_log')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(filters?.limit || 100);

    if (filters?.table_name && filters.table_name !== 'all') {
      query = query.eq('table_name', filters.table_name);
    }

    if (filters?.action && filters.action !== 'all') {
      query = query.eq('action', filters.action);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AuditLog[];
  },
};
