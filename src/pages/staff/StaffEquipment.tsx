import React, { useEffect, useState } from 'react';
import { Wrench, Plus, Activity, Calendar } from 'lucide-react';
import { equipmentService } from '../../services/equipmentService';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import type { Equipment, EquipmentMaintenance, EquipmentStatus } from '../../types/database';

export const StaffEquipment: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<EquipmentMaintenance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab: Equipment | Maintenance
  const [activeTab, setActiveTab] = useState<'equipment' | 'maintenance'>('equipment');

  // Log Maintenance Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [maintForm, setMaintForm] = useState({
    equipment_id: '',
    description: '',
    cost: 500,
    status: 'Completed',
    maintenance_date: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, handleApiError } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [equipData, maintData] = await Promise.all([
        equipmentService.getEquipment(),
        equipmentService.getMaintenanceRecords(),
      ]);
      setEquipmentList(equipData);
      setMaintenanceRecords(maintData);
      if (equipData.length > 0 && !maintForm.equipment_id) {
        setMaintForm((prev) => ({ ...prev, equipment_id: equipData[0].equipment_id }));
      }
    } catch (err) {
      handleApiError(err, 'Failed to load equipment list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (equipId: string, status: EquipmentStatus) => {
    try {
      await equipmentService.updateStatus(equipId, status);
      success('Equipment updated', `${equipId} status changed to ${status}.`);
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to update equipment status');
    }
  };

  const handleLogMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintForm.equipment_id) return;
    setIsSubmitting(true);
    try {
      await equipmentService.logMaintenance(maintForm);
      success('Service log recorded!');
      setIsLogModalOpen(false);
      setMaintForm({
        equipment_id: equipmentList[0]?.equipment_id || '',
        description: '',
        cost: 500,
        status: 'Completed',
        maintenance_date: new Date().toISOString().split('T')[0],
      });
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to log maintenance');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading equipment assets..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Equipment Operational Status</h1>
          <p className="text-xs text-slate-400 mt-1">
            Update machine status (Working, Under Repair) and record maintenance service entries.
          </p>
        </div>
        <button
          onClick={() => setIsLogModalOpen(true)}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
        >
          <Wrench className="w-4 h-4" />
          Log Maintenance
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-3">
        <button
          onClick={() => setActiveTab('equipment')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'equipment'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          Equipment ({equipmentList.length})
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'maintenance'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Service Records ({maintenanceRecords.length})
        </button>
      </div>

      {/* Equipment View */}
      {activeTab === 'equipment' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                  <th className="py-3 px-4">Equipment ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Quality</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {equipmentList.map((eq) => (
                  <tr key={eq.equipment_id} className="hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      {eq.equipment_id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100">{eq.equipment_name}</td>
                    <td className="py-3.5 px-4 text-slate-300">{eq.quality || 'Good'}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={eq.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={eq.status}
                        onChange={(e) =>
                          handleUpdateStatus(eq.equipment_id, e.target.value as EquipmentStatus)
                        }
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Working">Working</option>
                        <option value="Under Repair">Under Repair</option>
                        <option value="Retired">Retired</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Maintenance View */}
      {activeTab === 'maintenance' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                  <th className="py-3 px-4">Equipment</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Service Description</th>
                  <th className="py-3 px-4">Cost</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {maintenanceRecords.map((m) => (
                  <tr
                    key={`${m.equipment_id}-${m.maintenance_date}`}
                    className="hover:bg-slate-800/20"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-100">
                      {m.equipment?.equipment_name || m.equipment_id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(m.maintenance_date)}</td>
                    <td className="py-3.5 px-4 text-slate-200">{m.description}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {formatCurrency(m.cost)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={m.status || 'Completed'} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Maintenance Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Equipment Maintenance"
        description="Record machine repairs, lubrication, or part replacements."
        maxWidth="md"
      >
        <form onSubmit={handleLogMaintenance} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Select Equipment *
            </label>
            <select
              required
              value={maintForm.equipment_id}
              onChange={(e) => setMaintForm({ ...maintForm, equipment_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {equipmentList.map((e) => (
                <option key={e.equipment_id} value={e.equipment_id}>
                  {e.equipment_name} ({e.equipment_id}) — {e.status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Description of Work *
            </label>
            <input
              type="text"
              required
              value={maintForm.description}
              onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })}
              placeholder="e.g. Belt tension adjustment"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Cost (Rs.) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={maintForm.cost}
                onChange={(e) => setMaintForm({ ...maintForm, cost: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={maintForm.status}
                onChange={(e) => setMaintForm({ ...maintForm, status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Maintenance Date
            </label>
            <input
              type="date"
              required
              value={maintForm.maintenance_date}
              onChange={(e) => setMaintForm({ ...maintForm, maintenance_date: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsLogModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              Save Service Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
