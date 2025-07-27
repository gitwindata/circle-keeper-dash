
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
import NotFound from "./pages/NotFound";
import CircleLanding from "./pages/CircleLanding";
import CircleLogin from "./pages/CircleLogin";
import CircleDashboard from "./pages/CircleDashboard";

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

          {/* Admin routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/members" element={
            <ProtectedRoute>
              <Members />
            </ProtectedRoute>
          } />
          <Route path="/members/add" element={
            <ProtectedRoute>
              <AddMember />
            </ProtectedRoute>
          } />
          <Route path="/stylists" element={
            <ProtectedRoute>
              <div>Stylists page - Coming soon</div>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <div>Reports page - Coming soon</div>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <div>Settings page - Coming soon</div>
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
