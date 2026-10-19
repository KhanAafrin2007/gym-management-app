import React, { useEffect, useState } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  UserCheck,
  ShieldCheck,
  Dumbbell,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { memberService } from '../../services/memberService';
import { formatDate } from '../../lib/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import type { Member } from '../../types/database';

export const MemberProfile: React.FC = () => {
  const { appUser } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { handleApiError } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!appUser?.member_id) return;
      setIsLoading(true);
      try {
        const details = await memberService.getMemberById(appUser.member_id);
        setMember(details.member);
      } catch (err) {
        handleApiError(err, 'Failed to load profile details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [appUser?.member_id]);

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading your member profile..." />;
  }

  if (!member) {
    return (
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center">
        <User className="w-12 h-12 text-slate-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-200">No Member Profile Linked</h3>
        <p className="text-xs text-slate-400 mt-1">
          Your login account is not linked to an active member record in the gym database.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white">My GymFlow Profile</h1>
        <p className="text-xs text-slate-400 mt-1">
          Read-only view of your membership registration, batch schedule, and personal trainer.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-xl shadow-emerald-500/20">
              {member.f_name?.[0]}
              {member.l_name?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-white">
                  {member.f_name} {member.l_name}
                </h2>
                <StatusBadge status={member.is_active ? 'Active' : 'Inactive'} size="sm" />
              </div>
              <p className="text-xs font-mono text-emerald-400 mt-0.5">
                Member ID: {member.member_id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 self-start sm:self-auto">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Member since: {formatDate(member.join_date)}</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              Personal Details
            </h3>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Gender</span>
                <span className="font-semibold text-slate-200">{member.gender || 'Not specified'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Date of Birth</span>
                <span className="font-semibold text-slate-200">{formatDate(member.dob)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Phone Number</span>
                <span className="font-mono font-semibold text-slate-200">{member.phone_no}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Email Address</span>
                <span className="text-slate-200 truncate">{member.email || '—'}</span>
              </div>
              <div className="flex justify-between items-start py-1">
                <span className="text-slate-400">Residential Address</span>
                <span className="text-slate-200 text-right max-w-[200px]">
                  {member.address || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Facilities */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-cyan-400" />
              Gym Allotment
            </h3>

            <div className="space-y-3">
              {/* Batch Card */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Training Batch
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {member.batch?.batch_id || 'B00'}
                  </span>
                </div>
                <p className="text-base font-bold text-slate-100">
                  {member.batch ? member.batch.batch_name : 'No Batch Assigned'}
                </p>
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{member.batch?.batch_time || 'Schedule not allocated'}</span>
                </div>
              </div>

              {/* Trainer Card */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Personal Trainer
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {member.trainer?.trainer_id || 'T00'}
                  </span>
                </div>
                <p className="text-base font-bold text-slate-100">
                  {member.trainer ? member.trainer.trainer_name : 'No Trainer Assigned'}
                </p>
                <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{member.trainer?.trainer_phone || 'Contact desk'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
