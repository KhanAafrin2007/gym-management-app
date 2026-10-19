import React, { useEffect, useState } from 'react';
import { MessageSquare, Star, Users, UserCheck, Layers, Award } from 'lucide-react';
import { feedbackService } from '../../services/feedbackService';
import { formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import type { Feedback } from '../../types/database';

export const AdminFeedback: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { handleApiError } = useToast();

  const loadFeedback = async () => {
    setIsLoading(true);
    try {
      const data = await feedbackService.getAllFeedback();
      setFeedbackList(data);
    } catch (err) {
      handleApiError(err, 'Failed to load member feedback');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading feedback reviews and analytics..." />;
  }

  // Calculate average rating per trainer
  const trainerMap: Record<string, { name: string; sum: number; count: number }> = {};
  // Calculate average rating per batch
  const batchMap: Record<string, { name: string; sum: number; count: number }> = {};

  let totalRatingSum = 0;

  feedbackList.forEach((fb) => {
    totalRatingSum += fb.ratings;
    const trainer = fb.member?.trainer;
    if (trainer) {
      if (!trainerMap[trainer.trainer_id]) {
        trainerMap[trainer.trainer_id] = { name: trainer.trainer_name, sum: 0, count: 0 };
      }
      trainerMap[trainer.trainer_id].sum += fb.ratings;
      trainerMap[trainer.trainer_id].count += 1;
    }

    const batch = fb.member?.batch;
    if (batch) {
      if (!batchMap[batch.batch_id]) {
        batchMap[batch.batch_id] = { name: batch.batch_name, sum: 0, count: 0 };
      }
      batchMap[batch.batch_id].sum += fb.ratings;
      batchMap[batch.batch_id].count += 1;
    }
  });

  const overallAvg =
    feedbackList.length > 0 ? (totalRatingSum / feedbackList.length).toFixed(1) : '0.0';

  const trainerAverages = Object.entries(trainerMap).map(([id, val]) => ({
    id,
    name: val.name,
    avg: (val.sum / val.count).toFixed(1),
    count: val.count,
  }));

  const batchAverages = Object.entries(batchMap).map(([id, val]) => ({
    id,
    name: val.name,
    avg: (val.sum / val.count).toFixed(1),
    count: val.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Member Feedback & Ratings</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review member sentiment, satisfaction scores, and calculated averages by trainer and batch.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span>{overallAvg} / 5.0 Overall Gym Rating</span>
        </div>
      </div>

      {/* Analytics Aggregations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Average per Trainer */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-200">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold">Average Rating per Trainer</h2>
          </div>
          {trainerAverages.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No trainer feedback accumulated yet.</p>
          ) : (
            <div className="space-y-2 pt-1">
              {trainerAverages.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-200">{t.name}</span>
                    <span className="block text-[10px] text-slate-500">
                      Based on {t.count} reviews
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold font-mono text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{t.avg} / 5</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Average per Batch */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-200">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold">Average Rating per Batch</h2>
          </div>
          {batchAverages.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No batch feedback accumulated yet.</p>
          ) : (
            <div className="space-y-2 pt-1">
              {batchAverages.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-200">{b.name}</span>
                    <span className="block text-[10px] text-slate-500">
                      Based on {b.count} reviews
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold font-mono text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{b.avg} / 5</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Feed */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-200">All Reviews ({feedbackList.length})</h2>

        {feedbackList.length === 0 ? (
          <EmptyState
            title="No feedback reviews recorded"
            description="Member ratings will appear here as they submit their workout reviews."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedbackList.map((fb) => (
              <div
                key={fb.feedback_id}
                className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">
                        {fb.member ? `${fb.member.f_name} ${fb.member.l_name}` : fb.member_id}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span>ID: {fb.member_id}</span>
                        {fb.member?.batch && <span>• {fb.member.batch.batch_name}</span>}
                        {fb.member?.trainer && (
                          <span>• Trainer: {fb.member.trainer.trainer_name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < fb.ratings ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                  <p className="text-xs text-slate-200 leading-relaxed italic">
                    "{fb.comments || 'No written comment provided.'}"
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span className="font-mono">Ref: {fb.feedback_id}</span>
                  <span>{formatDate(fb.feedback_date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
