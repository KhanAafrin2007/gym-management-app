import { supabase } from '../lib/supabase';
import { getNextId } from '../lib/idGenerator';
import type { Trainer } from '../types/database';

export const trainerService = {
  async getTrainers(includeInactive = true) {
    let query = supabase.from('trainer').select('*').order('trainer_id');
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    const { data: trainers, error } = await query;
    if (error) throw error;

    // Get count of members per trainer
    const { data: members, error: memErr } = await supabase
      .from('member')
      .select('trainer_id, is_active');

    if (memErr) throw memErr;

    const countMap: Record<string, { total: number; active: number }> = {};
    (members || []).forEach((m) => {
      if (m.trainer_id) {
        if (!countMap[m.trainer_id]) {
          countMap[m.trainer_id] = { total: 0, active: 0 };
        }
        countMap[m.trainer_id].total += 1;
        if (m.is_active) {
          countMap[m.trainer_id].active += 1;
        }
      }
    });

    return (trainers || []).map((t) => ({
      ...t,
      memberCount: countMap[t.trainer_id]?.active ?? 0,
      totalMemberCount: countMap[t.trainer_id]?.total ?? 0,
    })) as (Trainer & { memberCount: number; totalMemberCount: number })[];
  },

  async createTrainer(payload: Omit<Trainer, 'trainer_id' | 'is_active'> & { is_active?: boolean }) {
    const nextId = await getNextId('trainer');
    const newTrainer = {
      ...payload,
      trainer_id: nextId,
      is_active: payload.is_active !== undefined ? payload.is_active : true,
    };

    const { data, error } = await supabase.from('trainer').insert(newTrainer).select().single();
    if (error) throw error;
    return data as Trainer;
  },

  async updateTrainer(trainerId: string, payload: Partial<Trainer>) {
    const { data, error } = await supabase
      .from('trainer')
      .update(payload)
      .eq('trainer_id', trainerId)
      .select()
      .single();

    if (error) throw error;
    return data as Trainer;
  },

  async toggleActive(trainerId: string, currentStatus: boolean) {
    return this.updateTrainer(trainerId, { is_active: !currentStatus });
  },
};
