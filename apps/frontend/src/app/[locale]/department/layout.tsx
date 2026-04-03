"use client";

import { ReactNode, useEffect } from 'react';
import '../investor/investor.css'; // Re-use investor styles for consistent dashboard look
import DepartmentHeader from '@/components/(department)/Header';
import DepartmentSidebar from '@/components/(department)/Sidebar';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/navigation';

function DepartmentLayoutContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;

    const normalizedRoleName = String(user.roleName || '').trim().toLowerCase();
    const normalizedEmail = String(user.email || '').trim().toLowerCase();
    const isAdminUser =
      normalizedRoleName.includes('admin') ||
      Number(user.roleId || 0) === 9 ||
      normalizedEmail.startsWith('admin@') ||
      normalizedEmail.includes('.admin@') ||
      normalizedEmail.includes('_admin@');

    if (isAdminUser) {
      router.replace('/admin/users');
    }
  }, [loading, user, router]);

  return (
    <div className="tailwind-scope" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <DepartmentSidebar />

      {/* Main Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease-in-out',
        }}
        className={`investor-main-content ${collapsed ? 'sidebar-collapsed' : ''}`}
      >
        <DepartmentHeader />

        <main className='bg-white' style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DepartmentLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <DepartmentLayoutContent>{children}</DepartmentLayoutContent>
    </SidebarProvider>
  );
}
