import { supabase } from '../lib/supabase';
import { getNextId } from '../lib/idGenerator';
import type { Feedback } from '../types/database';

export const feedbackService = {
  async getAllFeedback() {
    const { data, error } = await supabase
      .from('feedback')
      .select('*, member(*, trainer(*), batch(*))')
      .order('feedback_date', { ascending: false });

    if (error) throw error;
    return (data || []) as Feedback[];
  },

  async getMemberFeedback(memberId: string) {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('member_id', memberId)
      .order('feedback_date', { ascending: false });

    if (error) throw error;
    return (data || []) as Feedback[];
  },

  async submitFeedback(payload: {
    member_id: string;
    ratings: number;
    comments?: string;
  }) {
    if (payload.ratings < 1 || payload.ratings > 5) {
      throw new Error('Rating must be between 1 and 5 stars');
    }

    const nextId = await getNextId('feedback');
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        feedback_id: nextId,
        member_id: payload.member_id,
        ratings: payload.ratings,
        comments: payload.comments || null,
        feedback_date: today,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Feedback;
  },
};
