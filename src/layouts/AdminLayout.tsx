import React from 'react';
import DashboardLayout from './DashboardLayout';
import { LayoutDashboard, Users } from 'lucide-react';

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
    title: "Hairstylists",
    url: "/dashboard/stylists",
    icon: Users,
  },
];

const AdminLayout: React.FC = () => {
  return (
    <DashboardLayout menuItems={adminMenuItems} userRole="admin" />
  );
};

export default AdminLayout;
