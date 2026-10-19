import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CreditCard,
  Users,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendanceService';
import { paymentService } from '../../services/paymentService';
import { memberService } from '../../services/memberService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import type { Attendance, Payment, Member } from '../../types/database';

export const StaffDashboard: React.FC = () => {
  const { appUser } = useAuth();
  const [todayAttendanceCount, setTodayAttendanceCount] = useState(0);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [assignedMembers, setAssignedMembers] = useState<Member[]>([]);
  const [todayList, setTodayList] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { handleApiError } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [todayAtt, pending, members] = await Promise.all([
        attendanceService.getTodayAttendance(),
        paymentService.getPendingPayments(),
        memberService.getMembers({
          trainerId: appUser?.trainer_id || undefined,
          isActive: true,
        }),
      ]);

      setTodayAttendanceCount(todayAtt.length);
      setTodayList(todayAtt.slice(0, 5));
      setPendingPayments(pending);
      setAssignedMembers(members);
    } catch (err) {
      handleApiError(err, 'Failed to load staff daily overview');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [appUser?.trainer_id]);

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading staff operational dashboard..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Daily Operational Hub</h1>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as Staff Trainer{' '}
            <span className="font-semibold text-cyan-400">
              {appUser?.trainer_id ? `(${appUser.trainer_id})` : ''}
            </span>
            . Manage check-ins, approve desk payments, and guide assigned trainees.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/staff/attendance"
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            Mark Check-In
          </Link>
          <Link
            to="/staff/payments"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4" />
            Record Payment
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Today's Attendance */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Today's Attendance
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-2">{todayAttendanceCount}</p>
          <Link
            to="/staff/attendance"
            className="text-xs font-semibold text-emerald-400 hover:underline inline-flex items-center gap-1 mt-3"
          >
            Open attendance desk <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Pending Payments Queue */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pending Payments to Confirm
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-400 mt-2">{pendingPayments.length}</p>
          <Link
            to="/staff/payments"
            className="text-xs font-semibold text-amber-400 hover:underline inline-flex items-center gap-1 mt-3"
          >
            Review pending queue <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Members Assigned to this Trainer */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              My Assigned Members
            </span>
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-cyan-400 mt-2">{assignedMembers.length}</p>
          <Link
            to="/staff/members"
            className="text-xs font-semibold text-cyan-400 hover:underline inline-flex items-center gap-1 mt-3"
          >
            View member roster <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Grid: Pending Payments & Recent Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments to Confirm */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Pending Payments Queue</h2>
            </div>
            <Link
              to="/staff/payments"
              className="text-xs font-semibold text-emerald-400 hover:underline"
            >
              View All ({pendingPayments.length})
            </Link>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
              No payments awaiting staff confirmation.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingPayments.slice(0, 4).map((p) => (
                <div
                  key={p.payment_id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-100">
                      {p.member ? `${p.member.f_name} ${p.member.l_name}` : p.member_id}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono">
                      Ref: {p.payment_id} • Mode: {p.payment_mode}
                    </span>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="font-mono font-bold text-emerald-400">Rs. {p.amount}</span>
                    <Link
                      to="/staff/payments"
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
                    >
                      Confirm
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Trainees */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">My Trainees ({assignedMembers.length})</h2>
            </div>
            <Link
              to="/staff/members"
              className="text-xs font-semibold text-cyan-400 hover:underline"
            >
              Roster
            </Link>
          </div>

          {assignedMembers.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
              No active gym members are currently assigned to your trainer ID.
            </div>
          ) : (
            <div className="space-y-2.5">
              {assignedMembers.slice(0, 4).map((m) => (
                <div
                  key={m.member_id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-100">
                      {m.f_name} {m.l_name}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono">
                      {m.member_id} • Batch: {m.batch?.batch_name || 'None'}
                    </span>
                  </div>
                  <Link
                    to={`/staff/members/${m.member_id}`}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    View Trainee
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
