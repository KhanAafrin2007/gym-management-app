import React, { useEffect, useState } from 'react';
import {
  Activity,
  Plus,
  Utensils,
  Dumbbell,
  UserPlus,
  Calendar,
  Flame,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { programService } from '../../services/programService';
import { trainerService } from '../../services/trainerService';
import { memberService } from '../../services/memberService';
import { formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import type {
  FitnessProgram,
  Trainer,
  Member,
  DifficultyLevel,
} from '../../types/database';

export const AdminPrograms: React.FC = () => {
  const [programs, setPrograms] = useState<FitnessProgram[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab filter: All | Diet | Workout
  const [programFilter, setProgramFilter] = useState<'all' | 'Diet' | 'Workout'>('all');

  // Modals
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Form states
  const [dietForm, setDietForm] = useState({
    diet_name: '',
    meal_type: 'Breakfast',
    meal: '',
    calories: 450,
    trainer_id: '',
  });

  const [workoutForm, setWorkoutForm] = useState({
    workout_name: '',
    duration: 45,
    difficulty_level: 'Intermediate' as DifficultyLevel,
    trainer_id: '',
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
      const [programsData, trainersData, membersData] = await Promise.all([
        programService.getPrograms(),
        trainerService.getTrainers(false),
        memberService.getMembers({ isActive: true }),
      ]);
      setPrograms(programsData);
      setTrainers(trainersData);
      setMembers(membersData);

      if (trainersData.length > 0) {
        setDietForm((prev) => ({ ...prev, trainer_id: trainersData[0].trainer_id }));
        setWorkoutForm((prev) => ({ ...prev, trainer_id: trainersData[0].trainer_id }));
      }
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
      await programService.createDietProgram(dietForm);
      success('Diet plan created successfully!');
      setIsDietModalOpen(false);
      setDietForm({
        diet_name: '',
        meal_type: 'Breakfast',
        meal: '',
        calories: 450,
        trainer_id: trainers[0]?.trainer_id || '',
      });
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to create diet program');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await programService.createWorkoutProgram(workoutForm);
      success('Workout plan created successfully!');
      setIsWorkoutModalOpen(false);
      setWorkoutForm({
        workout_name: '',
        duration: 45,
        difficulty_level: 'Intermediate',
        trainer_id: trainers[0]?.trainer_id || '',
      });
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to create workout program');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.member_id || !assignForm.program_id) return;
    setIsSubmitting(true);
    try {
      await programService.assignProgramToMember(assignForm.member_id, assignForm.program_id);
      success('Program assigned to member!');
      setIsAssignModalOpen(false);
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to assign program (member may already have this program)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPrograms = programs.filter(
    (p) => programFilter === 'all' || p.program_type === programFilter
  );

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading fitness and diet plans..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Fitness Programs & Diets</h1>
          <p className="text-xs text-slate-400 mt-1">
            Build custom diet regimes and workout routines, and assign them to members.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Assign to Member
          </button>
          <button
            onClick={() => setIsDietModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1.5"
          >
            <Utensils className="w-3.5 h-3.5" />
            Create Diet Plan
          </button>
          <button
            onClick={() => setIsWorkoutModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <Dumbbell className="w-3.5 h-3.5" />
            Create Workout Plan
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-800 gap-3">
        <button
          onClick={() => setProgramFilter('all')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all ${
            programFilter === 'all'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          All Programs ({programs.length})
        </button>
        <button
          onClick={() => setProgramFilter('Diet')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            programFilter === 'Diet'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          Diet Plans ({programs.filter((p) => p.program_type === 'Diet').length})
        </button>
        <button
          onClick={() => setProgramFilter('Workout')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            programFilter === 'Workout'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          Workout Plans ({programs.filter((p) => p.program_type === 'Workout').length})
        </button>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPrograms.map((p) => {
          const isDiet = p.program_type === 'Diet';
          return (
            <div
              key={p.program_id}
              className="glass-panel p-5 rounded-3xl border border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400">{p.program_id}</span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isDiet
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    }`}
                  >
                    {isDiet ? <Utensils className="w-3 h-3" /> : <Dumbbell className="w-3 h-3" />}
                    {p.program_type}
                  </span>
                </div>

                {isDiet && p.diet_plan && (
                  <div className="mt-3 space-y-2">
                    <h3 className="text-base font-bold text-white">{p.diet_plan.diet_name}</h3>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Meal Type:</span>
                        <span className="font-semibold text-slate-200">
                          {p.diet_plan.meal_type}
                        </span>
                      </div>
                      <div className="text-slate-300">
                        <span className="text-slate-500 block text-[10px] uppercase">Menu Item:</span>
                        <span className="font-medium">{p.diet_plan.meal}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-amber-400" /> Calories:
                        </span>
                        <span className="font-mono font-bold text-amber-400">
                          {p.diet_plan.calories} kcal
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {!isDiet && p.workout_plan && (
                  <div className="mt-3 space-y-2">
                    <h3 className="text-base font-bold text-white">
                      {p.workout_plan.workout_name}
                    </h3>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Difficulty:</span>
                        <span
                          className={`font-semibold ${
                            p.workout_plan.difficulty_level === 'Advanced'
                              ? 'text-rose-400'
                              : p.workout_plan.difficulty_level === 'Intermediate'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {p.workout_plan.difficulty_level}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" /> Duration:
                        </span>
                        <span className="font-mono font-bold text-cyan-400">
                          {p.workout_plan.duration} mins
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Trainer: {p.trainer?.trainer_name || 'Gym Staff'}</span>
                <span>{formatDate(p.created_date)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Diet Modal */}
      <Modal
        isOpen={isDietModalOpen}
        onClose={() => setIsDietModalOpen(false)}
        title="Create Diet Plan"
        description="Insert new diet program and nutritional meal guide."
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
              placeholder="e.g. Muscle Gain High-Protein"
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
                Estimated Calories (kcal)
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
              Meal Details & Ingredients *
            </label>
            <input
              type="text"
              required
              value={dietForm.meal}
              onChange={(e) => setDietForm({ ...dietForm, meal: e.target.value })}
              placeholder="e.g. 4 boiled eggs + oatmeal + banana shake"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Supervising Trainer
            </label>
            <select
              value={dietForm.trainer_id}
              onChange={(e) => setDietForm({ ...dietForm, trainer_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Unassigned</option>
              {trainers.map((t) => (
                <option key={t.trainer_id} value={t.trainer_id}>
                  {t.trainer_name} ({t.trainer_id})
                </option>
              ))}
            </select>
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
              {isSubmitting && (
                <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              )}
              Create Diet Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Workout Modal */}
      <Modal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        title="Create Workout Plan"
        description="Insert new workout routine and difficulty rating."
        maxWidth="md"
      >
        <form onSubmit={handleCreateWorkout} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Workout Routine Name *
            </label>
            <input
              type="text"
              required
              value={workoutForm.workout_name}
              onChange={(e) => setWorkoutForm({ ...workoutForm, workout_name: e.target.value })}
              placeholder="e.g. Upper Body Strength Circuit"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Duration (Minutes) *
              </label>
              <input
                type="number"
                min="10"
                max="180"
                required
                value={workoutForm.duration}
                onChange={(e) => setWorkoutForm({ ...workoutForm, duration: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Difficulty Level
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Supervising Trainer
            </label>
            <select
              value={workoutForm.trainer_id}
              onChange={(e) => setWorkoutForm({ ...workoutForm, trainer_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Unassigned</option>
              {trainers.map((t) => (
                <option key={t.trainer_id} value={t.trainer_id}>
                  {t.trainer_name} ({t.trainer_id})
                </option>
              ))}
            </select>
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
              {isSubmitting && (
                <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              )}
              Create Workout Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Program to Member Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Fitness Program"
        description="Link a diet or workout regimen to a gym member."
        maxWidth="md"
      >
        <form onSubmit={handleAssignProgram} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Select Member *
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
              {isSubmitting && (
                <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              )}
              Assign Program
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
