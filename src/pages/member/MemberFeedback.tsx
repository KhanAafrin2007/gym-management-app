import React, { useEffect, useState } from 'react';
import { MessageSquare, Star, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { feedbackService } from '../../services/feedbackService';
import { formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import type { Feedback } from '../../types/database';

export const MemberFeedback: React.FC = () => {
  const { appUser } = useAuth();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Submit form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, handleApiError } = useToast();

  const loadFeedback = async () => {
    if (!appUser?.member_id) return;
    setIsLoading(true);
    try {
      const data = await feedbackService.getMemberFeedback(appUser.member_id);
      setFeedbackList(data);
    } catch (err) {
      handleApiError(err, 'Failed to load your past reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [appUser?.member_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser?.member_id) return;

    setIsSubmitting(true);
    try {
      await feedbackService.submitFeedback({
        member_id: appUser.member_id,
        ratings: rating,
        comments: comments.trim() || undefined,
      });

      success('Feedback Submitted!', 'Thank you for rating your gym experience.');
      setComments('');
      setRating(5);
      await loadFeedback();
    } catch (err) {
      handleApiError(err, 'Failed to submit your feedback review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading feedback reviews..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white">Member Feedback & Reviews</h1>
        <p className="text-xs text-slate-400 mt-1">
          Share your gym experience, rate facility cleaniness, equipment, and training support.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Feedback Submission Form */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5 lg:col-span-1">
          <div className="flex items-center gap-2 text-amber-400">
            <Star className="w-5 h-5 fill-amber-400" />
            <h2 className="text-base font-bold text-white">Rate Your Experience</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star Rating Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Overall Rating (1 to 5)
              </label>
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 justify-center">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled =
                    hoverRating !== null ? star <= hoverRating : star <= rating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-600 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          isFilled
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-xs text-slate-400 font-semibold mt-1.5">
                {rating === 5 && 'Outstanding Experience! 🔥'}
                {rating === 4 && 'Great Workout & Facilities 👍'}
                {rating === 3 && 'Average, Room for Improvement 👌'}
                {rating === 2 && 'Below Expectations 👎'}
                {rating === 1 && 'Unsatisfactory Experience ⚠️'}
              </p>
            </div>

            {/* Comments */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Comments & Suggestions
              </label>
              <textarea
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share your thoughts about trainers, equipment, cleaniness, or batches..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Feedback
                </>
              )}
            </button>
          </form>
        </div>

        {/* Previous Feedback List */}
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-base font-bold text-slate-200">
            My Past Feedback ({feedbackList.length})
          </h2>

          {feedbackList.length === 0 ? (
            <EmptyState
              title="No reviews submitted yet"
              description="Your submitted ratings and gym notes will appear here."
            />
          ) : (
            <div className="space-y-3">
              {feedbackList.map((fb) => (
                <div
                  key={fb.feedback_id}
                  className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < fb.ratings ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold font-mono text-amber-400 ml-1.5">
                        {fb.ratings} / 5
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(fb.feedback_date)}</span>
                  </div>

                  <p className="text-xs text-slate-200 italic bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 leading-relaxed">
                    "{fb.comments || 'No written comment'}"
                  </p>

                  <span className="block text-[10px] font-mono text-slate-500">
                    Ref ID: {fb.feedback_id}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
