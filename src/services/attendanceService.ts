import { supabase } from '../lib/supabase';
import type { Attendance } from '../types/database';

export const attendanceService = {
  async getTodayAttendance() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('attendance')
      .select('*, member(*, batch(*))')
      .eq('attendance_date', today)
      .order('check_in_time', { ascending: false });

    if (error) throw error;
    return (data || []) as Attendance[];
  },

  async getMemberAttendance(memberId: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('member_id', memberId)
      .order('attendance_date', { ascending: false });

    if (error) throw error;
    return (data || []) as Attendance[];
  },

  async getAllAttendance(startDate?: string, endDate?: string) {
    let query = supabase
      .from('attendance')
      .select('*, member(*, batch(*))')
      .order('attendance_date', { ascending: false });

    if (startDate) query = query.gte('attendance_date', startDate);
    if (endDate) query = query.lte('attendance_date', endDate);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Attendance[];
  },

  async markCheckIn(memberId: string, customTime?: string) {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr =
      customTime ||
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Check if member is already checked in today
    const { data: existing, error: checkErr } = await supabase
      .from('attendance')
      .select('*')
      .eq('member_id', memberId)
      .eq('attendance_date', today)
      .maybeSingle();

    if (checkErr) throw checkErr;

    if (existing) {
      throw new Error(`Member is already checked in for today (${existing.check_in_time || 'checked in'}).`);
    }

    const { data, error } = await supabase
      .from('attendance')
      .insert({
        member_id: memberId,
        attendance_date: today,
        check_in_time: timeStr,
        checkout_time: null,
      })
      .select('*, member(*)')
      .single();

    if (error) throw error;
    return data as Attendance;
  },

  async markCheckOut(memberId: string, customTime?: string) {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr =
      customTime ||
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('attendance')
      .update({ checkout_time: timeStr })
      .eq('member_id', memberId)
      .eq('attendance_date', today)
      .select('*, member(*)')
      .single();

    if (error) throw error;
    return data as Attendance;
  },
};
