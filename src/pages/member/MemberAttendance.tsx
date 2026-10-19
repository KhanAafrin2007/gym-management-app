import React, { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle2, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendanceService';
import { formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import type { Attendance } from '../../types/database';

export const MemberAttendance: React.FC = () => {
  const { appUser } = useAuth();
  const [logs, setLogs] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calendar month selection
  const [viewDate, setViewDate] = useState(new Date());

  const { handleApiError } = useToast();

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!appUser?.member_id) return;
      setIsLoading(true);
      try {
        const data = await attendanceService.getMemberAttendance(appUser.member_id);
        setLogs(data);
      } catch (err) {
        handleApiError(err, 'Failed to load your attendance logs');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttendance();
  }, [appUser?.member_id]);

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading your attendance history..." />;
  }

  // Calendar calculations
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create set of visited dates in YYYY-MM-DD
  const visitedDates = new Set(
    logs
      .filter((l) => l.attendance_date)
      .map((l) => l.attendance_date)
  );

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Count visits for this specific month
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const visitsThisMonth = logs.filter((l) => l.attendance_date?.startsWith(monthPrefix)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Attendance & Workout Activity</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your workout consistency, monthly visits, and check-in history.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          <Activity className="w-4 h-4" />
          <span>{logs.length} Total Gym Visits Recorded</span>
        </div>
      </div>

      {/* Calendar Heatmap Section */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Monthly Activity Calendar
            </h2>
            <p className="text-xs text-slate-400">
              {visitsThisMonth} check-ins in {monthLabel}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-200 min-w-[120px] text-center font-sans">
              {monthLabel}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="pt-2">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank offset days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12 rounded-xl bg-slate-900/20" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;
              const visited = visitedDates.has(dateStr);

              return (
                <div
                  key={dateStr}
                  className={`h-12 rounded-xl flex flex-col items-center justify-center p-1 border transition-all ${
                    visited
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold shadow-sm shadow-emerald-500/10'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <span className="text-xs">{dayNum}</span>
                  {visited && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-emerald-500/25 border border-emerald-500/50" />
            <span>Gym Attended</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-slate-900/60 border border-slate-800" />
            <span>Rest Day</span>
          </div>
        </div>
      </div>

      {/* List of Attendance History */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-200">Full Visit Log ({logs.length})</h2>

        {logs.length === 0 ? (
          <EmptyState
            title="No visits recorded yet"
            description="Your check-in records will appear here as you visit the gym."
          />
        ) : (
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Check-In Time</th>
                  <th className="py-3 px-4">Check-Out Time</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.attendance_date} className="hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-semibold text-slate-100">
                      {formatDate(log.attendance_date)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {log.check_in_time || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {log.checkout_time || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified Visit
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
