import { supabase } from '../lib/supabase';
import { getNextId } from '../lib/idGenerator';
import type { FitnessProgram, DietPlan, WorkoutPlan, MemberProgram } from '../types/database';

export const programService = {
  async getPrograms() {
    const { data, error } = await supabase
      .from('fitness_program')
      .select('*, trainer(*), diet_plan(*), workout_plan(*)')
      .order('created_date', { ascending: false });

    if (error) throw error;
    return (data || []) as FitnessProgram[];
  },

  async createDietProgram(payload: {
    trainer_id?: string;
    diet_name: string;
    meal_type: string;
    meal: string;
    calories: number;
  }) {
    const nextId = await getNextId('fitness_program');
    const today = new Date().toISOString().split('T')[0];

    // 1. Insert fitness_program
    const { error: progErr } = await supabase.from('fitness_program').insert({
      program_id: nextId,
      program_type: 'Diet',
      created_date: today,
      trainer_id: payload.trainer_id || null,
    });

    if (progErr) throw progErr;

    // 2. Insert diet_plan
    const { data: dietData, error: dietErr } = await supabase
      .from('diet_plan')
      .insert({
        program_id: nextId,
        diet_name: payload.diet_name,
        meal_type: payload.meal_type,
        meal: payload.meal,
        calories: payload.calories,
      })
      .select()
      .single();

    if (dietErr) throw dietErr;
    return dietData as DietPlan;
  },

  async createWorkoutProgram(payload: {
    trainer_id?: string;
    workout_name: string;
    duration: number;
    difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced';
  }) {
    const nextId = await getNextId('fitness_program');
    const today = new Date().toISOString().split('T')[0];

    // 1. Insert fitness_program
    const { error: progErr } = await supabase.from('fitness_program').insert({
      program_id: nextId,
      program_type: 'Workout',
      created_date: today,
      trainer_id: payload.trainer_id || null,
    });

    if (progErr) throw progErr;

    // 2. Insert workout_plan
    const { data: workoutData, error: workoutErr } = await supabase
      .from('workout_plan')
      .insert({
        program_id: nextId,
        workout_name: payload.workout_name,
        duration: payload.duration,
        difficulty_level: payload.difficulty_level,
      })
      .select()
      .single();

    if (workoutErr) throw workoutErr;
    return workoutData as WorkoutPlan;
  },

  async assignProgramToMember(memberId: string, programId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('member_program')
      .insert({
        member_id: memberId,
        program_id: programId,
        assigned_date: today,
      })
      .select('*, fitness_program(*, diet_plan(*), workout_plan(*))')
      .single();

    if (error) throw error;
    return data as MemberProgram;
  },

  async getMemberAssignedPrograms(memberId: string) {
    const { data, error } = await supabase
      .from('member_program')
      .select('*, fitness_program(*, trainer(*), diet_plan(*), workout_plan(*))')
      .eq('member_id', memberId)
      .order('assigned_date', { ascending: false });

    if (error) throw error;
    return (data || []) as MemberProgram[];
  },
};
