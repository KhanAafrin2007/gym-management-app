import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ShieldCheck,
  CreditCard,
  Layers,
  Wrench,
  Activity,
  MessageSquare,
  FileSpreadsheet,
  FileText,
  Clock,
  CalendarCheck,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role } = useAuth();

  const adminNav = [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Members', to: '/admin/members', icon: Users },
    { label: 'Employees', to: '/admin/employees', icon: UserCheck },
    { label: 'Accounts', to: '/admin/accounts', icon: ShieldCheck },
    { label: 'Plans & Memberships', to: '/admin/plans', icon: CreditCard },
    { label: 'Batches', to: '/admin/batches', icon: Layers },
    { label: 'Equipment', to: '/admin/equipment', icon: Wrench },
    { label: 'Fitness Programs', to: '/admin/programs', icon: Activity },
    { label: 'Feedback', to: '/admin/feedback', icon: MessageSquare },
    { label: 'Audit Log', to: '/admin/audit-log', icon: FileText },
    { label: 'Reports', to: '/admin/reports', icon: FileSpreadsheet },
  ];

  const staffNav = [
    { label: 'Overview', to: '/staff', icon: LayoutDashboard, end: true },
    { label: 'Attendance', to: '/staff/attendance', icon: Clock },
    { label: 'Payments', to: '/staff/payments', icon: CreditCard },
    { label: 'Members', to: '/staff/members', icon: Users },
    { label: 'Memberships', to: '/staff/memberships', icon: Layers },
    { label: 'Programs', to: '/staff/programs', icon: Activity },
    { label: 'Equipment', to: '/staff/equipment', icon: Wrench },
  ];

  const memberNav = [
    { label: 'My Dashboard', to: '/me', icon: LayoutDashboard, end: true },
    { label: 'My Attendance', to: '/me/attendance', icon: CalendarCheck },
    { label: 'Payments & Renew', to: '/me/payments', icon: CreditCard },
    { label: 'My Diet & Workout', to: '/me/programs', icon: Activity },
    { label: 'Give Feedback', to: '/me/feedback', icon: MessageSquare },
    { label: 'My Profile', to: '/me/profile', icon: User },
  ];

  const navLinks = role === 'admin' ? adminNav : role === 'employee' ? staffNav : memberNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 z-50 lg:z-30 h-screen lg:h-[calc(100vh-4rem)] w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <span className="font-bold text-sm text-slate-200 uppercase tracking-wider">
            GymFlow Menu
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {role === 'admin' ? 'Admin Portal' : role === 'employee' ? 'Staff Portal' : 'Member Portal'}
          </div>

          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-slate-400 font-medium">Supabase Connected</span>
          </div>
        </div>
      </aside>
    </>
  );
};
