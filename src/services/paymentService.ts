import { supabase } from '../lib/supabase';
import { getNextId } from '../lib/idGenerator';
import type { Payment, PaymentMode, PaymentStatus } from '../types/database';

export const paymentService = {
  async getPayments(filters?: {
    memberId?: string;
    startDate?: string;
    endDate?: string;
    paymentMode?: PaymentMode | 'all';
    paymentStatus?: PaymentStatus | 'all';
  }) {
    let query = supabase
      .from('payment')
      .select('*, member(*)')
      .order('payment_date', { ascending: false });

    if (filters?.memberId) {
      query = query.eq('member_id', filters.memberId);
    }
    if (filters?.paymentMode && filters.paymentMode !== 'all') {
      query = query.eq('payment_mode', filters.paymentMode);
    }
    if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
      query = query.eq('payment_status', filters.paymentStatus);
    }
    if (filters?.startDate) {
      query = query.gte('payment_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('payment_date', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Payment[];
  },

  async getPendingPayments() {
    const { data, error } = await supabase
      .from('payment')
      .select('*, member(*)')
      .eq('payment_status', 'Pending')
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return (data || []) as Payment[];
  },

  // Member initiate payment: inserts Pending payment
  async createMemberPayment(payload: {
    member_id: string;
    amount: number;
    payment_mode: PaymentMode;
  }) {
    if (payload.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const nextId = await getNextId('payment');
    const newPayment = {
      payment_id: nextId,
      member_id: payload.member_id,
      amount: payload.amount,
      payment_mode: payload.payment_mode,
      payment_status: 'Pending' as const,
      payment_date: new Date().toISOString().split('T')[0],
    };

    const { data, error } = await supabase
      .from('payment')
      .insert(newPayment)
      .select('*, member(*)')
      .single();

    if (error) throw error;
    return data as Payment;
  },

  // Employee/Admin record desk payment: Completed immediately
  async recordDeskPayment(payload: {
    member_id: string;
    amount: number;
    payment_mode: PaymentMode;
    payment_date?: string;
  }) {
    if (payload.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const nextId = await getNextId('payment');
    const newPayment = {
      payment_id: nextId,
      member_id: payload.member_id,
      amount: payload.amount,
      payment_mode: payload.payment_mode,
      payment_status: 'Completed' as const,
      payment_date: payload.payment_date || new Date().toISOString().split('T')[0],
    };

    const { data, error } = await supabase
      .from('payment')
      .insert(newPayment)
      .select('*, member(*)')
      .single();

    if (error) throw error;
    return data as Payment;
  },

  // Staff / Admin: Confirm payment -> Completed
  async confirmPayment(paymentId: string) {
    const { data, error } = await supabase
      .from('payment')
      .update({ payment_status: 'Completed' })
      .eq('payment_id', paymentId)
      .select('*, member(*)')
      .single();

    if (error) throw error;
    return data as Payment;
  },

  // Staff / Admin: Reject payment -> Failed
  async rejectPayment(paymentId: string) {
    const { data, error } = await supabase
      .from('payment')
      .update({ payment_status: 'Failed' })
      .eq('payment_id', paymentId)
      .select('*, member(*)')
      .single();

    if (error) throw error;
    return data as Payment;
  },

  // Admin only: Refund Completed payment -> Refunded
  async refundPayment(paymentId: string) {
    const { data, error } = await supabase
      .from('payment')
      .update({ payment_status: 'Refunded' })
      .eq('payment_id', paymentId)
      .select('*, member(*)')
      .single();

    if (error) throw error;
    return data as Payment;
  },

  // Admin only: Update/correct payment
  async updatePayment(paymentId: string, payload: Partial<Payment>) {
    const { data, error } = await supabase
      .from('payment')
      .update(payload)
      .eq('payment_id', paymentId)
      .select('*, member(*)')
      .single();

    if (error) throw error;
    return data as Payment;
  },

  // Admin only: Delete payment
  async deletePayment(paymentId: string) {
    const { error } = await supabase
      .from('payment')
      .delete()
      .eq('payment_id', paymentId);

    if (error) throw error;
  },

  // Member Payment Summary view
  async getMemberPaymentSummaries() {
    const { data, error } = await supabase
      .from('member_payment_summary')
      .select('*')
      .order('total_paid', { ascending: false });

    if (error) throw error;
    return data;
  },
};
