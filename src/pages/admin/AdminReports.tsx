import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  CreditCard,
  Clock,
  Users,
  RotateCcw,
  Trash2,
  Calendar,
  Printer,
} from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { attendanceService } from '../../services/attendanceService';
import { memberService } from '../../services/memberService';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { useToast } from '../../context/ToastContext';
import type { Payment, Attendance, Member, PaymentMode, PaymentStatus } from '../../types/database';

export const AdminReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'payments' | 'attendance' | 'members'>('payments');
  const [isLoading, setIsLoading] = useState(true);

  // Payments Report state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentModeFilter, setPaymentModeFilter] = useState<PaymentMode | 'all'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Attendance Report state
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  // Members Report state
  const [members, setMembers] = useState<Member[]>([]);

  // Action dialogs for Admin
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, handleApiError } = useToast();

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'payments') {
        const data = await paymentService.getPayments({
          paymentMode: paymentModeFilter,
          paymentStatus: paymentStatusFilter,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        setPayments(data);
      } else if (activeTab === 'attendance') {
        const data = await attendanceService.getAllAttendance(
          startDate || undefined,
          endDate || undefined
        );
        setAttendance(data);
      } else if (activeTab === 'members') {
        const data = await memberService.getMembers({ isActive: 'all' });
        setMembers(data);
      }
    } catch (err) {
      handleApiError(err, 'Failed to fetch report data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeTab, paymentModeFilter, paymentStatusFilter, startDate, endDate]);

  // CSV Export helper
  const exportToCSV = (filename: string, rows: any[], headers: string[]) => {
    if (!rows || rows.length === 0) {
      handleApiError('No rows available to export');
      return;
    }

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Export generated', `Downloaded ${filename}.csv`);
  };

  const handleExportPaymentsCSV = () => {
    const formatted = payments.map((p) => ({
      payment_id: p.payment_id,
      member_id: p.member_id,
      member_name: p.member ? `${p.member.f_name} ${p.member.l_name || ''}`.trim() : '',
      amount: p.amount,
      payment_mode: p.payment_mode,
      payment_date: p.payment_date,
      payment_status: p.payment_status,
    }));
    exportToCSV(
      'gymflow_payments_report',
      formatted,
      ['payment_id', 'member_id', 'member_name', 'amount', 'payment_mode', 'payment_date', 'payment_status']
    );
  };

  const handleExportAttendanceCSV = () => {
    const formatted = attendance.map((a) => ({
      member_id: a.member_id,
      member_name: a.member ? `${a.member.f_name} ${a.member.l_name || ''}`.trim() : '',
      attendance_date: a.attendance_date,
      check_in_time: a.check_in_time || '',
      checkout_time: a.checkout_time || '',
    }));
    exportToCSV(
      'gymflow_attendance_report',
      formatted,
      ['member_id', 'member_name', 'attendance_date', 'check_in_time', 'checkout_time']
    );
  };

  const handleExportMembersCSV = () => {
    const formatted = members.map((m) => ({
      member_id: m.member_id,
      f_name: m.f_name,
      l_name: m.l_name || '',
      gender: m.gender || '',
      dob: m.dob || '',
      phone_no: m.phone_no,
      email: m.email || '',
      batch_id: m.batch_id || '',
      trainer_id: m.trainer_id || '',
      join_date: m.join_date,
      is_active: m.is_active ? 'Active' : 'Inactive',
    }));
    exportToCSV(
      'gymflow_members_report',
      formatted,
      ['member_id', 'f_name', 'l_name', 'gender', 'dob', 'phone_no', 'email', 'batch_id', 'trainer_id', 'join_date', 'is_active']
    );
  };

  const handleRefundConfirm = async () => {
    if (!refundTarget) return;
    setIsSubmitting(true);
    try {
      await paymentService.refundPayment(refundTarget.payment_id);
      success('Payment refunded', `Transaction ${refundTarget.payment_id} marked as Refunded.`);
      setRefundTarget(null);
      await loadReportData();
    } catch (err) {
      handleApiError(err, 'Failed to refund payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await paymentService.deletePayment(deleteTarget.payment_id);
      success('Payment deleted', `Transaction ${deleteTarget.payment_id} removed from system.`);
      setDeleteTarget(null);
      await loadReportData();
    } catch (err) {
      handleApiError(err, 'Failed to delete payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">System Reports & CSV Export</h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate analytical reports, review financial logs, refund or void payments, and export CSVs.
          </p>
        </div>
        <div>
          {activeTab === 'payments' && (
            <button
              onClick={handleExportPaymentsCSV}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Payments CSV
            </button>
          )}
          {activeTab === 'attendance' && (
            <button
              onClick={handleExportAttendanceCSV}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Attendance CSV
            </button>
          )}
          {activeTab === 'members' && (
            <button
              onClick={handleExportMembersCSV}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Members CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-3">
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Financial & Payments
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Attendance Audit
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'members'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Member Directory
        </button>
      </div>

      {/* Date Filter Bar */}
      {(activeTab === 'payments' || activeTab === 'attendance') && (
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {activeTab === 'payments' && (
            <>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span>Mode:</span>
                <select
                  value={paymentModeFilter}
                  onChange={(e) => setPaymentModeFilter(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Modes</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="NetBanking">NetBanking</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span>Status:</span>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
            </>
          )}

          {(startDate || endDate || paymentModeFilter !== 'all' || paymentStatusFilter !== 'all') && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setPaymentModeFilter('all');
                setPaymentStatusFilter('all');
              }}
              className="text-xs text-rose-400 hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner size="lg" label="Generating report data..." />
      ) : activeTab === 'payments' ? (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                  <th className="py-3.5 px-4">Txn ID</th>
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map((p) => (
                  <tr key={p.payment_id} className="hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">{p.payment_id}</td>
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
                      <div className="flex items-center justify-end gap-1.5">
                        {p.payment_status === 'Completed' && (
                          <>
                            <button
                              onClick={() => setSelectedReceipt(p)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Print receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setRefundTarget(p)}
                              className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 transition-colors flex items-center gap-1"
                              title="Refund Completed payment"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Refund
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Void / delete wrongly entered transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'attendance' ? (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Member Name</th>
                  <th className="py-3.5 px-4">Member ID</th>
                  <th className="py-3.5 px-4">Batch</th>
                  <th className="py-3.5 px-4">Check-in</th>
                  <th className="py-3.5 px-4">Check-out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {attendance.map((a) => (
                  <tr key={`${a.member_id}-${a.attendance_date}`} className="hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 text-slate-200 font-medium">
                      {formatDate(a.attendance_date)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100">
                      {a.member ? `${a.member.f_name} ${a.member.l_name}` : a.member_id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{a.member_id}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {a.member?.batch?.batch_name || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400">
                      {a.check_in_time || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-cyan-400">
                      {a.checkout_time || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                  <th className="py-3.5 px-4">Member ID</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Join Date</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((m) => (
                  <tr key={m.member_id} className="hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {m.member_id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100">
                      {m.f_name} {m.l_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{m.phone_no}</td>
                    <td className="py-3.5 px-4 text-slate-400">{m.email || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-300">{formatDate(m.join_date)}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={m.is_active ? 'Active' : 'Inactive'} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refund Confirmation Dialog */}
      {refundTarget && (
        <ConfirmDialog
          isOpen={Boolean(refundTarget)}
          onClose={() => setRefundTarget(null)}
          onConfirm={handleRefundConfirm}
          isLoading={isSubmitting}
          title="Refund Payment"
          message={`Are you sure you want to refund payment ${refundTarget.payment_id} (${formatCurrency(
            refundTarget.amount
          )})? Its status will be updated to Refunded.`}
          confirmLabel="Process Refund"
          variant="warning"
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          isLoading={isSubmitting}
          title="Delete / Void Payment"
          message={`Are you sure you want to permanently delete transaction ${deleteTarget.payment_id}? This is only for correcting wrongly entered payments.`}
          confirmLabel="Delete Transaction"
          variant="danger"
        />
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        payment={selectedReceipt}
      />
    </div>
  );
};
