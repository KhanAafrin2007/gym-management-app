import { supabase } from '../lib/supabase';
import type { AppUser, UserRole } from '../types/database';

export const accountService = {
  async getAppUsers() {
    const { data, error } = await supabase
      .from('app_users')
      .select('*, member(*), trainer(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const users = (data || []) as AppUser[];
    return users.sort((a, b) => {
      if (a.role === 'pending' && b.role !== 'pending') return -1;
      if (a.role !== 'pending' && b.role === 'pending') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  },

  async updateUserRoleAndLinks(
    authUserId: string,
    payload: {
      role: UserRole;
      member_id?: string | null;
      trainer_id?: string | null;
    }
  ) {
    // For role = member set member_id and clear trainer_id
    // For role = employee set trainer_id and clear member_id
    // For role = admin or pending clear both
    const member_id = payload.role === 'member' ? (payload.member_id || null) : null;
    const trainer_id = payload.role === 'employee' ? (payload.trainer_id || null) : null;

    const { data, error } = await supabase
      .from('app_users')
      .update({
        role: payload.role,
        member_id,
        trainer_id,
      })
      .eq('auth_user_id', authUserId)
      .select('*, member(*), trainer(*)');

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No permission or wrong id');
    }

    return data[0] as AppUser;
  },
};
