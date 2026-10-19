import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Dumbbell, Menu, Shield, UserCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, appUser, role, logout } = useAuth();
  const navigate = useNavigate();

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Shield className="w-3.5 h-3.5" />
            Admin
          </span>
        );
      case 'employee':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <UserCheck className="w-3.5 h-3.5" />
            Staff / Trainer
          </span>
        );
      case 'member':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <User className="w-3.5 h-3.5" />
            Member
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Pending
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Dumbbell className="w-5 h-5 font-black" />
          </div>
          <div>
            <span className="text-lg font-black tracking-wider text-slate-100 font-sans">
              GYM<span className="text-emerald-400">FLOW</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
              v1.0
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* User Info & Role Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-medium text-slate-200">
              {appUser?.email || user?.email || 'User'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {appUser?.member_id ? `ID: ${appUser.member_id}` : appUser?.trainer_id ? `ID: ${appUser.trainer_id}` : 'System User'}
            </span>
          </div>
          {getRoleBadge()}
        </div>

        {/* Global Logout Button */}
        <button
          onClick={async () => {
            await logout();
            navigate('/login', { replace: true });
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 rounded-xl transition-all duration-200"
          title="Sign out of GymFlow"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
