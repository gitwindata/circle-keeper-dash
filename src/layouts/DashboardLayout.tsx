import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "../hooks/use-auth";
import { toast } from "sonner";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  menuItems: MenuItem[];
  userRole: "admin" | "hairstylist";
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  menuItems,
  userRole,
}) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to logout");
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar
          menuItems={menuItems}
          onLogout={handleLogout}
          userRole={userRole}
        />
        <SidebarInset className="bg-gray-50">
          <header className="flex h-16 shrink-0 items-center gap-4 px-6 bg-white border-b border-gray-200">
            <SidebarTrigger className="text-gray-600 hover:text-gray-900" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">C</span>
              </div>
              <h1 className="text-lg font-medium text-gray-900">
                {userRole === "admin"
                  ? "Admin Dashboard"
                  : "Hairstylist Dashboard"}
              </h1>
            </div>
          </header>

          <div className="flex-1 bg-gray-50">
            <main className="p-6">
              <Outlet />
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
