import React, { useState } from 'react';
import { Clock, LogOut, RefreshCw, Dumbbell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export const PendingApprovalPage: React.FC = () => {
  const { user, appUser, refreshProfile, logout } = useAuth();
  const { info, success } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfile();
    setIsRefreshing(false);
    if (appUser?.role && appUser.role !== 'pending') {
      success('Account approved!', `You now have access as ${appUser.role}.`);
      if (appUser.role === 'admin') navigate('/admin');
      else if (appUser.role === 'employee') navigate('/staff');
      else if (appUser.role === 'member') navigate('/me');
    } else {
      info('Still pending', 'Your account is still waiting for an administrator to assign a role.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 text-center">
        {/* Brand */}
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/20 mb-4">
          <Dumbbell className="w-8 h-8 font-black" />
        </div>
        <h1 className="text-2xl font-black text-white font-sans">
          GYM<span className="text-emerald-400">FLOW</span>
        </h1>

        <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-slate-800/80 mt-6 space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 w-16 h-16 mx-auto flex items-center justify-center">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-100">
              Your account is waiting for admin approval
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              You are signed in as <span className="text-slate-200 font-semibold">{user?.email}</span>. An administrator must verify and assign your role (Admin, Trainer, or Member) before you can access the portal.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Check Approval Status
            </button>

            <button
              onClick={async () => {
                await logout();
                navigate('/login', { replace: true });
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
