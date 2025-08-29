
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import AddMember from "./pages/AddMember";
import Hairstylists from "./pages/Stylists";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import CircleLanding from "./pages/CircleLanding";
import CircleLogin from "./pages/CircleLogin";
import CircleDashboard from "./pages/CircleDashboard";
import HairstylistDashboard from "./pages/HairstylistDashboard";
import BiodataMember from "./pages/BiodataMember";
import HairstylistLogin from "./pages/HairstylistLogin";
import HairstylistLayout from "./layouts/HairstylistLayout";
import HairstylistMyMembers from "./pages/HairstylistMyMembers";
import HairstylistAllMembers from "./pages/HairstylistAllMembers";
import AdminLayout from "./layouts/AdminLayout";

const queryClient = new QueryClient();

// Protected Route component for admin
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("hms_admin_token");
    setIsAuthenticated(!!token);
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Protected Route component for members
const MemberProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isMember, setIsMember] = useState<boolean | null>(null);

  useEffect(() => {
    const memberData = localStorage.getItem("hms_member_data");
    setIsMember(!!memberData);
  }, []);

  if (isMember === null) {
    return <div>Loading...</div>;
  }

  return isMember ? <>{children}</> : <Navigate to="/circle/login" />;
};

// Protected Route component for hairstylists
const HairstylistProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isHairstylist, setIsHairstylist] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("hms_hairstylist_token");
    setIsHairstylist(!!token);
  }, []);

  if (isHairstylist === null) {
    return <div>Loading...</div>;
  }

  return isHairstylist ? <>{children}</> : <Navigate to="/hairstylist/login" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Member-facing routes */}
          <Route path="/" element={<CircleLanding />} />
          <Route path="/circle/login" element={<CircleLogin />} />
          <Route path="/circle/dashboard" element={
            <MemberProtectedRoute>
              <CircleDashboard />
            </MemberProtectedRoute>
          } />

          {/* Hairstylist routes */}
          <Route path="/hairstylist/login" element={<HairstylistLogin />} />
          <Route path="/hairstylist/dashboard" element={
            <HairstylistProtectedRoute>
              <HairstylistLayout />
            </HairstylistProtectedRoute>
          }>
            <Route index element={<HairstylistDashboard />} /> {/* Redirects to my-members */}
            <Route path="my-members" element={<HairstylistMyMembers />} />
            <Route path="all-members" element={<HairstylistAllMembers />} />
          </Route>

          {/* Admin routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="members" element={<Members />} />
            <Route path="members/add" element={<AddMember />} />
            <Route path="stylists" element={<Hairstylists />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Global Member Biodata View */}
          <Route path="biodata-member" element={
            <ProtectedRoute>
              <BiodataMember />
            </ProtectedRoute>
          } />

          <Route path="/circle" element={<CircleLanding />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
