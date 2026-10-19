import React, { useEffect, useState } from 'react';
import { FileText, Filter, Eye, RefreshCw, Calendar, Database } from 'lucide-react';
import { auditService } from '../../services/auditService';
import { formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import type { AuditLog } from '../../types/database';

export const AdminAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [tableFilter, setTableFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  // View Row Data Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { handleApiError } = useToast();

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await auditService.getAuditLogs({
        table_name: tableFilter,
        action: actionFilter,
      });
      setLogs(data);
    } catch (err) {
      handleApiError(err, 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [tableFilter, actionFilter]);

  const getActionBadge = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'INSERT':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            INSERT
          </span>
        );
      case 'UPDATE':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
            UPDATE
          </span>
        );
      case 'DELETE':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
            DELETE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-700 text-slate-300">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">System Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-1">
            Read-only database change log populated by automated Postgres audit triggers.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="p-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Log
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        {/* Table filter */}
        <div className="flex-1 flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Tables (member, trainer, payment, membership)</option>
            <option value="member">member</option>
            <option value="trainer">trainer</option>
            <option value="payment">payment</option>
            <option value="membership">membership</option>
          </select>
        </div>

        {/* Action filter */}
        <div className="flex-1 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Operations (INSERT, UPDATE, DELETE)</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner size="lg" label="Querying audit_log records..." />
      ) : logs.length === 0 ? (
        <EmptyState
          title="No audit entries match filter"
          description="Any changes to members, trainers, payments, and memberships trigger automatic audit records."
        />
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                  <th className="py-3.5 px-4">Log ID</th>
                  <th className="py-3.5 px-4">Target Table</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Changed At</th>
                  <th className="py-3.5 px-4">Changed By</th>
                  <th className="py-3.5 px-4 text-right">Row Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 text-slate-400">#{log.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200 font-sans">
                      {log.table_name}
                    </td>
                    <td className="py-3.5 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-sans">
                      {new Date(log.changed_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] truncate max-w-[140px]">
                      {log.changed_by || 'System trigger'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-xs font-sans font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect JSON Modal */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Audit Record #${selectedLog.id} — ${selectedLog.action} on ${selectedLog.table_name}`}
          description={`Timestamp: ${new Date(selectedLog.changed_at).toLocaleString()}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto max-h-[60vh]">
              <pre className="text-xs text-emerald-400 font-mono leading-relaxed">
                {JSON.stringify(selectedLog.row_data, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
