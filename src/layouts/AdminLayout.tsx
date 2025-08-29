import React from 'react';
import DashboardLayout from './DashboardLayout';
import { LayoutDashboard, Users, Settings, TrendingUp, UserPlus } from 'lucide-react';

const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Members",
    url: "/dashboard/members",
    icon: Users,
  },
  {
    title: "Add Member",
    url: "/dashboard/members/add",
    icon: UserPlus,
  },
  {
    title: "Stylists",
    url: "/dashboard/stylists",
    icon: Users, // Re-using Users icon for now, consider a specific icon for stylists
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: TrendingUp,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

const AdminLayout: React.FC = () => {
  return (
    <DashboardLayout menuItems={adminMenuItems} userRole="admin" />
  );
};

export default AdminLayout;
