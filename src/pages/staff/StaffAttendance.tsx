import React, { useEffect, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  LogOut as CheckoutIcon,
  Search,
  UserCheck,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { memberService } from '../../services/memberService';
import { formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import type { Attendance, Member } from '../../types/database';

export const StaffAttendance: React.FC = () => {
  const [todayLogs, setTodayLogs] = useState<Attendance[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mark Check-in state
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter today's list
  const [search, setSearch] = useState('');

  const { success, error, warning, handleApiError } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [todayData, membersData] = await Promise.all([
        attendanceService.getTodayAttendance(),
        memberService.getMembers({ isActive: true }),
      ]);
      setTodayLogs(todayData);
      setMembers(membersData);
      if (membersData.length > 0 && !selectedMemberId) {
        setSelectedMemberId(membersData[0].member_id);
      }
    } catch (err) {
      handleApiError(err, 'Failed to load attendance records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    setIsSubmitting(true);
    try {
      await attendanceService.markCheckIn(selectedMemberId, customTime || undefined);
      const memberObj = members.find((m) => m.member_id === selectedMemberId);
      success(
        'Check-In Recorded!',
        `${memberObj?.f_name || selectedMemberId} checked in successfully.`
      );
      setCustomTime('');
      await loadData();
    } catch (err: any) {
      if (err.message && err.message.includes('already checked in')) {
        warning('Already Checked In', err.message);
      } else {
        handleApiError(err, 'Failed to record check-in');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async (memberId: string) => {
    setIsSubmitting(true);
    try {
      await attendanceService.markCheckOut(memberId);
      success('Check-Out Recorded', `Member ${memberId} checked out.`);
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to record check-out');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLogs = todayLogs.filter((log) => {
    const s = search.toLowerCase();
    return (
      !s ||
      log.member_id.toLowerCase().includes(s) ||
      log.member?.f_name?.toLowerCase().includes(s) ||
      log.member?.l_name?.toLowerCase().includes(s)
    );
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading today's gym attendance..." />;
  }

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Member Attendance Desk</h1>
          <p className="text-xs text-slate-400 mt-1">
            Today is <span className="font-semibold text-slate-200">{todayStr}</span>. Check in
            members entering the gym and record departure check-outs.
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Check-In Panel */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold text-white">Record Check-In</h2>
        </div>

        <form
          onSubmit={handleCheckIn}
          className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-end"
        >
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Gym Member *
            </label>
            <select
              required
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {members.map((m) => (
                <option key={m.member_id} value={m.member_id}>
                  {m.f_name} {m.l_name} ({m.member_id}) — Batch:{' '}
                  {m.batch ? m.batch.batch_name : 'No Batch'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Check-In Time (Optional)
            </label>
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              placeholder="Defaults to now"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Check-In
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Today's Attendance Logs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Today's Attendance List</h2>
            <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              {todayLogs.length} Checked In
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search today's entries..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <EmptyState
            title="No check-ins logged for today yet"
            description="Use the check-in form above as members arrive at the front desk."
          />
        ) : (
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                    <th className="py-3.5 px-4">Member Name</th>
                    <th className="py-3.5 px-4">Member ID</th>
                    <th className="py-3.5 px-4">Batch</th>
                    <th className="py-3.5 px-4">Check-In Time</th>
                    <th className="py-3.5 px-4">Check-Out Time</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLogs.map((log) => (
                    <tr key={log.member_id} className="hover:bg-slate-800/20">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-100">
                          {log.member ? `${log.member.f_name} ${log.member.l_name}` : log.member_id}
                        </span>
                        {log.member?.phone_no && (
                          <span className="block text-[10px] text-slate-500">
                            {log.member.phone_no}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {log.member_id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {log.member?.batch?.batch_name || 'No Batch'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {log.check_in_time || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-cyan-400 font-bold">
                        {log.checkout_time || (
                          <span className="text-amber-400/80 italic font-sans font-normal text-[11px]">
                            Currently in gym
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!log.checkout_time ? (
                          <button
                            onClick={() => handleCheckOut(log.member_id)}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border border-cyan-500/30 transition-colors inline-flex items-center gap-1.5"
                          >
                            <CheckoutIcon className="w-3.5 h-3.5" />
                            Mark Check-Out
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
