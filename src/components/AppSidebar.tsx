
import { 
  Home, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  UserPlus
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import React from "react"; // Import React

const HmsLogoIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img src="/hms logo white.svg" alt="HMS Logo" {...props} />
);

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

  const isActive = (path: string) => currentPath.startsWith(path); // Use startsWith for nested routes

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <img src="/hms logo white.svg" alt="HMS Logo" className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">HMS</h2>
            <p className="text-sm text-muted-foreground">The Circle {userRole === "admin" ? "Admin" : "Hairstylist"}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                  >
                    <NavLink to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
