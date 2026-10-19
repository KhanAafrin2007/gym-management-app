import React, { useEffect, useState } from 'react';
import { Activity, Utensils, Dumbbell, Flame, Clock, Calendar, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { programService } from '../../services/programService';
import { formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import type { MemberProgram } from '../../types/database';

export const MemberPrograms: React.FC = () => {
  const { appUser } = useAuth();
  const [programs, setPrograms] = useState<MemberProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { handleApiError } = useToast();

  useEffect(() => {
    const fetchPrograms = async () => {
      if (!appUser?.member_id) return;
      setIsLoading(true);
      try {
        const data = await programService.getMemberAssignedPrograms(appUser.member_id);
        setPrograms(data);
      } catch (err) {
        handleApiError(err, 'Failed to load your assigned programs');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrograms();
  }, [appUser?.member_id]);

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading your personalized fitness programs..." />;
  }

  const dietPrograms = programs.filter((p) => p.fitness_program?.program_type === 'Diet');
  const workoutPrograms = programs.filter((p) => p.fitness_program?.program_type === 'Workout');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white">Personalized Training & Nutrition</h1>
        <p className="text-xs text-slate-400 mt-1">
          Diet regimes and workout routines designed by your personal gym trainers.
        </p>
      </div>

      {programs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No fitness programs assigned yet"
          description="Speak to your assigned trainer to have a customized diet plan or workout routine added to your profile."
        />
      ) : (
        <div className="space-y-8">
          {/* Diet Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Utensils className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">
                Nutrition & Diet Plans ({dietPrograms.length})
              </h2>
            </div>

            {dietPrograms.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No diet plan assigned yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {dietPrograms.map((p) => {
                  const diet = p.fitness_program?.diet_plan;
                  return (
                    <div
                      key={p.program_id}
                      className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4 hover:border-amber-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {p.program_id}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {diet?.meal_type}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-100">{diet?.diet_name}</h3>
                        <div className="mt-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Recommended Meal:
                          </span>
                          <p className="text-xs font-semibold text-slate-100">{diet?.meal}</p>
                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-xs text-slate-400 flex items-center gap-1.5">
                              <Flame className="w-4 h-4 text-amber-400" /> Target Calories:
                            </span>
                            <span className="font-mono font-black text-amber-400 text-sm">
                              {diet?.calories} kcal
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                        <span>Assigned: {formatDate(p.assigned_date)}</span>
                        <span>Trainer: {p.fitness_program?.trainer?.trainer_name || 'Staff'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Workout Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-400">
              <Dumbbell className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">
                Workout Routines ({workoutPrograms.length})
              </h2>
            </div>

            {workoutPrograms.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No workout routine assigned yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {workoutPrograms.map((p) => {
                  const workout = p.fitness_program?.workout_plan;
                  return (
                    <div
                      key={p.program_id}
                      className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4 hover:border-cyan-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {p.program_id}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                          {workout?.difficulty_level}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-100">
                          {workout?.workout_name}
                        </h3>
                        <div className="mt-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-cyan-400" /> Session Duration:
                            </span>
                            <span className="font-mono font-black text-cyan-400 text-sm">
                              {workout?.duration} mins
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                            <span className="text-slate-400">Difficulty Intensity:</span>
                            <span className="font-semibold text-slate-200">
                              {workout?.difficulty_level} Level
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                        <span>Assigned: {formatDate(p.assigned_date)}</span>
                        <span>Trainer: {p.fitness_program?.trainer?.trainer_name || 'Staff'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
