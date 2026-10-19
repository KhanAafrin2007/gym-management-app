import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Plus,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Smartphone,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/paymentService';
import { membershipService } from '../../services/membershipService';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { useToast } from '../../context/ToastContext';
import type { Payment, MembershipPlan, PaymentMode } from '../../types/database';

export const MemberPayments: React.FC = () => {
  const { appUser } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Online Pay / Renew Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payType, setPayType] = useState<'online' | 'desk'>('online');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(1500);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');

  // Simulated fields
  const [upiId, setUpiId] = useState('user@okaxis');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [bankName, setBankName] = useState('HDFC Bank');

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, handleApiError } = useToast();

  const loadData = async () => {
    if (!appUser?.member_id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [paymentsData, plansData] = await Promise.all([
        paymentService.getPayments({ memberId: appUser.member_id }),
        membershipService.getPlans(),
      ]);
      setPayments(paymentsData);
      setPlans(plansData);

      if (plansData.length > 0 && !selectedPlanId) {
        setSelectedPlanId(plansData[0].plan_id);
        setPaymentAmount(plansData[0].fee);
      }
    } catch (err) {
      handleApiError(err, 'Failed to load your payment transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [appUser?.member_id]);

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const chosen = plans.find((p) => p.plan_id === planId);
    if (chosen) {
      setPaymentAmount(chosen.fee);
    }
  };

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser?.member_id) return;
    if (paymentAmount <= 0) {
      handleApiError('Payment amount must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      const mode = payType === 'desk' ? 'Cash' : paymentMode;
      const res = await paymentService.createMemberPayment({
        member_id: appUser.member_id,
        amount: paymentAmount,
        payment_mode: mode,
      });

      success(
        'Payment Request Submitted!',
        `Transaction ${res.payment_id} recorded as Pending. Awaiting confirmation by gym staff.`
      );
      setIsPayModalOpen(false);
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to initiate payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading your payment history..." />;
  }

  const completedTotal = payments
    .filter((p) => p.payment_status === 'Completed')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingCount = payments.filter((p) => p.payment_status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Payments & Subscription Renewal</h1>
          <p className="text-xs text-slate-400 mt-1">
            Renew your membership plan, start online payments, and download official receipts.
          </p>
        </div>
        <button
          onClick={() => {
            setPayType('online');
            setPaymentMode('UPI');
            setIsPayModalOpen(true);
          }}
          className="px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <CreditCard className="w-4 h-4" />
          Pay Now / Renew Plan
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Completed Payments
          </span>
          <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {formatCurrency(completedTotal)}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Active gym ledger</span>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Awaiting Staff Confirmation
          </span>
          <p className="text-2xl font-black text-amber-400 mt-1">{pendingCount} requests</p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Will be activated upon staff verification
          </span>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Desk Payment Option
          </span>
          <p className="text-sm font-bold text-slate-200 mt-1">Cash at Gym Counter</p>
          <button
            onClick={() => {
              setPayType('desk');
              setPaymentMode('Cash');
              setIsPayModalOpen(true);
            }}
            className="text-xs font-semibold text-emerald-400 hover:underline mt-2 inline-block"
          >
            Request Pay at Desk &rarr;
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-200">
          Your Payment History ({payments.length})
        </h2>

        {payments.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center">
            <CreditCard className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-200">No payment records yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Start your first gym membership subscription using the Pay Now button above.
            </p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                    <th className="py-3.5 px-4">Receipt Ref</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Payment Mode</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {payments.map((p) => (
                    <tr key={p.payment_id} className="hover:bg-slate-800/20">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {p.payment_id}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{p.payment_mode}</td>
                      <td className="py-3.5 px-4 text-slate-400">{formatDate(p.payment_date)}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.payment_status} size="sm" />
                        {p.payment_status === 'Pending' && (
                          <span className="block text-[10px] text-amber-400/90 mt-0.5">
                            Awaiting confirmation by gym staff
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {p.payment_status === 'Completed' ? (
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors inline-flex items-center gap-1.5"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print Receipt
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            Available after confirmation
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

      {/* Pay Now / Renew Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={payType === 'online' ? 'Pay Now / Renew Membership' : 'Request Pay at Desk (Cash)'}
        description="Choose a membership plan and payment method."
        maxWidth="md"
      >
        <form onSubmit={handleStartPayment} className="space-y-4">
          {/* Method selector */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setPayType('online');
                setPaymentMode('UPI');
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                payType === 'online'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Online Payment (Simulated)
            </button>
            <button
              type="button"
              onClick={() => {
                setPayType('desk');
                setPaymentMode('Cash');
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                payType === 'desk'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pay at Desk (Cash)
            </button>
          </div>

          {/* Plan selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Membership Plan *
            </label>
            <select
              required
              value={selectedPlanId}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {plans.map((p) => (
                <option key={p.plan_id} value={p.plan_id}>
                  {p.plan_name} — {formatCurrency(p.fee)} ({p.duration} mo)
                </option>
              ))}
            </select>
          </div>

          {/* Amount Display */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Due</span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              {formatCurrency(paymentAmount)}
            </span>
          </div>

          {/* Online Channels */}
          {payType === 'online' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'Card', 'NetBanking'] as PaymentMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMode(m)}
                      className={`p-2 rounded-xl text-xs font-bold transition-all border text-center ${
                        paymentMode === m
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Realistic payment input fields */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-amber-400">
                  <span className="font-bold flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Online Payment Gateway
                  </span>
                  <span className="text-[10px] text-slate-500">Secure Gateway</span>
                </div>

                {paymentMode === 'UPI' && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Virtual Payment Address (VPA / UPI ID)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                )}

                {paymentMode === 'Card' && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
                    />
                  </div>
                )}

                {paymentMode === 'NetBanking' && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Select Bank
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="State Bank of India">State Bank of India</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Axis Bank">Axis Bank</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {payType === 'desk' && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              This request generates a Pending Cash payment in the staff queue. You can hand over
              the cash amount directly at the front desk to have it confirmed.
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
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
              {payType === 'online' ? 'Authorize Payment' : 'Submit Cash Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        payment={selectedReceipt}
      />
    </div>
  );
};
