import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import NotificationToast from '../common/NotificationToast.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';

export default function AdminLayout({ breadcrumbs = [] }) {
  const { isAuthenticated, isMobileSidebarOpen, setIsMobileSidebarOpen } = useAdmin();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 42
          }}
        />
      )}

      {/* Main Sidebar */}
      <Sidebar />

      {/* Layout Body */}
      <div className="main-layout">
        <Header breadcrumbItems={breadcrumbs} />
        <main className="content-body">
          <Outlet />
        </main>
        <NotificationToast />
      </div>
    </div>
  );
}
