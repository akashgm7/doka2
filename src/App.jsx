import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import MenuManagement from './pages/MenuManagement';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import RoleGuard from './components/auth/RoleGuard';

// Dashboards
import SuperAdminDashboard from './pages/dashboards/SuperAdminDashboard';
import BrandAdminDashboard from './pages/dashboards/BrandAdminDashboard';
import AreaManagerDashboard from './pages/dashboards/AreaManagerDashboard';
import StoreManagerDashboard from './pages/dashboards/StoreManagerDashboard';
import FactoryDashboard from './pages/dashboards/FactoryDashboard';
import ProductionCalendar from './pages/ProductionCalendar';
import OrderManagement from './pages/OrderManagement';
import LocationManagement from './pages/super-admin/LocationManagement';
import RoleManagement from './pages/super-admin/RoleManagement';
import LoyaltyManagement from './pages/super-admin/LoyaltyManagement';
import NotificationManagement from './pages/super-admin/NotificationManagement';
import SystemSettings from './pages/super-admin/SystemSettings';
import AuditLogs from './pages/super-admin/AuditLogs';
import Reports from './pages/Reports';
import PaymentManagement from './pages/PaymentManagement';

import SessionManager from './components/auth/SessionManager';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes */}
      <Route element={
        <ProtectedRoute>
          <SessionManager>
            <MainLayout />
          </SessionManager>
        </ProtectedRoute>
      }>

        {/* Super Admin Routes */}
        <Route element={<RoleGuard permission="manage_roles" />}>
          <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/roles" element={<RoleManagement />} />
        </Route>

        {/* Location Management - Shared */}
        <Route element={<RoleGuard permission="manage_locations" />}>
          <Route path="/locations" element={<LocationManagement />} />
        </Route>

        {/* Super Admin, Brand Admin, Area Manager, Store Manager & Factory User Shared Routes */}
        <Route element={<RoleGuard permission="notifications_manual" />}>
          <Route path="/notifications" element={<NotificationManagement />} />
        </Route>

        <Route element={<RoleGuard permission="system_config" />}>
          <Route path="/settings" element={<SystemSettings />} />
        </Route>

        <Route element={<RoleGuard permission="view_audit_logs" />}>
          <Route path="/audit-logs" element={<AuditLogs />} />
        </Route>

        {/* Super Admin & Brand Admin Only */}
        <Route element={<RoleGuard permission="manage_users" />}>
          <Route path="/loyalty" element={<LoyaltyManagement />} />
        </Route>

        {/* Shared Protected Routes */}
        <Route path="users" element={
          <RoleGuard permission="manage_users">
            <UserManagement />
          </RoleGuard>
        } />
        <Route path="menu" element={
          <RoleGuard permission="view_menu">
            <MenuManagement />
          </RoleGuard>
        } />
        <Route path="production" element={
          <RoleGuard permission="factory_visibility">
            <ProductionCalendar />
          </RoleGuard>
        } />
        <Route path="orders" element={
          <RoleGuard permission="view_orders">
            <OrderManagement />
          </RoleGuard>
        } />
        <Route path="/reports" element={
          <RoleGuard permission="view_reports">
            <Reports />
          </RoleGuard>
        } />

        {/* Brand Admin Routes */}
        <Route element={<RoleGuard permission="sys_login" allowedScopes={['Brand']} />}>
          <Route path="/brand/dashboard" element={<BrandAdminDashboard />} />
        </Route>

        <Route element={<RoleGuard permission="view_payments" />}>
          <Route path="/payments" element={<PaymentManagement />} />
        </Route>

        {/* Area Manager Routes (Optional, can be skipped for custom roles if they map to Outlet, but we'll leave strict for Area Manager string for now, or just Scope) */}
        <Route element={<RoleGuard permission="sys_login" allowedRoles={['Area Manager']} />}>
          <Route path="/area/dashboard" element={<AreaManagerDashboard />} />
        </Route>

        {/* Store Manager Routes (Default for Outlet scope) */}
        <Route element={<RoleGuard permission="sys_login" allowedScopes={['Outlet']} />}>
          <Route path="/store/dashboard" element={<StoreManagerDashboard />} />
        </Route>

        {/* Factory Routes */}
        <Route element={<RoleGuard permission="factory_visibility" allowedScopes={['Factory']} />}>
          <Route path="/factory/dashboard" element={<FactoryDashboard />} />
        </Route>

      </Route>

      {/* Root Redirect - Send to Login, which handles redirection if already auth */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Catch all - 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes >
  );
}

export default App;
