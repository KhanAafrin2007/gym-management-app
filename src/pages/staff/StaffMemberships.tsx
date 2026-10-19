import React, { useEffect, useState } from 'react';
import { Layers, Plus, Calendar, Search } from 'lucide-react';
import { membershipService } from '../../services/membershipService';
import { memberService } from '../../services/memberService';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import type { Membership, Member, MembershipPlan } from '../../types/database';

export const StaffMemberships: React.FC = () => {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    member_id: '',
    plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search
  const [search, setSearch] = useState('');

  const { success, handleApiError } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [membershipsData, membersData, plansData] = await Promise.all([
        membershipService.getMemberships(),
        memberService.getMembers({ isActive: true }),
        membershipService.getPlans(),
      ]);
      setMemberships(membershipsData);
      setMembers(membersData);
      setPlans(plansData);

      if (membersData.length > 0 && !form.member_id) {
        setForm((prev) => ({ ...prev, member_id: membersData[0].member_id }));
      }
      if (plansData.length > 0 && !form.plan_id) {
        setForm((prev) => ({ ...prev, plan_id: plansData[0].plan_id }));
      }
    } catch (err) {
      handleApiError(err, 'Failed to load memberships');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.member_id || !form.plan_id) return;

    setIsSubmitting(true);
    try {
      await membershipService.createMembership(form);
      success('Membership subscription activated!');
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to activate membership');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = memberships.filter((m) => {
    const s = search.toLowerCase();
    return (
      !s ||
      m.membership_id.toLowerCase().includes(s) ||
      m.member_id.toLowerCase().includes(s) ||
      m.member?.f_name?.toLowerCase().includes(s) ||
      m.member?.l_name?.toLowerCase().includes(s)
    );
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading membership subscriptions..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Member Subscriptions</h1>
          <p className="text-xs text-slate-400 mt-1">
            Activate or renew membership plans for gym members following payment confirmations.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Activate New Membership
        </button>
      </div>

      {/* Search */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex items-center">
        <Search className="w-4 h-4 text-slate-500 ml-2 mr-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search memberships by member name or ID..."
          className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Subscriptions Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                <th className="py-3.5 px-4">Membership ID</th>
                <th className="py-3.5 px-4">Member Name</th>
                <th className="py-3.5 px-4">Member ID</th>
                <th className="py-3.5 px-4">Plan Name</th>
                <th className="py-3.5 px-4">Start Date</th>
                <th className="py-3.5 px-4">End Date</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((m) => (
                <tr key={m.membership_id} className="hover:bg-slate-800/20">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                    {m.membership_id}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-100">
                    {m.member ? `${m.member.f_name} ${m.member.l_name}` : m.member_id}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-emerald-400">{m.member_id}</td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {m.membership_plan?.plan_name || m.plan_id}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{formatDate(m.start_date)}</td>
                  <td className="py-3.5 px-4 text-slate-300 font-medium">
                    {formatDate(m.end_date)}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={m.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activate Membership Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Activate Member Membership"
        description="Select client and choose a membership plan duration."
        maxWidth="md"
      >
        <form onSubmit={handleCreateMembership} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Select Member *
            </label>
            <select
              required
              value={form.member_id}
              onChange={(e) => setForm({ ...form, member_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {members.map((m) => (
                <option key={m.member_id} value={m.member_id}>
                  {m.f_name} {m.l_name} ({m.member_id}) — {m.phone_no}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Select Plan *
            </label>
            <select
              required
              value={form.plan_id}
              onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {plans.map((p) => (
                <option key={p.plan_id} value={p.plan_id}>
                  {p.plan_name} — {formatCurrency(p.fee)} ({p.duration} mo)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Start Date
            </label>
            <input
              type="date"
              required
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
              Activate Membership
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
