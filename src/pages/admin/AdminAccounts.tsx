import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Clock,
  UserCheck,
  User,
  Shield,
  Edit2,
  Lock,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { accountService } from '../../services/accountService';
import { memberService } from '../../services/memberService';
import { trainerService } from '../../services/trainerService';
import { formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import type { AppUser, UserRole, Member, Trainer } from '../../types/database';

export const AdminAccounts: React.FC = () => {
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit user modal
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('pending');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, handleApiError } = useToast();

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const [usersData, membersData, trainersData] = await Promise.all([
        accountService.getAppUsers(),
        memberService.getMembers({ isActive: 'all' }),
        trainerService.getTrainers(false),
      ]);
      setAppUsers(usersData);
      setMembers(membersData);
      setTrainers(trainersData);
    } catch (err) {
      handleApiError(err, 'Failed to load user accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setSelectedMemberId(user.member_id || '');
    setSelectedTrainerId(user.trainer_id || '');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      await accountService.updateUserRoleAndLinks(editingUser.auth_user_id, {
        role: selectedRole,
        member_id: selectedRole === 'member' ? selectedMemberId || null : null,
        trainer_id: selectedRole === 'employee' ? selectedTrainerId || null : null,
      });

      success(
        'Account updated successfully!',
        `${editingUser.email} is now assigned as ${selectedRole}.`
      );
      setEditingUser(null);
      await loadAccounts();
    } catch (err) {
      handleApiError(err, 'Failed to update account role & permissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading app user accounts..." />;
  }

  const pendingCount = appUsers.filter((u) => u.role === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">User Accounts & Access Control</h1>
          <p className="text-xs text-slate-400 mt-1">
            Approve registered accounts, assign roles, and link login credentials to members or trainers.
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse">
            <Clock className="w-4 h-4" />
            <span>{pendingCount} Pending Approval</span>
          </div>
        )}
      </div>

      {/* Accounts List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                <th className="py-3.5 px-4">User Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Linked Member / Trainer</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {appUsers.map((u) => {
                const isPending = u.role === 'pending';
                return (
                  <tr
                    key={u.auth_user_id}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      isPending ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 font-medium text-slate-100">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{u.email}</span>
                      </div>
                      <span className="block text-[10px] font-mono text-slate-500 truncate max-w-[200px]">
                        UID: {u.auth_user_id}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {u.role === 'admin' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      )}
                      {u.role === 'employee' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                          <UserCheck className="w-3 h-3" /> Employee (Trainer)
                        </span>
                      )}
                      {u.role === 'member' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          <User className="w-3 h-3" /> Member
                        </span>
                      )}
                      {u.role === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                          <Clock className="w-3 h-3 animate-spin" /> Pending Approval
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {u.role === 'member' && (
                        <div>
                          {u.member ? (
                            <span className="font-semibold text-slate-100">
                              {u.member.f_name} {u.member.l_name} ({u.member_id})
                            </span>
                          ) : u.member_id ? (
                            <span className="font-mono text-slate-300">ID: {u.member_id}</span>
                          ) : (
                            <span className="text-amber-400/80 italic">Unlinked Member</span>
                          )}
                        </div>
                      )}

                      {u.role === 'employee' && (
                        <div>
                          {u.trainer ? (
                            <span className="font-semibold text-slate-100">
                              {u.trainer.trainer_name} ({u.trainer_id})
                            </span>
                          ) : u.trainer_id ? (
                            <span className="font-mono text-slate-300">ID: {u.trainer_id}</span>
                          ) : (
                            <span className="text-amber-400/80 italic">Unlinked Trainer</span>
                          )}
                        </div>
                      )}

                      {u.role === 'admin' && (
                        <span className="text-slate-500 italic">Full System Access</span>
                      )}

                      {u.role === 'pending' && (
                        <span className="text-slate-500 italic">No access granted yet</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">{formatDate(u.created_at)}</td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ml-auto ${
                          isPending
                            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        {isPending ? 'Approve & Assign' : 'Edit Role'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role & Link Modal */}
      {editingUser && (
        <Modal
          isOpen={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          title={`Manage Account: ${editingUser.email}`}
          description="Assign permission role and link to database records. Setting to Pending blocks access."
          maxWidth="md"
        >
          <form onSubmit={handleSaveUser} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Assign System Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['admin', 'employee', 'member', 'pending'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                      selectedRole === r
                        ? r === 'admin'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : r === 'employee'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : r === 'member'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r === 'employee' ? 'Employee (Trainer)' : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Link Member ID if role == 'member' */}
            {selectedRole === 'member' && (
              <div className="pt-2 animate-in fade-in">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Link Member Profile
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Member...</option>
                  {members.map((m) => (
                    <option key={m.member_id} value={m.member_id}>
                      {m.f_name} {m.l_name} ({m.member_id}) — {m.phone_no}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Connects this login to their personal profile, payments, and attendance.
                </p>
              </div>
            )}

            {/* Link Trainer ID if role == 'employee' */}
            {selectedRole === 'employee' && (
              <div className="pt-2 animate-in fade-in">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Link Trainer Profile
                </label>
                <select
                  value={selectedTrainerId}
                  onChange={(e) => setSelectedTrainerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Trainer...</option>
                  {trainers.map((t) => (
                    <option key={t.trainer_id} value={t.trainer_id}>
                      {t.trainer_name} ({t.trainer_id})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Connects this staff member to their assigned training clients.
                </p>
              </div>
            )}

            {selectedRole === 'pending' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                Setting this account back to pending will immediately block their access to all gym operations.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
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
                Save Account Role
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
