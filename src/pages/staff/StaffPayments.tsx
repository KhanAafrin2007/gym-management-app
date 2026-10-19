import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  XCircle,
  Printer,
  Search,
  Filter,
  Clock,
  Layers,
  Calendar,
} from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { memberService } from '../../services/memberService';
import { membershipService } from '../../services/membershipService';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { useToast } from '../../context/ToastContext';
import type {
  Payment,
  Member,
  MembershipPlan,
  PaymentMode,
  PaymentStatus,
} from '../../types/database';

export const StaffPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs: All Payments | Pending Queue
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  // Filters for All Payments
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<PaymentMode | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');

  // Record Desk Payment Modal
  const [isDeskModalOpen, setIsDeskModalOpen] = useState(false);
  const [deskForm, setDeskForm] = useState({
    member_id: '',
    amount: 1500,
    payment_mode: 'Cash' as PaymentMode,
    plan_id: '',
  });

  // Offer Membership Modal after confirming
  const [membershipOfferMember, setMembershipOfferMember] = useState<{
    member_id: string;
    member_name: string;
  } | null>(null);
  const [selectedPlanForMember, setSelectedPlanForMember] = useState('');

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, handleApiError } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allData, pendingData, membersData, plansData] = await Promise.all([
        paymentService.getPayments(),
        paymentService.getPendingPayments(),
        memberService.getMembers({ isActive: true }),
        membershipService.getPlans(),
      ]);
      setPayments(allData);
      setPendingPayments(pendingData);
      setMembers(membersData);
      setPlans(plansData);

      if (membersData.length > 0 && !deskForm.member_id) {
        setDeskForm((prev) => ({ ...prev, member_id: membersData[0].member_id }));
      }
      if (plansData.length > 0) {
        setSelectedPlanForMember(plansData[0].plan_id);
      }
    } catch (err) {
      handleApiError(err, 'Failed to load payments queue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordDeskPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deskForm.member_id) return;
    if (deskForm.amount <= 0) {
      handleApiError('Payment amount must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      const newPayment = await paymentService.recordDeskPayment({
        member_id: deskForm.member_id,
        amount: deskForm.amount,
        payment_mode: deskForm.payment_mode,
      });

      success('Payment recorded!', `Transaction ${newPayment.payment_id} saved as Completed.`);
      setIsDeskModalOpen(false);

      // Offer to create/renew membership
      const memberObj = members.find((m) => m.member_id === deskForm.member_id);
      setMembershipOfferMember({
        member_id: deskForm.member_id,
        member_name: memberObj ? `${memberObj.f_name} ${memberObj.l_name || ''}`.trim() : deskForm.member_id,
      });

      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to record desk payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async (p: Payment) => {
    setIsSubmitting(true);
    try {
      await paymentService.confirmPayment(p.payment_id);
      success('Payment confirmed!', `Transaction ${p.payment_id} marked Completed.`);

      // Prompt to create/extend membership
      setMembershipOfferMember({
        member_id: p.member_id,
        member_name: p.member ? `${p.member.f_name} ${p.member.l_name || ''}`.trim() : p.member_id,
      });

      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to confirm payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectPayment = async (p: Payment) => {
    setIsSubmitting(true);
    try {
      await paymentService.rejectPayment(p.payment_id);
      success('Payment rejected', `Transaction ${p.payment_id} status updated to Failed.`);
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to reject payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMembershipFromOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membershipOfferMember || !selectedPlanForMember) return;

    setIsSubmitting(true);
    try {
      await membershipService.createMembership({
        member_id: membershipOfferMember.member_id,
        plan_id: selectedPlanForMember,
      });
      success('Membership activated!', `Active subscription granted to ${membershipOfferMember.member_name}.`);
      setMembershipOfferMember(null);
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to create membership subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const s = search.toLowerCase();
    const matchSearch =
      !s ||
      p.payment_id.toLowerCase().includes(s) ||
      p.member_id.toLowerCase().includes(s) ||
      p.member?.f_name?.toLowerCase().includes(s) ||
      p.member?.l_name?.toLowerCase().includes(s);

    const matchMode = modeFilter === 'all' || p.payment_mode === modeFilter;
    const matchStatus = statusFilter === 'all' || p.payment_status === statusFilter;

    return matchSearch && matchMode && matchStatus;
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading payments ledger..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Desk Payments & Approvals</h1>
          <p className="text-xs text-slate-400 mt-1">
            Accept front desk payments, approve online member transactions, and print official receipts.
          </p>
        </div>
        <button
          onClick={() => setIsDeskModalOpen(true)}
          className="px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Record Desk Payment
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-3">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending Approvals ({pendingPayments.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'all'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          All Transactions ({payments.length})
        </button>
      </div>

      {/* Tab 1: Pending Queue */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingPayments.length === 0 ? (
            <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-200">Pending Queue is Empty</h3>
              <p className="text-xs text-slate-400 mt-1">
                All member renewal requests and online simulations have been processed.
              </p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                      <th className="py-3.5 px-4">Ref ID</th>
                      <th className="py-3.5 px-4">Member Name</th>
                      <th className="py-3.5 px-4">Member ID</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Mode</th>
                      <th className="py-3.5 px-4">Requested Date</th>
                      <th className="py-3.5 px-4 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {pendingPayments.map((p) => (
                      <tr key={p.payment_id} className="hover:bg-slate-800/20">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                          {p.payment_id}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-100">
                          {p.member ? `${p.member.f_name} ${p.member.l_name}` : p.member_id}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-emerald-400">{p.member_id}</td>
                        <td className="py-3.5 px-4 font-mono font-black text-emerald-400 text-sm">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{p.payment_mode}</td>
                        <td className="py-3.5 px-4 text-slate-400">{formatDate(p.payment_date)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleConfirmPayment(p)}
                              disabled={isSubmitting}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Confirm
                            </button>
                            <button
                              onClick={() => handleRejectPayment(p)}
                              disabled={isSubmitting}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: All Payments */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID or member name..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
              <option value="NetBanking">NetBanking</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          {/* Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                    <th className="py-3.5 px-4">Ref ID</th>
                    <th className="py-3.5 px-4">Member</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPayments.map((p) => (
                    <tr key={p.payment_id} className="hover:bg-slate-800/20">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {p.payment_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-100">
                          {p.member ? `${p.member.f_name} ${p.member.l_name}` : p.member_id}
                        </span>
                        <span className="block text-[10px] font-mono text-slate-500">
                          ID: {p.member_id}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{p.payment_mode}</td>
                      <td className="py-3.5 px-4 text-slate-400">{formatDate(p.payment_date)}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.payment_status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {p.payment_status === 'Completed' ? (
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Print payment receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[10px]">N/A</span>
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

      {/* Record Desk Payment Modal */}
      <Modal
        isOpen={isDeskModalOpen}
        onClose={() => setIsDeskModalOpen(false)}
        title="Record Desk Payment"
        description="Records an in-person payment with immediate Completed status."
        maxWidth="md"
      >
        <form onSubmit={handleRecordDeskPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Select Member *
            </label>
            <select
              required
              value={deskForm.member_id}
              onChange={(e) => setDeskForm({ ...deskForm, member_id: e.target.value })}
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
              Quick Fill by Plan (Optional)
            </label>
            <select
              value={deskForm.plan_id}
              onChange={(e) => {
                const pid = e.target.value;
                const chosenPlan = plans.find((pl) => pl.plan_id === pid);
                setDeskForm({
                  ...deskForm,
                  plan_id: pid,
                  amount: chosenPlan ? chosenPlan.fee : deskForm.amount,
                });
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Custom Amount</option>
              {plans.map((pl) => (
                <option key={pl.plan_id} value={pl.plan_id}>
                  {pl.plan_name} — {formatCurrency(pl.fee)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Amount (Rs.) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={deskForm.amount}
                onChange={(e) => setDeskForm({ ...deskForm, amount: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Payment Mode
              </label>
              <select
                value={deskForm.payment_mode}
                onChange={(e) =>
                  setDeskForm({ ...deskForm, payment_mode: e.target.value as PaymentMode })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="NetBanking">NetBanking</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDeskModalOpen(false)}
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
              Complete Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Offer Membership Modal after confirming/recording */}
      {membershipOfferMember && (
        <Modal
          isOpen={Boolean(membershipOfferMember)}
          onClose={() => setMembershipOfferMember(null)}
          title="Activate Membership Plan?"
          description={`Payment received from ${membershipOfferMember.member_name}. Would you like to create or extend their membership subscription?`}
          maxWidth="md"
        >
          <form onSubmit={handleCreateMembershipFromOffer} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Choose Membership Plan
              </label>
              <select
                required
                value={selectedPlanForMember}
                onChange={(e) => setSelectedPlanForMember(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {plans.map((pl) => (
                  <option key={pl.plan_id} value={pl.plan_id}>
                    {pl.plan_name} — {formatCurrency(pl.fee)} ({pl.duration} months)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMembershipOfferMember(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Skip for Now
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
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        payment={selectedReceipt}
      />
    </div>
  );
};
