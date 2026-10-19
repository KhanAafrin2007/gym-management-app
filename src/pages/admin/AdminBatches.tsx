import React, { useEffect, useState } from 'react';
import { Layers, Plus, Edit2, Users, Clock, AlertTriangle } from 'lucide-react';
import { batchService } from '../../services/batchService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import type { Batch } from '../../types/database';

export const AdminBatches: React.FC = () => {
  const [batches, setBatches] = useState<
    (Batch & { enrolledCount: number; totalEnrolledCount: number })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    batch_name: '',
    capacity: 25,
    batch_time: '06:00-08:00',
  });

  const { success, handleApiError } = useToast();

  const loadBatches = async () => {
    setIsLoading(true);
    try {
      const data = await batchService.getBatches();
      setBatches(data);
    } catch (err) {
      handleApiError(err, 'Failed to load batches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleOpenAdd = () => {
    setEditingBatch(null);
    setFormData({
      batch_name: '',
      capacity: 25,
      batch_time: '06:00-08:00',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Batch) => {
    setEditingBatch(b);
    setFormData({
      batch_name: b.batch_name,
      capacity: b.capacity,
      batch_time: b.batch_time,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.capacity <= 0) {
      handleApiError('Batch capacity must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBatch) {
        await batchService.updateBatch(editingBatch.batch_id, formData);
        success('Batch updated successfully!');
      } else {
        await batchService.createBatch(formData);
        success('New batch created successfully!');
      }
      setIsModalOpen(false);
      await loadBatches();
    } catch (err) {
      handleApiError(err, 'Failed to save batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading gym training batches..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Batch Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure training schedules, monitor capacity limits, and view enrollments.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Batch
        </button>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {batches.map((b) => {
          const occupancy = Math.round((b.enrolledCount / b.capacity) * 100);
          const isFull = b.enrolledCount >= b.capacity;
          const isHigh = occupancy >= 80;

          return (
            <div
              key={b.batch_id}
              className="glass-panel p-5 rounded-3xl border border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400">{b.batch_id}</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono font-medium text-slate-200">{b.batch_time}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mt-3">{b.batch_name}</h3>

                {/* Occupancy stats */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Enrolled:
                    </span>
                    <span className="font-bold text-slate-100">
                      {b.enrolledCount} / {b.capacity} members
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(occupancy, 100)}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull
                          ? 'bg-rose-500'
                          : isHigh
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Capacity Load</span>
                    <span
                      className={`font-semibold ${
                        isFull
                          ? 'text-rose-400'
                          : isHigh
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {occupancy}% {isFull ? '(Full)' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => handleOpenEdit(b)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Batch
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBatch ? `Edit Batch: ${editingBatch.batch_id}` : 'Create New Batch'}
        description="Configure timing and member capacity limits."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Batch Name *
            </label>
            <input
              type="text"
              required
              value={formData.batch_name}
              onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
              placeholder="e.g. Early Morning Batch"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Time Slot * (e.g. 06:00-08:00)
            </label>
            <input
              type="text"
              required
              value={formData.batch_time}
              onChange={(e) => setFormData({ ...formData, batch_time: e.target.value })}
              placeholder="06:00-08:00"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Maximum Capacity (Members) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
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
              {editingBatch ? 'Save Changes' : 'Create Batch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
