import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { PendingApprovalPage } from './pages/auth/PendingApprovalPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminMembers } from './pages/admin/AdminMembers';
import { AdminMemberDetail } from './pages/admin/AdminMemberDetail';
import { AdminEmployees } from './pages/admin/AdminEmployees';
import { AdminAccounts } from './pages/admin/AdminAccounts';
import { AdminPlans } from './pages/admin/AdminPlans';
import { AdminBatches } from './pages/admin/AdminBatches';
import { AdminEquipment } from './pages/admin/AdminEquipment';
import { AdminPrograms } from './pages/admin/AdminPrograms';
import { AdminFeedback } from './pages/admin/AdminFeedback';
import { AdminAuditLog } from './pages/admin/AdminAuditLog';
import { AdminReports } from './pages/admin/AdminReports';

// Staff Pages
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffAttendance } from './pages/staff/StaffAttendance';
import { StaffPayments } from './pages/staff/StaffPayments';
import { StaffMembers } from './pages/staff/StaffMembers';
import { StaffMemberships } from './pages/staff/StaffMemberships';
import { StaffPrograms } from './pages/staff/StaffPrograms';
import { StaffEquipment } from './pages/staff/StaffEquipment';

// Member Pages
import { MemberDashboard } from './pages/member/MemberDashboard';
import { MemberAttendance } from './pages/member/MemberAttendance';
import { MemberPayments } from './pages/member/MemberPayments';
import { MemberPrograms } from './pages/member/MemberPrograms';
import { MemberFeedback } from './pages/member/MemberFeedback';
import { MemberProfile } from './pages/member/MemberProfile';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Root redirect based on role
const RootRedirect: React.FC = () => {
  const { user, role, isLoading } = useAuth();

  if (isLoading || (user && !role)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading GymFlow..." />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'employee') return <Navigate to="/staff" replace />;
  if (role === 'member') return <Navigate to="/me" replace />;
  return <Navigate to="/pending" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pending" element={<PendingApprovalPage />} />

            {/* Root Route */}
            <Route path="/" element={<RootRedirect />} />

            {/* Admin Portal */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="members" element={<AdminMembers />} />
              <Route path="members/:id" element={<AdminMemberDetail />} />
              <Route path="employees" element={<AdminEmployees />} />
              <Route path="accounts" element={<AdminAccounts />} />
              <Route path="plans" element={<AdminPlans />} />
              <Route path="batches" element={<AdminBatches />} />
              <Route path="equipment" element={<AdminEquipment />} />
              <Route path="programs" element={<AdminPrograms />} />
              <Route path="feedback" element={<AdminFeedback />} />
              <Route path="audit-log" element={<AdminAuditLog />} />
              <Route path="reports" element={<AdminReports />} />
            </Route>

            {/* Staff / Employee Portal */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StaffDashboard />} />
              <Route path="attendance" element={<StaffAttendance />} />
              <Route path="payments" element={<StaffPayments />} />
              <Route path="members" element={<StaffMembers />} />
              <Route path="members/:id" element={<StaffMembers />} />
              <Route path="memberships" element={<StaffMemberships />} />
              <Route path="programs" element={<StaffPrograms />} />
              <Route path="equipment" element={<StaffEquipment />} />
            </Route>

            {/* Member Portal */}
            <Route
              path="/me"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MemberDashboard />} />
              <Route path="attendance" element={<MemberAttendance />} />
              <Route path="payments" element={<MemberPayments />} />
              <Route path="programs" element={<MemberPrograms />} />
              <Route path="feedback" element={<MemberFeedback />} />
              <Route path="profile" element={<MemberProfile />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
