import React from 'react';
import { Printer, Dumbbell } from 'lucide-react';
import { Modal } from './Modal';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { Payment } from '../../types/database';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, payment }) => {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const memberName = payment.member
    ? `${payment.member.f_name} ${payment.member.l_name || ''}`.trim()
    : payment.member_id;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Receipt" maxWidth="md">
      <div className="space-y-6">
        {/* Printable section */}
        <div
          id="printable-receipt"
          className="p-6 rounded-xl border border-slate-700/60 bg-slate-950/70 text-slate-100 font-sans space-y-6 shadow-inner print:text-black print:bg-white print:border-none print:shadow-none"
        >
          {/* Gym Header */}
          <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 print:bg-black print:text-white">
                <Dumbbell className="w-5 h-5 font-black" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-wider uppercase text-emerald-400 print:text-black">
                  GYMFLOW
                </h2>
                <p className="text-[11px] text-slate-400 print:text-slate-600">
                  Premium Fitness & Strength Club
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold print:border print:border-black print:text-black print:bg-transparent">
                OFFICIAL RECEIPT
              </span>
              <p className="text-xs font-mono text-slate-400 print:text-slate-700 mt-1">
                Ref: {payment.payment_id}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 print:text-slate-600 uppercase tracking-wider text-[10px]">
                Member Name
              </p>
              <p className="font-semibold text-slate-100 print:text-black text-sm mt-0.5">
                {memberName}
              </p>
              <p className="text-slate-400 print:text-slate-600 text-[11px] font-mono">
                ID: {payment.member_id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 print:text-slate-600 uppercase tracking-wider text-[10px]">
                Payment Date
              </p>
              <p className="font-semibold text-slate-100 print:text-black text-sm mt-0.5">
                {formatDate(payment.payment_date)}
              </p>
              <p className="text-slate-400 print:text-slate-600 text-[11px]">
                Mode: <span className="font-semibold">{payment.payment_mode}</span>
              </p>
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-lg bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
            <div className="flex justify-between items-center text-xs text-slate-300 print:text-slate-700 pb-2 border-b border-slate-800 print:border-slate-200">
              <span>Gym Membership Fee / Subscription</span>
              <span>{formatCurrency(payment.amount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-100 print:text-black pt-2">
              <span>Total Paid</span>
              <span className="text-emerald-400 print:text-black text-base">
                {formatCurrency(payment.amount)}
              </span>
            </div>
          </div>

          {/* Status and Footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 print:text-slate-600 pt-2 border-t border-slate-800 print:border-slate-300">
            <div>
              <span>Status: </span>
              <span className="text-emerald-400 font-bold uppercase tracking-wider print:text-black">
                {payment.payment_status}
              </span>
            </div>
            <span className="italic">Authorized System Generated Receipt</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </Modal>
  );
};
