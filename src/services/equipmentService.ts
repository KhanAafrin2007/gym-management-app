import { supabase } from '../lib/supabase';
import { getNextId } from '../lib/idGenerator';
import type { Equipment, EquipmentMaintenance, EquipmentStatus } from '../types/database';

export const equipmentService = {
  async getEquipment() {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('equipment_id');

    if (error) throw error;
    return (data || []) as Equipment[];
  },

  async createEquipment(payload: Omit<Equipment, 'equipment_id'>) {
    const nextId = await getNextId('equipment');
    const newEquipment = {
      ...payload,
      equipment_id: nextId,
    };

    const { data, error } = await supabase
      .from('equipment')
      .insert(newEquipment)
      .select()
      .single();

    if (error) throw error;
    return data as Equipment;
  },

  async updateStatus(equipmentId: string, status: EquipmentStatus) {
    const { data, error } = await supabase
      .from('equipment')
      .update({ status })
      .eq('equipment_id', equipmentId)
      .select()
      .single();

    if (error) throw error;
    return data as Equipment;
  },

  async getMaintenanceRecords(equipmentId?: string) {
    let query = supabase
      .from('equipment_maintenance')
      .select('*, equipment(*)')
      .order('maintenance_date', { ascending: false });

    if (equipmentId) {
      query = query.eq('equipment_id', equipmentId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as EquipmentMaintenance[];
  },

  async logMaintenance(payload: {
    equipment_id: string;
    description: string;
    cost: number;
    status: string;
    maintenance_date?: string;
  }) {
    if (payload.cost < 0) {
      throw new Error('Maintenance cost cannot be negative');
    }

    const maintenanceDate = payload.maintenance_date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('equipment_maintenance')
      .insert({
        equipment_id: payload.equipment_id,
        maintenance_date: maintenanceDate,
        description: payload.description,
        cost: payload.cost,
        status: payload.status,
      })
      .select('*, equipment(*)')
      .single();

    if (error) throw error;
    return data as EquipmentMaintenance;
  },
};
