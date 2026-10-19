import { supabase } from '../lib/supabase';
import { getNextId } from '../lib/idGenerator';
import type { Batch } from '../types/database';

export const batchService = {
  async getBatches() {
    const { data: batches, error } = await supabase
      .from('batch')
      .select('*')
      .order('batch_id');

    if (error) throw error;

    // Count enrolled members
    const { data: members, error: memErr } = await supabase
      .from('member')
      .select('batch_id, is_active');

    if (memErr) throw memErr;

    const countMap: Record<string, { total: number; active: number }> = {};
    (members || []).forEach((m) => {
      if (m.batch_id) {
        if (!countMap[m.batch_id]) {
          countMap[m.batch_id] = { total: 0, active: 0 };
        }
        countMap[m.batch_id].total += 1;
        if (m.is_active) {
          countMap[m.batch_id].active += 1;
        }
      }
    });

    return (batches || []).map((b) => ({
      ...b,
      enrolledCount: countMap[b.batch_id]?.active ?? 0,
      totalEnrolledCount: countMap[b.batch_id]?.total ?? 0,
    })) as (Batch & { enrolledCount: number; totalEnrolledCount: number })[];
  },

  async createBatch(payload: Omit<Batch, 'batch_id'>) {
    const nextId = await getNextId('batch');
    const newBatch = {
      ...payload,
      batch_id: nextId,
    };

    const { data, error } = await supabase.from('batch').insert(newBatch).select().single();
    if (error) throw error;
    return data as Batch;
  },

  async updateBatch(batchId: string, payload: Partial<Batch>) {
    const { data, error } = await supabase
      .from('batch')
      .update(payload)
      .eq('batch_id', batchId)
      .select()
      .single();

    if (error) throw error;
    return data as Batch;
  },
};
