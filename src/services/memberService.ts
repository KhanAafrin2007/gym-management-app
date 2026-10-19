import { supabase } from '../lib/supabase';
import { getNextId } from '../lib/idGenerator';
import type { Member } from '../types/database';

export const memberService = {
  async getMembers(filters?: {
    search?: string;
    batchId?: string;
    trainerId?: string;
    isActive?: boolean | 'all';
  }) {
    let query = supabase
      .from('member')
      .select('*, batch:batch_id(*), trainer:trainer_id(*)')
      .order('member_id', { ascending: true });

    if (filters?.isActive !== 'all' && filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters?.batchId) {
      query = query.eq('batch_id', filters.batchId);
    }

    if (filters?.trainerId) {
      query = query.eq('trainer_id', filters.trainerId);
    }

    const { data, error } = await query;
    if (error) throw error;

    let members = (data || []) as Member[];
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      members = members.filter(
        (m) =>
          m.f_name?.toLowerCase().includes(s) ||
          m.l_name?.toLowerCase().includes(s) ||
          m.member_id.toLowerCase().includes(s) ||
          m.phone_no?.includes(s) ||
          m.email?.toLowerCase().includes(s)
      );
    }
    return members;
  },

  async getMemberById(memberId: string) {
    const { data: member, error: memberErr } = await supabase
      .from('member')
      .select('*, batch:batch_id(*), trainer:trainer_id(*)')
      .eq('member_id', memberId)
      .single();

    if (memberErr) throw memberErr;

    // Fetch related detail records directly from Supabase
    const [membershipsRes, paymentsRes, attendanceRes, feedbackRes, programsRes] =
      await Promise.all([
        supabase
          .from('membership')
          .select('*, membership_plan(*)')
          .eq('member_id', memberId)
          .order('start_date', { ascending: false }),
        supabase
          .from('payment')
          .select('*')
          .eq('member_id', memberId)
          .order('payment_date', { ascending: false }),
        supabase
          .from('attendance')
          .select('*')
          .eq('member_id', memberId)
          .order('attendance_date', { ascending: false }),
        supabase
          .from('feedback')
          .select('*')
          .eq('member_id', memberId)
          .order('feedback_date', { ascending: false }),
        supabase
          .from('member_program')
          .select('*, fitness_program(*, diet_plan(*), workout_plan(*), trainer(*))')
          .eq('member_id', memberId)
          .order('assigned_date', { ascending: false }),
      ]);

    return {
      member: member as Member,
      memberships: membershipsRes.data || [],
      payments: paymentsRes.data || [],
      attendance: attendanceRes.data || [],
      feedback: feedbackRes.data || [],
      programs: programsRes.data || [],
    };
  },

  async createMember(payload: Omit<Member, 'member_id' | 'is_active'> & { is_active?: boolean }) {
    const nextId = await getNextId('member');
    const newMember = {
      ...payload,
      member_id: nextId,
      is_active: payload.is_active !== undefined ? payload.is_active : true,
      join_date: payload.join_date || new Date().toISOString().split('T')[0],
    };

    const { data, error } = await supabase.from('member').insert(newMember).select().single();
    if (error) throw error;
    return data as Member;
  },

  async updateMember(memberId: string, payload: Partial<Member>) {
    const { data, error } = await supabase
      .from('member')
      .update(payload)
      .eq('member_id', memberId)
      .select()
      .single();

    if (error) throw error;
    return data as Member;
  },

  async toggleActive(memberId: string, currentStatus: boolean) {
    return this.updateMember(memberId, { is_active: !currentStatus });
  },
};
