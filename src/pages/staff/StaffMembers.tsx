import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  Search,
  Eye,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Clock,
  Activity,
  Layers,
  Calendar,
} from 'lucide-react';
import { memberService } from '../../services/memberService';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import type { Member } from '../../types/database';

export const StaffMembers: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // If ID param is present, show Member Detail View
  if (id) {
    return <StaffMemberDetail memberId={id} />;
  }

  return <StaffMembersList />;
};

const StaffMembersList: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const { handleApiError } = useToast();

  useEffect(() => {
    const loadMembers = async () => {
      setIsLoading(true);
      try {
        const data = await memberService.getMembers({ isActive: 'all' });
        setMembers(data);
      } catch (err) {
        handleApiError(err, 'Failed to load member records');
      } finally {
        setIsLoading(false);
      }
    };
    loadMembers();
  }, []);

  const filtered = members.filter((m) => {
    const s = search.toLowerCase();
    return (
      !s ||
      m.f_name?.toLowerCase().includes(s) ||
      m.l_name?.toLowerCase().includes(s) ||
      m.member_id.toLowerCase().includes(s) ||
      m.phone_no?.includes(s)
    );
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading members directory..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white">Member Directory (Read-Only)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Browse gym member profiles, current batches, and assigned training programs.
        </p>
      </div>

      {/* Search */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex items-center">
        <Search className="w-4 h-4 text-slate-500 ml-2 mr-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID, or phone number..."
          className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                <th className="py-3.5 px-4">Member ID</th>
                <th className="py-3.5 px-4">Name & Contact</th>
                <th className="py-3.5 px-4">Batch</th>
                <th className="py-3.5 px-4">Assigned Trainer</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">View Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((m) => (
                <tr key={m.member_id} className="hover:bg-slate-800/20">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                    {m.member_id}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-100">
                      {m.f_name} {m.l_name}
                    </span>
                    <span className="block text-[11px] text-slate-400 font-mono">
                      {m.phone_no}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {m.batch ? `${m.batch.batch_name} (${m.batch.batch_time})` : 'Unassigned'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-medium">
                    {m.trainer?.trainer_name || 'Unassigned'}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={m.is_active ? 'Active' : 'Inactive'} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/staff/members/${m.member_id}`}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StaffMemberDetail: React.FC<{ memberId: string }> = ({ memberId }) => {
  const [details, setDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { handleApiError } = useToast();

  useEffect(() => {
    const fetchMember = async () => {
      setIsLoading(true);
      try {
        const data = await memberService.getMemberById(memberId);
        setDetails(data);
      } catch (err) {
        handleApiError(err, 'Failed to fetch member details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMember();
  }, [memberId]);

  if (isLoading || !details) {
    return <LoadingSpinner size="lg" label="Loading trainee details..." />;
  }

  const { member, memberships, attendance, programs } = details;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/staff/members"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">
              {member.f_name} {member.l_name}
            </h1>
            <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {member.member_id}
            </span>
            <StatusBadge status={member.is_active ? 'Active' : 'Inactive'} size="sm" />
          </div>
          <p className="text-xs text-slate-400">Read-only Trainee Information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-500">Contact</span>
          <p className="text-slate-200 flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-500" /> {member.phone_no}
          </p>
          <p className="text-slate-300 flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-500" /> {member.email || 'No email registered'}
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-500">Gym Schedule</span>
          <p className="text-slate-200">
            Batch:{' '}
            <span className="font-semibold">{member.batch?.batch_name || 'Unassigned'}</span>
          </p>
          <p className="text-slate-400 font-mono">{member.batch?.batch_time || '—'}</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-500">Assigned Trainer</span>
          <p className="text-emerald-400 font-bold text-sm">
            {member.trainer?.trainer_name || 'Unassigned'}
          </p>
          <p className="text-slate-400 font-mono">
            {member.trainer?.trainer_phone || 'No trainer contact'}
          </p>
        </div>
      </div>

      {/* Subscriptions */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Active & Past Memberships
        </h3>
        {memberships.length === 0 ? (
          <p className="text-xs text-slate-500">No subscriptions found.</p>
        ) : (
          <div className="space-y-2">
            {memberships.map((ms: any) => (
              <div
                key={ms.membership_id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200">
                    {ms.membership_plan?.plan_name || ms.plan_id}
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    Valid: {formatDate(ms.start_date)} to {formatDate(ms.end_date)}
                  </span>
                </div>
                <StatusBadge status={ms.status} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Programs */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          Assigned Diets & Workouts
        </h3>
        {programs.length === 0 ? (
          <p className="text-xs text-slate-500">No programs assigned to this trainee.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {programs.map((p: any) => (
              <div
                key={p.program_id}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">
                    {p.fitness_program?.diet_plan?.diet_name ||
                      p.fitness_program?.workout_plan?.workout_name ||
                      p.program_id}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-cyan-400">
                    {p.fitness_program?.program_type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Assigned on: {formatDate(p.assigned_date)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
