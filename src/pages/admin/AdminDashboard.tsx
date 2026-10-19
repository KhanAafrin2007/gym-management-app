import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CreditCard,
  TrendingUp,
  Clock,
  AlertTriangle,
  Wrench,
  ArrowUpRight,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { membershipService } from '../../services/membershipService';
import { memberService } from '../../services/memberService';
import { paymentService } from '../../services/paymentService';
import { equipmentService } from '../../services/equipmentService';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import type { ExpiringMembershipView } from '../../types/database';

export const AdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    activeMembers: 0,
    activeMemberships: 0,
    monthRevenue: 0,
    pendingPaymentsCount: 0,
    equipmentUnderRepair: 0,
  });
  const [expiringList, setExpiringList] = useState<ExpiringMembershipView[]>([]);
  const [modeBreakdown, setModeBreakdown] = useState<{ mode: string; count: number; total: number }[]>([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<{ month: string; total: number }[]>([]);
  const [isExpiringRunning, setIsExpiringRunning] = useState(false);

  const { success, handleApiError } = useToast();

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonthStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // 1. Parallel queries using robust service methods
      const [
        members,
        memberships,
        payments,
        expiring,
        equipmentList,
      ] = await Promise.all([
        memberService.getMembers({ isActive: true }),
        membershipService.getMemberships({ status: 'Active' }),
        paymentService.getPayments(),
        membershipService.getExpiringMemberships(),
        equipmentService.getEquipment(),
      ]);

      const activeMembersCount = members.length;
      const activeMembershipsCount = memberships.length;
      const underRepairCount = equipmentList.filter((e) => e.status === 'Under Repair').length;
      
      // Calculate revenue this month (Completed payments)
      let monthRev = 0;
      let pendingCount = 0;
      const modes: Record<string, { count: number; total: number }> = {
        Cash: { count: 0, total: 0 },
        Card: { count: 0, total: 0 },
        UPI: { count: 0, total: 0 },
        NetBanking: { count: 0, total: 0 },
      };

      const monthMap: Record<string, number> = {};

      payments.forEach((p) => {
        if (p.payment_status === 'Pending') {
          pendingCount += 1;
        }

        if (p.payment_status === 'Completed') {
          const amt = Number(p.amount) || 0;
          if (p.payment_date?.startsWith(currentMonthStr)) {
            monthRev += amt;
          }

          // Modes breakdown
          const mode = p.payment_mode || 'Cash';
          if (!modes[mode]) modes[mode] = { count: 0, total: 0 };
          modes[mode].count += 1;
          modes[mode].total += amt;

          // Monthly aggregation (last 6 months)
          if (p.payment_date) {
            const m = p.payment_date.substring(0, 7); // YYYY-MM
            monthMap[m] = (monthMap[m] || 0) + amt;
          }
        }
      });

      // Format monthly revenue array
      const sortedMonths = Object.keys(monthMap).sort();
      const lastMonths = sortedMonths.slice(-6);
      const monthlyData = lastMonths.map((m) => {
        const [yr, mo] = m.split('-');
        const dateObj = new Date(parseInt(yr), parseInt(mo) - 1, 1);
        return {
          month: dateObj.toLocaleDateString('en-US', { month: 'short' }),
          total: monthMap[m],
        };
      });

      setStats({
        activeMembers: activeMembersCount,
        activeMemberships: activeMembershipsCount,
        monthRevenue: monthRev,
        pendingPaymentsCount: pendingCount,
        equipmentUnderRepair: underRepairCount,
      });

      setExpiringList(expiring || []);
      setMonthlyRevenueData(monthlyData.length > 0 ? monthlyData : [{ month: 'Current', total: monthRev }]);
      setModeBreakdown(
        Object.entries(modes).map(([mode, val]) => ({
          mode,
          count: val.count,
          total: val.total,
        }))
      );
    } catch (err) {
      handleApiError(err, 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleExpireMemberships = async () => {
    setIsExpiringRunning(true);
    try {
      const count = await membershipService.expireMembershipsRpc();
      success('Memberships updated', `${count} past-due memberships were marked Expired.`);
      await loadDashboardData();
    } catch (err) {
      handleApiError(err, 'Failed to run expire_memberships procedure');
    } finally {
      setIsExpiringRunning(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading GymFlow Admin Dashboard..." />;
  }

  const maxRevenue = Math.max(...monthlyRevenueData.map((d) => d.total), 1);
  const totalModeAmount = modeBreakdown.reduce((sum, m) => sum + m.total, 0) || 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Admin Command Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time gym performance, active operations, and financial metrics.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExpireMemberships}
            disabled={isExpiringRunning}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            title="Runs expire_memberships() stored function"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isExpiringRunning ? 'animate-spin' : ''}`} />
            Run Expire Check
          </button>
          <button
            onClick={loadDashboardData}
            className="p-2 text-xs font-semibold rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Active Members */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Members
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{stats.activeMembers}</p>
          <Link
            to="/admin/members"
            className="text-[11px] font-semibold text-emerald-400 hover:underline inline-flex items-center gap-1 mt-2"
          >
            Manage members <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Active Memberships */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Plans
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{stats.activeMemberships}</p>
          <Link
            to="/admin/plans"
            className="text-[11px] font-semibold text-cyan-400 hover:underline inline-flex items-center gap-1 mt-2"
          >
            View memberships <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* This Month's Revenue */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Month Revenue
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-400 mt-2 truncate">
            {formatCurrency(stats.monthRevenue)}
          </p>
          <span className="text-[10px] text-slate-500 mt-2 block">Completed payments</span>
        </div>

        {/* Pending Payments */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pending Queue
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{stats.pendingPaymentsCount}</p>
          <Link
            to="/admin/reports"
            className="text-[11px] font-semibold text-amber-400 hover:underline inline-flex items-center gap-1 mt-2"
          >
            Review payments <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Expiring Soon */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Expiring (7d)
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-400 mt-2">{expiringList.length}</p>
          <span className="text-[10px] text-slate-500 mt-2 block">Action required</span>
        </div>

        {/* Equipment Under Repair */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Under Repair
            </span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-orange-400 mt-2">{stats.equipmentUnderRepair}</p>
          <Link
            to="/admin/equipment"
            className="text-[11px] font-semibold text-orange-400 hover:underline inline-flex items-center gap-1 mt-2"
          >
            View equipment <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Monthly Revenue Trend</h2>
              <p className="text-xs text-slate-400">Completed payments overview</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">
              {formatCurrency(monthlyRevenueData.reduce((s, c) => s + c.total, 0))} Total
            </span>
          </div>

          <div className="pt-6 pb-2">
            <div className="h-44 flex items-end justify-between gap-3">
              {monthlyRevenueData.map((item, idx) => {
                const heightPercent = Math.round((item.total / maxRevenue) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatCurrency(item.total)}
                    </div>
                    <div className="w-full bg-slate-800 rounded-t-xl overflow-hidden flex items-end h-full">
                      <div
                        style={{ height: `${Math.max(heightPercent, 8)}%` }}
                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl transition-all duration-500 group-hover:brightness-110"
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-400">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Payments by Mode */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Payments by Mode</h2>
            <p className="text-xs text-slate-400">Distribution across payment channels</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {modeBreakdown.map((item) => {
              const percent = Math.round((item.total / totalModeAmount) * 100);
              const barColors: Record<string, string> = {
                Cash: 'bg-emerald-500',
                Card: 'bg-cyan-500',
                UPI: 'bg-purple-500',
                NetBanking: 'bg-amber-500',
              };
              const colorClass = barColors[item.mode] || 'bg-slate-500';

              return (
                <div key={item.mode} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                      <span className="font-semibold text-slate-200">{item.mode}</span>
                      <span className="text-[11px] text-slate-500">({item.count} txns)</span>
                    </div>
                    <div className="font-mono text-slate-300">
                      {formatCurrency(item.total)}{' '}
                      <span className="text-slate-500 text-[11px]">({percent}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className={`h-full rounded-full ${colorClass} transition-all duration-500`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expiring Memberships in 7 Days (From View) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Expiring Memberships in 7 Days ({expiringList.length})
              </h2>
              <p className="text-xs text-slate-400">
                Data generated live from view <code className="font-mono text-slate-300">expiring_memberships</code>
              </p>
            </div>
          </div>
          <Link
            to="/admin/plans"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            Manage Plans <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {expiringList.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800/80">
            No memberships are expiring within the next 7 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Membership ID</th>
                  <th className="py-3 px-3">Member</th>
                  <th className="py-3 px-3">Plan</th>
                  <th className="py-3 px-3">End Date</th>
                  <th className="py-3 px-3">Days Left</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {expiringList.map((m) => (
                  <tr key={m.membership_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-300">
                      {m.membership_id}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-100">
                      {m.f_name} {m.l_name}
                      <span className="block text-[10px] font-mono text-slate-500">
                        ID: {m.member_id}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{m.plan_name}</td>
                    <td className="py-3 px-3 text-slate-300">{formatDate(m.end_date)}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                          m.days_left <= 2
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {m.days_left} {m.days_left === 1 ? 'day' : 'days'} left
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/admin/members/${m.member_id}`}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
                      >
                        View & Renew
                      </Link>
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
