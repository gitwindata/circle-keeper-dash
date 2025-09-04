
import { 
  LogOut,
  Scissors
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface AppSidebarProps {
  menuItems: MenuItem[];
  onLogout: () => void;
  userRole: "admin" | "hairstylist";
}

export function AppSidebar({ menuItems, onLogout, userRole }: AppSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    // Exact match for root dashboard path
    if (path === '/dashboard' && currentPath === '/dashboard') {
      return true;
    }
    // For sub-paths, check if current path matches exactly
    if (path !== '/dashboard' && currentPath === path) {
      return true;
    }
    return false;
  };

  return (
    <Sidebar className="border-r border-gray-200 bg-white">
      <SidebarHeader className="p-6 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Circle Keeper</h2>
            <p className="text-sm text-gray-600 capitalize">{userRole}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4 bg-white">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className="w-full h-11 px-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 data-[active=true]:bg-orange-50 data-[active=true]:text-orange-700 data-[active=true]:border-orange-200"
                  >
                    <NavLink to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-100 bg-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={onLogout}
              className="w-full h-11 px-3 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
