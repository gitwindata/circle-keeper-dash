import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from '../hooks/use-auth';
import { toast } from 'sonner';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  menuItems: MenuItem[];
  userRole: "admin" | "hairstylist";
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ menuItems, userRole }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar menuItems={menuItems} onLogout={handleLogout} userRole={userRole} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <img src="/hms logo white.svg" alt="HMS Logo" className="h-5 w-5" />
              <h1 className="text-xl font-semibold">{userRole === "admin" ? "HMS Admin Dashboard" : "HMS Hairstylist Dashboard"}</h1>
            </div>
          </header>
          
          <div className="flex-1 p-6 space-y-6">
            <Outlet /> {/* This is where nested routes will render */}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
