import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  Phone,
  Mail,
  UserCheck,
} from 'lucide-react';
import { memberService } from '../../services/memberService';
import { batchService } from '../../services/batchService';
import { trainerService } from '../../services/trainerService';
import { formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import type { Member, Batch, Trainer, Gender } from '../../types/database';

export const AdminMembers: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('all');
  const [trainerFilter, setTrainerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [confirmToggleMember, setConfirmToggleMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    f_name: '',
    l_name: '',
    gender: 'Male' as Gender,
    dob: '',
    join_date: new Date().toISOString().split('T')[0],
    address: '',
    phone_no: '',
    email: '',
    batch_id: '',
    trainer_id: '',
  });

  const { success, handleApiError } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [membersData, batchesData, trainersData] = await Promise.all([
        memberService.getMembers({ isActive: 'all' }),
        batchService.getBatches(),
        trainerService.getTrainers(false),
      ]);
      setMembers(membersData);
      setBatches(batchesData);
      setTrainers(trainersData);
    } catch (err) {
      handleApiError(err, 'Failed to load member records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Search
      const s = search.toLowerCase();
      const matchSearch =
        !search ||
        m.f_name?.toLowerCase().includes(s) ||
        m.l_name?.toLowerCase().includes(s) ||
        m.member_id.toLowerCase().includes(s) ||
        m.phone_no?.includes(s) ||
        m.email?.toLowerCase().includes(s);

      // Batch filter
      const matchBatch = batchFilter === 'all' || m.batch_id === batchFilter;

      // Trainer filter
      const matchTrainer = trainerFilter === 'all' || m.trainer_id === trainerFilter;

      // Status filter
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && m.is_active) ||
        (statusFilter === 'inactive' && !m.is_active);

      return matchSearch && matchBatch && matchTrainer && matchStatus;
    });
  }, [members, search, batchFilter, trainerFilter, statusFilter]);

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setFormData({
      f_name: '',
      l_name: '',
      gender: 'Male',
      dob: '',
      join_date: new Date().toISOString().split('T')[0],
      address: '',
      phone_no: '',
      email: '',
      batch_id: batches[0]?.batch_id || '',
      trainer_id: trainers[0]?.trainer_id || '',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setFormData({
      f_name: member.f_name || '',
      l_name: member.l_name || '',
      gender: member.gender || 'Male',
      dob: member.dob || '',
      join_date: member.join_date || '',
      address: member.address || '',
      phone_no: member.phone_no || '',
      email: member.email || '',
      batch_id: member.batch_id || '',
      trainer_id: member.trainer_id || '',
    });
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingMember) {
        await memberService.updateMember(editingMember.member_id, {
          f_name: formData.f_name,
          l_name: formData.l_name || null,
          gender: formData.gender,
          dob: formData.dob || null,
          join_date: formData.join_date,
          address: formData.address || null,
          phone_no: formData.phone_no,
          email: formData.email || null,
          batch_id: formData.batch_id || null,
          trainer_id: formData.trainer_id || null,
        });
        success('Member updated successfully!');
      } else {
        await memberService.createMember({
          f_name: formData.f_name,
          l_name: formData.l_name || null,
          gender: formData.gender,
          dob: formData.dob || null,
          join_date: formData.join_date,
          address: formData.address || null,
          phone_no: formData.phone_no,
          email: formData.email || null,
          batch_id: formData.batch_id || null,
          trainer_id: formData.trainer_id || null,
          is_active: true,
        });
        success('New member registered successfully!');
      }
      setIsFormModalOpen(false);
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to save member details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActiveConfirm = async () => {
    if (!confirmToggleMember) return;
    setIsSubmitting(true);
    try {
      await memberService.toggleActive(
        confirmToggleMember.member_id,
        confirmToggleMember.is_active
      );
      success(
        confirmToggleMember.is_active ? 'Member deactivated' : 'Member reactivated',
        `${confirmToggleMember.f_name} status updated.`
      );
      setConfirmToggleMember(null);
      await loadData();
    } catch (err) {
      handleApiError(err, 'Failed to update member status');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading members directory..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Member Directory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, register, update, and manage member profiles.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add New Member
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, phone, email..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Batch Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Batches</option>
            {batches.map((b) => (
              <option key={b.batch_id} value={b.batch_id}>
                {b.batch_name} ({b.batch_id})
              </option>
            ))}
          </select>
        </div>

        {/* Trainer Filter */}
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={trainerFilter}
            onChange={(e) => setTrainerFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Trainers</option>
            {trainers.map((t) => (
              <option key={t.trainer_id} value={t.trainer_id}>
                {t.trainer_name} ({t.trainer_id})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Members Only</option>
            <option value="inactive">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          title="No members found"
          description="Try adjusting your search criteria or register a new member."
          action={{ label: 'Add Member', onClick: handleOpenAddModal }}
        />
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                  <th className="py-3.5 px-4">Member ID</th>
                  <th className="py-3.5 px-4">Name & Contact</th>
                  <th className="py-3.5 px-4">Gender & DOB</th>
                  <th className="py-3.5 px-4">Batch</th>
                  <th className="py-3.5 px-4">Trainer</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMembers.map((m) => (
                  <tr key={m.member_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {m.member_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">
                        {m.f_name} {m.l_name}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {m.phone_no}
                        </span>
                        {m.email && (
                          <span className="flex items-center gap-1 text-slate-500 truncate max-w-[150px]">
                            <Mail className="w-3 h-3" />
                            {m.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span>{m.gender || '—'}</span>
                      <span className="block text-[11px] text-slate-500">
                        {m.dob ? formatDate(m.dob) : 'DOB not set'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {m.batch ? (
                        <div>
                          <span className="font-medium text-slate-200">{m.batch.batch_name}</span>
                          <span className="block text-[10px] font-mono text-slate-500">
                            {m.batch.batch_time}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {m.trainer ? (
                        <div>
                          <span className="font-medium text-slate-200">
                            {m.trainer.trainer_name}
                          </span>
                          <span className="block text-[10px] font-mono text-slate-500">
                            {m.trainer.trainer_phone}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(m.join_date)}</td>
                    <td className="py-3.5 px-4">
                      {m.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                          <XCircle className="w-3 h-3" />
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/members/${m.member_id}`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="View member details and history"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleOpenEditModal(m)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Edit member"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmToggleMember(m)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            m.is_active
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                          }`}
                          title={m.is_active ? 'Deactivate member' : 'Reactivate member'}
                        >
                          {m.is_active ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
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

      {/* Add / Edit Member Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingMember ? `Edit Member: ${editingMember.member_id}` : 'Register New Member'}
        description="Fill out member profile details. An ID will be sequentially assigned."
        maxWidth="xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.f_name}
                onChange={(e) => setFormData({ ...formData, f_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.l_name}
                onChange={(e) => setFormData({ ...formData, l_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Phone Number * (Unique)
              </label>
              <input
                type="tel"
                required
                value={formData.phone_no}
                onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })}
                placeholder="9840012345"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="12 MG Road, Vellore"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Assign Batch
              </label>
              <select
                value={formData.batch_id}
                onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">No Batch</option>
                {batches.map((b) => (
                  <option key={b.batch_id} value={b.batch_id}>
                    {b.batch_name} ({b.batch_time})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Assign Trainer
              </label>
              <select
                value={formData.trainer_id}
                onChange={(e) => setFormData({ ...formData, trainer_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">No Trainer</option>
                {trainers.map((t) => (
                  <option key={t.trainer_id} value={t.trainer_id}>
                    {t.trainer_name} ({t.trainer_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
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
              {editingMember ? 'Save Changes' : 'Register Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivate / Reactivate Confirm Dialog */}
      {confirmToggleMember && (
        <ConfirmDialog
          isOpen={Boolean(confirmToggleMember)}
          onClose={() => setConfirmToggleMember(null)}
          onConfirm={handleToggleActiveConfirm}
          isLoading={isSubmitting}
          title={confirmToggleMember.is_active ? 'Deactivate Member' : 'Reactivate Member'}
          message={`Are you sure you want to ${
            confirmToggleMember.is_active ? 'deactivate' : 'reactivate'
          } ${confirmToggleMember.f_name} ${confirmToggleMember.l_name || ''}? They will ${
            confirmToggleMember.is_active
              ? 'no longer be counted as active in batches or trainer rosters.'
              : 'be marked active in the system.'
          }`}
          confirmLabel={confirmToggleMember.is_active ? 'Deactivate' : 'Reactivate'}
          variant={confirmToggleMember.is_active ? 'danger' : 'primary'}
        />
      )}
    </div>
  );
};
