import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Plus,
  RefreshCw,
  Edit2,
  Calendar,
  XCircle,
  Layers,
  Clock,
  Search,
} from 'lucide-react';
import { membershipService } from '../../services/membershipService';
import { memberService } from '../../services/memberService';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import type { MembershipPlan, Membership, Member } from '../../types/database';

export const AdminPlans: React.FC = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpiringRunning, setIsExpiringRunning] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'plans' | 'memberships'>('plans');

  // Search in memberships
  const [membershipSearch, setMembershipSearch] = useState('');
  const [membershipStatusFilter, setMembershipStatusFilter] = useState('all');

  // Plan modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    plan_name: '',
    plan_description: '',
    fee: 1500,
    duration: 1,
  });

  // New Membership Modal
  const [isNewMembershipModalOpen, setIsNewMembershipModalOpen] = useState(false);
  const [newMembershipForm, setNewMembershipForm] = useState({
    member_id: '',
    plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
  });

  // Cancel dialog
  const [cancelMembershipTarget, setCancelMembershipTarget] = useState<Membership | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, handleApiError } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [plansData, membershipsData, membersData] = await Promise.all([
        membershipService.getPlans(),
        membershipService.getMemberships(),
        memberService.getMembers({ isActive: 'all' }),
      ]);
      setPlans(plansData);
      setMemberships(membershipsData);
      setMembers(membersData);
      if (plansData.length > 0 && !newMembershipForm.plan_id) {
        setNewMembershipForm((prev) => ({ ...prev, plan_id: plansData[0].plan_id }));
      }
      if (membersData.length > 0 && !newMembershipForm.member_id) {
        setNewMembershipForm((prev) => ({ ...prev, member_id: membersData[0].member_id }));
      }
    } catch (err) {
      handleApiError(err, 'Failed to load membership plans and subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddPlan = () => {
    setEditingPlan(null);
    setPlanForm({
      plan_name: '',
      plan_description: '',
      fee: 1500,
      duration: 1,
    });
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      plan_name: plan.plan_name,
      plan_description: plan.plan_description || '',
      fee: plan.fee,
      duration: plan.duration,
    });
    setIsPlanModalOpen(true);
  };

  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (planForm.fee <= 0) {
      handleApiError('Fee must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPlan) {
        await membershipService.updatePlan(editingPlan.plan_id, planForm);
        success('Plan updated successfully!');
      } else {
        await membershipService.createPlan(planForm);
        success('New membership plan created!');
      }
      setIsPlanModalOpen(false);
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to save plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMembershipForm.member_id || !newMembershipForm.plan_id) return;

    setIsSubmitting(true);
    try {
      await membershipService.createMembership({
        member_id: newMembershipForm.member_id,
        plan_id: newMembershipForm.plan_id,
        start_date: newMembershipForm.start_date,
      });
      success('Membership assigned and activated!');
      setIsNewMembershipModalOpen(false);
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to create membership');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelMembershipTarget) return;
    setIsSubmitting(true);
    try {
      await membershipService.cancelMembership(cancelMembershipTarget.membership_id);
      success('Membership cancelled', `Membership ${cancelMembershipTarget.membership_id} marked Cancelled.`);
      setCancelMembershipTarget(null);
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to cancel membership');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpireMembershipsRpc = async () => {
    setIsExpiringRunning(true);
    try {
      const count = await membershipService.expireMembershipsRpc();
      success('Expire check complete', `${count} memberships updated to Expired status.`);
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to run expire_memberships procedure');
    } finally {
      setIsExpiringRunning(false);
    }
  };

  const filteredMemberships = memberships.filter((m) => {
    const s = membershipSearch.toLowerCase();
    const matchSearch =
      !s ||
      m.membership_id.toLowerCase().includes(s) ||
      m.member_id.toLowerCase().includes(s) ||
      m.member?.f_name?.toLowerCase().includes(s) ||
      m.member?.l_name?.toLowerCase().includes(s);

    const matchStatus =
      membershipStatusFilter === 'all' || m.status === membershipStatusFilter;

    return matchSearch && matchStatus;
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading membership plans and records..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Membership Plans & Subscriptions</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure pricing tiers, manage client memberships, and trigger expiration audits.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExpireMembershipsRpc}
            disabled={isExpiringRunning}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            title="Runs database function expire_memberships()"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isExpiringRunning ? 'animate-spin' : ''}`} />
            Run Expire Check
          </button>
          {activeTab === 'plans' ? (
            <button
              onClick={handleOpenAddPlan}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Plan
            </button>
          ) : (
            <button
              onClick={() => setIsNewMembershipModalOpen(true)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Membership
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-3">
        <button
          onClick={() => setActiveTab('plans')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'plans'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Plans Catalog ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('memberships')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'memberships'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Active Subscriptions ({memberships.length})
        </button>
      </div>

      {/* Plans View */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => (
            <div
              key={p.plan_id}
              className="glass-panel p-5 rounded-3xl border border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400">{p.plan_id}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    {p.duration} {p.duration === 1 ? 'Month' : 'Months'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-2">{p.plan_name}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[36px]">
                  {p.plan_description || 'Standard gym access package.'}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <span className="text-xs text-slate-400">Subscription Fee</span>
                  <p className="text-2xl font-black text-emerald-400 font-mono">
                    {formatCurrency(p.fee)}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => handleOpenEditPlan(p)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Memberships Subscriptions View */}
      {activeTab === 'memberships' && (
        <div className="space-y-4">
          <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={membershipSearch}
                onChange={(e) => setMembershipSearch(e.target.value)}
                placeholder="Search memberships by member name or ID..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <select
              value={membershipStatusFilter}
              onChange={(e) => setMembershipStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                    <th className="py-3 px-4">Membership ID</th>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Plan Name</th>
                    <th className="py-3 px-4">Start Date</th>
                    <th className="py-3 px-4">End Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMemberships.map((m) => (
                    <tr key={m.membership_id} className="hover:bg-slate-800/20">
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">
                        {m.membership_id}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-100">
                          {m.member ? `${m.member.f_name} ${m.member.l_name}` : m.member_id}
                        </span>
                        <span className="block text-[10px] font-mono text-slate-500">
                          ID: {m.member_id}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {m.membership_plan?.plan_name || m.plan_id}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{formatDate(m.start_date)}</td>
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {formatDate(m.end_date)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={m.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {m.status === 'Active' ? (
                          <button
                            onClick={() => setCancelMembershipTarget(m)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Plan Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={editingPlan ? `Edit Plan: ${editingPlan.plan_id}` : 'Create New Membership Plan'}
        description="Define pricing and duration for the membership package."
        maxWidth="md"
      >
        <form onSubmit={handleSubmitPlan} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Plan Name *
            </label>
            <input
              type="text"
              required
              value={planForm.plan_name}
              onChange={(e) => setPlanForm({ ...planForm, plan_name: e.target.value })}
              placeholder="e.g. Quarterly Pro"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Description
            </label>
            <input
              type="text"
              value={planForm.plan_description}
              onChange={(e) => setPlanForm({ ...planForm, plan_description: e.target.value })}
              placeholder="e.g. 3-month access with diet plan"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Fee (Rs.) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={planForm.fee}
                onChange={(e) => setPlanForm({ ...planForm, fee: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Duration (Months) *
              </label>
              <input
                type="number"
                min="1"
                max="36"
                required
                value={planForm.duration}
                onChange={(e) => setPlanForm({ ...planForm, duration: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(false)}
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
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* New Membership Modal */}
      <Modal
        isOpen={isNewMembershipModalOpen}
        onClose={() => setIsNewMembershipModalOpen(false)}
        title="Activate Member Subscription"
        description="Select member, plan, and starting date."
        maxWidth="md"
      >
        <form onSubmit={handleCreateMembership} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Select Member *
            </label>
            <select
              required
              value={newMembershipForm.member_id}
              onChange={(e) =>
                setNewMembershipForm({ ...newMembershipForm, member_id: e.target.value })
              }
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
              Select Plan *
            </label>
            <select
              required
              value={newMembershipForm.plan_id}
              onChange={(e) =>
                setNewMembershipForm({ ...newMembershipForm, plan_id: e.target.value })
              }
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
              value={newMembershipForm.start_date}
              onChange={(e) =>
                setNewMembershipForm({ ...newMembershipForm, start_date: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewMembershipModalOpen(false)}
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
              Activate Subscription
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Dialog */}
      {cancelMembershipTarget && (
        <ConfirmDialog
          isOpen={Boolean(cancelMembershipTarget)}
          onClose={() => setCancelMembershipTarget(null)}
          onConfirm={handleCancelConfirm}
          isLoading={isSubmitting}
          title="Cancel Membership"
          message={`Are you sure you want to cancel subscription ${cancelMembershipTarget.membership_id}? The member's status will be marked Cancelled.`}
          confirmLabel="Cancel Membership"
          variant="danger"
        />
      )}
    </div>
  );
};
