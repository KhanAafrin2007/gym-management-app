import { supabase } from '../lib/supabase';
import { getNextId } from '../lib/idGenerator';
import type { Membership, MembershipPlan, ExpiringMembershipView } from '../types/database';

export const membershipService = {
  // Plans
  async getPlans() {
    const { data, error } = await supabase
      .from('membership_plan')
      .select('*')
      .order('plan_id');

    if (error) throw error;
    return (data || []) as MembershipPlan[];
  },

  async createPlan(payload: Omit<MembershipPlan, 'plan_id'>) {
    const nextId = await getNextId('membership_plan');
    const newPlan = {
      ...payload,
      plan_id: nextId,
    };
    const { data, error } = await supabase
      .from('membership_plan')
      .insert(newPlan)
      .select()
      .single();

    if (error) throw error;
    return data as MembershipPlan;
  },

  async updatePlan(planId: string, payload: Partial<MembershipPlan>) {
    const { data, error } = await supabase
      .from('membership_plan')
      .update(payload)
      .eq('plan_id', planId)
      .select()
      .single();

    if (error) throw error;
    return data as MembershipPlan;
  },

  // Memberships
  async getMemberships(filters?: { memberId?: string; status?: string }) {
    let query = supabase
      .from('membership')
      .select('*, member(*), membership_plan(*)')
      .order('start_date', { ascending: false });

    if (filters?.memberId) {
      query = query.eq('member_id', filters.memberId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Membership[];
  },

  async getExpiringMemberships() {
    const { data, error } = await supabase
      .from('expiring_memberships')
      .select('*')
      .order('days_left', { ascending: true });

    if (error) throw error;
    return (data || []) as ExpiringMembershipView[];
  },

  async createMembership(payload: {
    member_id: string;
    plan_id: string;
    start_date?: string;
    duration_months?: number;
  }) {
    const nextId = await getNextId('membership');
    const startDate = payload.start_date || new Date().toISOString().split('T')[0];

    // Compute end date based on duration
    let duration = payload.duration_months;
    if (!duration) {
      // fetch plan duration
      const { data: plan } = await supabase
        .from('membership_plan')
        .select('duration')
        .eq('plan_id', payload.plan_id)
        .single();
      duration = plan?.duration || 1;
    }

    const startObj = new Date(startDate);
    const endObj = new Date(startObj);
    endObj.setMonth(endObj.getMonth() + duration);
    endObj.setDate(endObj.getDate() - 1);
    const endDate = endObj.toISOString().split('T')[0];

    const newMembership = {
      membership_id: nextId,
      member_id: payload.member_id,
      plan_id: payload.plan_id,
      start_date: startDate,
      end_date: endDate,
      status: 'Active' as const,
    };

    const { data, error } = await supabase
      .from('membership')
      .insert(newMembership)
      .select('*, member(*), membership_plan(*)')
      .single();

    if (error) throw error;
    return data as Membership;
  },

  async cancelMembership(membershipId: string) {
    const { data, error } = await supabase
      .from('membership')
      .update({ status: 'Cancelled' })
      .eq('membership_id', membershipId)
      .select()
      .single();

    if (error) throw error;
    return data as Membership;
  },

  async expireMembershipsRpc() {
    const { data, error } = await supabase.rpc('expire_memberships');
    if (error) throw error;
    return data as number;
  },
};
