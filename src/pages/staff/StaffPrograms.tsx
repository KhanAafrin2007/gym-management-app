import React, { useEffect, useState } from 'react';
import {
  Activity,
  Plus,
  Utensils,
  Dumbbell,
  UserPlus,
  Flame,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { programService } from '../../services/programService';
import { memberService } from '../../services/memberService';
import { formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import type {
  FitnessProgram,
  Member,
  DifficultyLevel,
} from '../../types/database';

export const StaffPrograms: React.FC = () => {
  const { appUser } = useAuth();
  const [programs, setPrograms] = useState<FitnessProgram[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab filter
  const [filter, setFilter] = useState<'all' | 'Diet' | 'Workout'>('all');

  // Modals
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Forms
  const [dietForm, setDietForm] = useState({
    diet_name: '',
    meal_type: 'Breakfast',
    meal: '',
    calories: 450,
  });

  const [workoutForm, setWorkoutForm] = useState({
    workout_name: '',
    duration: 45,
    difficulty_level: 'Intermediate' as DifficultyLevel,
  });

  const [assignForm, setAssignForm] = useState({
    member_id: '',
    program_id: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, handleApiError } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [programsData, membersData] = await Promise.all([
        programService.getPrograms(),
        memberService.getMembers({ isActive: true }),
      ]);
      setPrograms(programsData);
      setMembers(membersData);

      if (membersData.length > 0 && programsData.length > 0) {
        setAssignForm({
          member_id: membersData[0].member_id,
          program_id: programsData[0].program_id,
        });
      }
    } catch (err) {
      handleApiError(err, 'Failed to load fitness programs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDiet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await programService.createDietProgram({
        ...dietForm,
        trainer_id: appUser?.trainer_id || undefined,
      });
      success('Diet plan created!');
      setIsDietModalOpen(false);
      setDietForm({
        diet_name: '',
        meal_type: 'Breakfast',
        meal: '',
        calories: 450,
      });
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to create diet plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await programService.createWorkoutProgram({
        ...workoutForm,
        trainer_id: appUser?.trainer_id || undefined,
      });
      success('Workout routine created!');
      setIsWorkoutModalOpen(false);
      setWorkoutForm({
        workout_name: '',
        duration: 45,
        difficulty_level: 'Intermediate',
      });
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to create workout routine');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.member_id || !assignForm.program_id) return;
    setIsSubmitting(true);
    try {
      await programService.assignProgramToMember(assignForm.member_id, assignForm.program_id);
      success('Program successfully assigned to member!');
      setIsAssignModalOpen(false);
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to assign program (already assigned)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = programs.filter((p) => filter === 'all' || p.program_type === filter);

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading fitness routines..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Programs & Client Regimes</h1>
          <p className="text-xs text-slate-400 mt-1">
            Build specialized diet and workout regimens and assign them directly to trainees.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Assign Program
          </button>
          <button
            onClick={() => setIsDietModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1.5"
          >
            <Utensils className="w-3.5 h-3.5" />
            New Diet Plan
          </button>
          <button
            onClick={() => setIsWorkoutModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <Dumbbell className="w-3.5 h-3.5" />
            New Workout Plan
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-800 gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all ${
            filter === 'all'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          All ({programs.length})
        </button>
        <button
          onClick={() => setFilter('Diet')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            filter === 'Diet'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          Diet Plans
        </button>
        <button
          onClick={() => setFilter('Workout')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            filter === 'Workout'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          Workout Plans
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((p) => {
          const isDiet = p.program_type === 'Diet';
          return (
            <div
              key={p.program_id}
              className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-400">{p.program_id}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isDiet
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  {p.program_type}
                </span>
              </div>

              {isDiet && p.diet_plan && (
                <div className="space-y-1.5 text-xs">
                  <h3 className="text-base font-bold text-slate-100">{p.diet_plan.diet_name}</h3>
                  <p className="text-slate-400">
                    Meal: <span className="text-slate-200">{p.diet_plan.meal}</span> ({p.diet_plan.meal_type})
                  </p>
                  <p className="text-amber-400 font-mono font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> {p.diet_plan.calories} kcal
                  </p>
                </div>
              )}

              {!isDiet && p.workout_plan && (
                <div className="space-y-1.5 text-xs">
                  <h3 className="text-base font-bold text-slate-100">
                    {p.workout_plan.workout_name}
                  </h3>
                  <p className="text-slate-400">
                    Level:{' '}
                    <span className="text-slate-200 font-semibold">
                      {p.workout_plan.difficulty_level}
                    </span>
                  </p>
                  <p className="text-cyan-400 font-mono font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {p.workout_plan.duration} mins
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
                <span>By: {p.trainer?.trainer_name || 'Staff'}</span>
                <span>{formatDate(p.created_date)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Diet Modal */}
      <Modal
        isOpen={isDietModalOpen}
        onClose={() => setIsDietModalOpen(false)}
        title="Create Diet Plan"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDiet} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Diet Plan Name *
            </label>
            <input
              type="text"
              required
              value={dietForm.diet_name}
              onChange={(e) => setDietForm({ ...dietForm, diet_name: e.target.value })}
              placeholder="e.g. Lean Protein Breakfast"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Meal Type
              </label>
              <select
                value={dietForm.meal_type}
                onChange={(e) => setDietForm({ ...dietForm, meal_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Calories (kcal)
              </label>
              <input
                type="number"
                min="50"
                required
                value={dietForm.calories}
                onChange={(e) => setDietForm({ ...dietForm, calories: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Meal Description *
            </label>
            <input
              type="text"
              required
              value={dietForm.meal}
              onChange={(e) => setDietForm({ ...dietForm, meal: e.target.value })}
              placeholder="e.g. 3 egg whites + oats with berries"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDietModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              Create Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* New Workout Modal */}
      <Modal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        title="Create Workout Routine"
        maxWidth="md"
      >
        <form onSubmit={handleCreateWorkout} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Routine Name *
            </label>
            <input
              type="text"
              required
              value={workoutForm.workout_name}
              onChange={(e) => setWorkoutForm({ ...workoutForm, workout_name: e.target.value })}
              placeholder="e.g. HIIT Core & Cardio"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Duration (Mins)
              </label>
              <input
                type="number"
                min="10"
                required
                value={workoutForm.duration}
                onChange={(e) => setWorkoutForm({ ...workoutForm, duration: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Difficulty
              </label>
              <select
                value={workoutForm.difficulty_level}
                onChange={(e) =>
                  setWorkoutForm({
                    ...workoutForm,
                    difficulty_level: e.target.value as DifficultyLevel,
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsWorkoutModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              Create Routine
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Program to Member"
        maxWidth="md"
      >
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Select Trainee *
            </label>
            <select
              required
              value={assignForm.member_id}
              onChange={(e) => setAssignForm({ ...assignForm, member_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {members.map((m) => (
                <option key={m.member_id} value={m.member_id}>
                  {m.f_name} {m.l_name} ({m.member_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Select Program *
            </label>
            <select
              required
              value={assignForm.program_id}
              onChange={(e) => setAssignForm({ ...assignForm, program_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {programs.map((p) => {
                const name =
                  p.program_type === 'Diet'
                    ? p.diet_plan?.diet_name || 'Diet'
                    : p.workout_plan?.workout_name || 'Workout';
                return (
                  <option key={p.program_id} value={p.program_id}>
                    [{p.program_type}] {name} ({p.program_id})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              Assign Routine
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
