import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  CreditCard,
  Clock,
  Activity,
  MessageSquare,
  Plus,
  Star,
  Printer,
} from 'lucide-react';
import { memberService } from '../../services/memberService';
import { membershipService } from '../../services/membershipService';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { useToast } from '../../context/ToastContext';
import type {
  Member,
  Membership,
  Payment,
  Attendance,
  Feedback,
  MemberProgram,
  MembershipPlan,
} from '../../types/database';

export const AdminMemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [memberData, setMemberData] = useState<{
    member: Member;
    memberships: Membership[];
    payments: Payment[];
    attendance: Attendance[];
    feedback: Feedback[];
    programs: MemberProgram[];
  } | null>(null);

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'memberships' | 'payments' | 'attendance' | 'programs' | 'feedback'>('memberships');

  // New Membership Modal
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receipt Modal
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);

  const { success, handleApiError } = useToast();

  const loadMemberDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [details, plansList] = await Promise.all([
        memberService.getMemberById(id),
        membershipService.getPlans(),
      ]);
      setMemberData(details);
      setPlans(plansList);
      if (plansList.length > 0) setSelectedPlanId(plansList[0].plan_id);
    } catch (err) {
      handleApiError(err, 'Failed to load member profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMemberDetails();
  }, [id]);

  const handleCreateMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedPlanId) return;
    setIsSubmitting(true);
    try {
      await membershipService.createMembership({
        member_id: id,
        plan_id: selectedPlanId,
      });
      success('Membership activated successfully!');
      setIsRenewModalOpen(false);
      await loadMemberDetails();
    } catch (err) {
      handleApiError(err, 'Failed to create membership');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !memberData) {
    return <LoadingSpinner size="lg" label="Loading member records..." />;
  }

  const { member, memberships, payments, attendance, feedback, programs } = memberData;
  const totalPaid = payments
    .filter((p) => p.payment_status === 'Completed')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center gap-3">
        <Link
          to="/admin/members"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">
              {member.f_name} {member.l_name}
            </h1>
            <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              {member.member_id}
            </span>
            <StatusBadge status={member.is_active ? 'Active' : 'Inactive'} size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Joined {formatDate(member.join_date)}
          </p>
        </div>
      </div>

      {/* Member Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Contact Info */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Contact Details
          </span>
          <div className="text-xs text-slate-300 space-y-1.5 pt-1">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{member.phone_no}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate">{member.email || 'No email registered'}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span className="truncate">{member.address || 'No address provided'}</span>
            </div>
          </div>
        </div>

        {/* Batch & Trainer */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Gym Assignment
          </span>
          <div className="text-xs text-slate-300 space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Batch:</span>
              <span className="font-semibold text-slate-200">
                {member.batch ? member.batch.batch_name : 'None'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Timing:</span>
              <span className="font-mono text-slate-300">
                {member.batch ? member.batch.batch_time : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Trainer:</span>
              <span className="font-semibold text-emerald-400">
                {member.trainer ? member.trainer.trainer_name : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Revenue
          </span>
          <p className="text-2xl font-black text-emerald-400 pt-1">
            {formatCurrency(totalPaid)}
          </p>
          <span className="text-[10px] text-slate-500 block">
            Across {payments.filter((p) => p.payment_status === 'Completed').length} transactions
          </span>
        </div>

        {/* Attendance Summary */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Gym Check-ins
          </span>
          <p className="text-2xl font-black text-cyan-400 pt-1">{attendance.length}</p>
          <span className="text-[10px] text-slate-500 block">Total recorded visits</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('memberships')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'memberships'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Memberships ({memberships.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'payments'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Payments ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          Attendance ({attendance.length})
        </button>

        <button
          onClick={() => setActiveTab('programs')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'programs'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Assigned Programs ({programs.length})
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'feedback'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Feedback ({feedback.length})
        </button>
      </div>

      {/* Tab 1: Memberships */}
      {activeTab === 'memberships' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-200">Membership History</h3>
            <button
              onClick={() => setIsRenewModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New / Renew Membership
            </button>
          </div>

          {memberships.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800">
              No membership subscriptions found for this member.
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                    <th className="py-3 px-4">Membership ID</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Start Date</th>
                    <th className="py-3 px-4">End Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {memberships.map((ms) => (
                    <tr key={ms.membership_id} className="hover:bg-slate-800/20">
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">
                        {ms.membership_id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-100">
                        {ms.membership_plan?.plan_name || ms.plan_id}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{formatDate(ms.start_date)}</td>
                      <td className="py-3 px-4 text-slate-300">{formatDate(ms.end_date)}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={ms.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Payments */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Payment Transactions</h3>
          {payments.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800">
              No payment transactions on record.
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                    <th className="py-3 px-4">Payment ID</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {payments.map((p) => (
                    <tr key={p.payment_id} className="hover:bg-slate-800/20">
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">
                        {p.payment_id}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{p.payment_mode}</td>
                      <td className="py-3 px-4 text-slate-400">{formatDate(p.payment_date)}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={p.payment_status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {p.payment_status === 'Completed' ? (
                          <button
                            onClick={() =>
                              setSelectedPaymentForReceipt({
                                ...p,
                                member,
                              })
                            }
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
          )}
        </div>
      )}

      {/* Tab 3: Attendance */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Attendance Log</h3>
          {attendance.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800">
              No attendance records logged for this member.
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Check-in Time</th>
                    <th className="py-3 px-4">Check-out Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {attendance.map((a) => (
                    <tr key={a.attendance_date} className="hover:bg-slate-800/20">
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {formatDate(a.attendance_date)}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400">
                        {a.check_in_time || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-400">
                        {a.checkout_time || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Assigned Programs */}
      {activeTab === 'programs' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Assigned Fitness Programs</h3>
          {programs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800">
              No diet or workout programs assigned yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map((mp) => {
                const prog = mp.fitness_program;
                const isDiet = prog?.program_type === 'Diet';
                return (
                  <div
                    key={mp.program_id}
                    className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        {mp.program_id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isDiet
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {prog?.program_type}
                      </span>
                    </div>

                    {isDiet && prog?.diet_plan && (
                      <div className="space-y-1.5 text-xs">
                        <p className="font-bold text-slate-100 text-sm">
                          {prog.diet_plan.diet_name}
                        </p>
                        <p className="text-slate-400">
                          Meal: <span className="text-slate-200">{prog.diet_plan.meal}</span> ({prog.diet_plan.meal_type})
                        </p>
                        <p className="text-amber-400 font-mono">
                          {prog.diet_plan.calories} kcal
                        </p>
                      </div>
                    )}

                    {!isDiet && prog?.workout_plan && (
                      <div className="space-y-1.5 text-xs">
                        <p className="font-bold text-slate-100 text-sm">
                          {prog.workout_plan.workout_name}
                        </p>
                        <p className="text-slate-400">
                          Difficulty:{' '}
                          <span className="text-slate-200 font-semibold">
                            {prog.workout_plan.difficulty_level}
                          </span>
                        </p>
                        <p className="text-cyan-400 font-mono">
                          {prog.workout_plan.duration} mins
                        </p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
                      <span>Assigned: {formatDate(mp.assigned_date)}</span>
                      <span>Trainer: {prog?.trainer?.trainer_name || 'Assigned'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Feedback */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Feedback Submitted</h3>
          {feedback.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800">
              No feedback submitted by this member.
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((fb) => (
                <div
                  key={fb.feedback_id}
                  className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < fb.ratings ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold ml-1">{fb.ratings} / 5</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDate(fb.feedback_date)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 italic">"{fb.comments || 'No comment'}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New / Renew Membership Modal */}
      <Modal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        title="Create / Renew Membership"
        description={`Activate a membership plan for ${member.f_name} ${member.l_name || ''}`}
        maxWidth="md"
      >
        <form onSubmit={handleCreateMembership} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Membership Plan
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {plans.map((pl) => (
                <option key={pl.plan_id} value={pl.plan_id}>
                  {pl.plan_name} — {formatCurrency(pl.fee)} ({pl.duration} {pl.duration === 1 ? 'month' : 'months'})
                </option>
              ))}
            </select>
          </div>

          <p className="text-[11px] text-slate-400">
            The start date defaults to today, and the end date will be automatically computed based on the plan's duration.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsRenewModalOpen(false)}
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

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedPaymentForReceipt)}
        onClose={() => setSelectedPaymentForReceipt(null)}
        payment={selectedPaymentForReceipt}
      />
    </div>
  );
};
