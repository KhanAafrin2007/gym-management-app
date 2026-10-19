import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  UserPlus,
  Phone,
  Briefcase,
  Users,
  Edit2,
  CheckCircle2,
  XCircle,
  IndianRupee,
} from 'lucide-react';
import { trainerService } from '../../services/trainerService';
import { formatCurrency } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import type { Trainer } from '../../types/database';

export const AdminEmployees: React.FC = () => {
  const [trainers, setTrainers] = useState<(Trainer & { memberCount: number; totalMemberCount: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [confirmToggleTrainer, setConfirmToggleTrainer] = useState<Trainer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    trainer_name: '',
    trainer_phone: '',
    salary: 40000,
    experience: 3,
  });

  const { success, handleApiError } = useToast();

  const loadTrainers = async () => {
    setIsLoading(true);
    try {
      const data = await trainerService.getTrainers(true);
      setTrainers(data);
    } catch (err) {
      handleApiError(err, 'Failed to load trainer roster');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrainers();
  }, []);

  const handleOpenAdd = () => {
    setEditingTrainer(null);
    setFormData({
      trainer_name: '',
      trainer_phone: '',
      salary: 40000,
      experience: 3,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Trainer) => {
    setEditingTrainer(t);
    setFormData({
      trainer_name: t.trainer_name,
      trainer_phone: t.trainer_phone,
      salary: t.salary,
      experience: t.experience || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.salary <= 0) {
      handleApiError('Salary must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTrainer) {
        await trainerService.updateTrainer(editingTrainer.trainer_id, {
          trainer_name: formData.trainer_name,
          trainer_phone: formData.trainer_phone,
          salary: formData.salary,
          experience: formData.experience,
        });
        success('Trainer updated successfully!');
      } else {
        await trainerService.createTrainer({
          trainer_name: formData.trainer_name,
          trainer_phone: formData.trainer_phone,
          salary: formData.salary,
          experience: formData.experience,
          is_active: true,
        });
        success('New trainer added successfully!');
      }
      setIsModalOpen(false);
      await loadTrainers();
    } catch (err) {
      handleApiError(err, 'Failed to save trainer record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleConfirm = async () => {
    if (!confirmToggleTrainer) return;
    setIsSubmitting(true);
    try {
      await trainerService.toggleActive(
        confirmToggleTrainer.trainer_id,
        confirmToggleTrainer.is_active
      );
      success(
        confirmToggleTrainer.is_active ? 'Trainer deactivated' : 'Trainer reactivated',
        `${confirmToggleTrainer.trainer_name}'s status updated.`
      );
      setConfirmToggleTrainer(null);
      await loadTrainers();
    } catch (err) {
      handleApiError(err, 'Failed to update trainer status');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading employee & trainer roster..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Trainer & Staff Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage fitness trainers, compensation, assigned members, and status.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add New Trainer
        </button>
      </div>

      {/* Trainer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {trainers.map((t) => (
          <div
            key={t.trainer_id}
            className={`glass-panel p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
              t.is_active
                ? 'border-slate-800 hover:border-emerald-500/30'
                : 'border-slate-800/40 opacity-70 bg-slate-950/60'
            }`}
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">{t.trainer_name}</h3>
                    <span className="font-mono text-xs text-slate-400">{t.trainer_id}</span>
                  </div>
                </div>
                {t.is_active ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    Inactive
                  </span>
                )}
              </div>

              {/* Specs */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" /> Phone:
                  </span>
                  <span className="font-mono text-slate-200 font-semibold">{t.trainer_phone}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" /> Experience:
                  </span>
                  <span className="text-slate-200 font-semibold">{t.experience || 0} years</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-500" /> Monthly Salary:
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {formatCurrency(t.salary)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" /> Active Members:
                  </span>
                  <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                    {t.memberCount} members
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(t)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => setConfirmToggleTrainer(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  t.is_active
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {t.is_active ? (
                  <>
                    <XCircle className="w-3.5 h-3.5" /> Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Reactivate
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTrainer ? `Edit Trainer: ${editingTrainer.trainer_id}` : 'Add New Trainer'}
        description="Fill out the trainer information and monthly compensation."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.trainer_name}
              onChange={(e) => setFormData({ ...formData, trainer_name: e.target.value })}
              placeholder="e.g. Vikram Shah"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Phone Number * (Unique)
            </label>
            <input
              type="tel"
              required
              value={formData.trainer_phone}
              onChange={(e) => setFormData({ ...formData, trainer_phone: e.target.value })}
              placeholder="9820011111"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Salary (Rs.) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Experience (Years)
              </label>
              <input
                type="number"
                min="0"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
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
              {editingTrainer ? 'Save Changes' : 'Add Trainer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Confirm Dialog */}
      {confirmToggleTrainer && (
        <ConfirmDialog
          isOpen={Boolean(confirmToggleTrainer)}
          onClose={() => setConfirmToggleTrainer(null)}
          onConfirm={handleToggleConfirm}
          isLoading={isSubmitting}
          title={confirmToggleTrainer.is_active ? 'Deactivate Trainer' : 'Reactivate Trainer'}
          message={`Are you sure you want to ${
            confirmToggleTrainer.is_active ? 'deactivate' : 'reactivate'
          } ${confirmToggleTrainer.trainer_name}?`}
          confirmLabel={confirmToggleTrainer.is_active ? 'Deactivate' : 'Reactivate'}
          variant={confirmToggleTrainer.is_active ? 'danger' : 'primary'}
        />
      )}
    </div>
  );
};
