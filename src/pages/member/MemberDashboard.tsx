import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Dumbbell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { memberService } from '../../services/memberService';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import type { Member, Membership, Payment, Attendance, MemberProgram } from '../../types/database';

export const MemberDashboard: React.FC = () => {
  const { appUser } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [visitsThisMonth, setVisitsThisMonth] = useState(0);
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [assignedPrograms, setAssignedPrograms] = useState<MemberProgram[]>([]);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { handleApiError } = useToast();

  useEffect(() => {
    const loadMemberData = async () => {
      if (!appUser?.member_id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const details = await memberService.getMemberById(appUser.member_id);
        setMember(details.member);

        // Active Membership
        const activeMs = details.memberships.find((m) => m.status === 'Active');
        setActiveMembership(activeMs || null);

        if (activeMs?.end_date) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const end = new Date(activeMs.end_date);
          end.setHours(0, 0, 0, 0);
          const diffTime = end.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysLeft(diffDays);
        }

        // Total Paid
        const paid = details.payments
          .filter((p) => p.payment_status === 'Completed')
          .reduce((sum, p) => sum + Number(p.amount), 0);
        setTotalPaid(paid);

        // Visits this month
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const thisMonthVisits = details.attendance.filter((a) =>
          a.attendance_date?.startsWith(currentMonthStr)
        ).length;
        setVisitsThisMonth(thisMonthVisits);

        setRecentAttendance(details.attendance.slice(0, 5));
        setAssignedPrograms(details.programs);
      } catch (err) {
        handleApiError(err, 'Failed to load your member profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadMemberData();
  }, [appUser?.member_id]);

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading your GymFlow member dashboard..." />;
  }

  const isExpiringSoon = daysLeft !== null && daysLeft <= 7;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Member Space
          </div>
          <h1 className="text-2xl font-black text-white">
            Welcome back, {member ? member.f_name : 'Fitness Enthusiast'}!
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Batch:{' '}
            <span className="text-slate-200 font-medium">
              {member?.batch ? `${member.batch.batch_name} (${member.batch.batch_time})` : 'Unassigned'}
            </span>{' '}
            • Trainer:{' '}
            <span className="text-slate-200 font-medium">
              {member?.trainer?.trainer_name || 'Assigned Staff'}
            </span>
          </p>
        </div>

        <Link
          to="/me/payments"
          className="relative z-10 px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <CreditCard className="w-4 h-4" />
          Pay Now / Renew
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Plan */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Current Plan
          </span>
          <p className="text-lg font-bold text-white truncate">
            {activeMembership?.membership_plan?.plan_name || 'No Active Plan'}
          </p>
          <div className="pt-1">
            <StatusBadge status={activeMembership ? 'Active' : 'Expired'} size="sm" />
          </div>
        </div>

        {/* Membership Expiry / Days Left Warning */}
        <div
          className={`glass-panel p-5 rounded-3xl border transition-all ${
            isExpiringSoon
              ? 'border-amber-500/50 bg-amber-500/5 glow-cyan'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Subscription Expiry
            </span>
            {isExpiringSoon && <AlertTriangle className="w-4 h-4 text-amber-400" />}
          </div>
          <p className="text-lg font-bold text-white mt-1">
            {activeMembership?.end_date ? formatDate(activeMembership.end_date) : '—'}
          </p>
          {daysLeft !== null && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                daysLeft <= 0
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : daysLeft <= 7
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              {daysLeft <= 0 ? 'Expired' : `${daysLeft} days remaining`}
            </span>
          )}
        </div>

        {/* Total Paid */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Invested
          </span>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {formatCurrency(totalPaid)}
          </p>
          <span className="text-[10px] text-slate-500 block">Completed subscriptions</span>
        </div>

        {/* Visits this Month */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Visits This Month
          </span>
          <p className="text-2xl font-black text-cyan-400 mt-1">{visitsThisMonth} days</p>
          <span className="text-[10px] text-slate-500 block">Workout sessions</span>
        </div>
      </div>

      {/* Expiry Warning Callout Banner if <= 7 days */}
      {isExpiringSoon && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Your membership expires in {daysLeft} days!</span>
              <p className="text-amber-300/80 mt-0.5">
                Renew your plan now to continue gym access without interruption.
              </p>
            </div>
          </div>
          <Link
            to="/me/payments"
            className="px-3.5 py-1.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-400 transition-colors self-start sm:self-auto"
          >
            Renew Plan
          </Link>
        </div>
      )}

      {/* Grid: Recent Attendance & Assigned Regimes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Recent Workouts</h2>
            </div>
            <Link
              to="/me/attendance"
              className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
            >
              History <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentAttendance.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
              No recent attendance check-ins recorded.
            </div>
          ) : (
            <div className="space-y-2">
              {recentAttendance.map((a) => (
                <div
                  key={a.attendance_date}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <span className="font-medium text-slate-200">
                    {formatDate(a.attendance_date)}
                  </span>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-emerald-400">In: {a.check_in_time || '—'}</span>
                    <span className="text-cyan-400">Out: {a.checkout_time || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Regimes */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">My Diet & Workouts</h2>
            </div>
            <Link
              to="/me/programs"
              className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {assignedPrograms.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
              No fitness programs assigned to you yet. Ask your trainer for a diet & workout plan!
            </div>
          ) : (
            <div className="space-y-2.5">
              {assignedPrograms.slice(0, 3).map((p) => {
                const prog = p.fitness_program;
                const isDiet = prog?.program_type === 'Diet';
                const name = isDiet
                  ? prog?.diet_plan?.diet_name
                  : prog?.workout_plan?.workout_name;
                return (
                  <div
                    key={p.program_id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-200">{name || p.program_id}</span>
                      <span className="block text-[10px] text-slate-500">
                        {isDiet
                          ? `${prog?.diet_plan?.calories} kcal • ${prog?.diet_plan?.meal_type}`
                          : `${prog?.workout_plan?.duration} mins • ${prog?.workout_plan?.difficulty_level}`}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isDiet
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-cyan-500/10 text-cyan-400'
                      }`}
                    >
                      {prog?.program_type}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
