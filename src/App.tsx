import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/use-auth";
import ProtectedRoute, {
  AdminRoute,
  HairstylistRoute,
  MemberRoute,
} from "./components/ProtectedRoute";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import { useEffect } from "react";

// Pages
import Index from "./pages/Index";
import UnifiedLogin from "./pages/UnifiedLogin";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Hairstylists from "./pages/Stylists";
import NotFound from "./pages/NotFound";
import CircleLanding from "./pages/CircleLanding";
import CircleDashboard from "./pages/CircleDashboard";
import HairstylistDashboard from "./pages/HairstylistDashboard";
import BiodataMember from "./pages/BiodataMember";
import DebugAuthPage from "./pages/DebugAuthPage";

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import HairstylistLayout from "./layouts/HairstylistLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  // Force light mode
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.body.className = "bg-gray-50 text-gray-900";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<CircleLanding />} />
              <Route path="/login" element={<UnifiedLogin />} />
              <Route path="/circle" element={<CircleLanding />} />
              <Route path="/debug-auth" element={<DebugAuthPage />} />

              {/* Auto-redirect based on role after login */}
              <Route
                path="/redirect"
                element={
                  <ProtectedRoute>
                    <RoleBasedRedirect />
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route
                path="/dashboard"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="members" element={<Members />} />
                <Route path="stylists" element={<Hairstylists />} />
              </Route>

              {/* Hairstylist routes */}
              <Route
                path="/hairstylist/dashboard"
                element={
                  <HairstylistRoute>
                    <HairstylistLayout />
                  </HairstylistRoute>
                }
              >
                <Route index element={<HairstylistDashboard />} />
              </Route>

              {/* Member routes */}
              <Route
                path="/member/dashboard"
                element={
                  <MemberRoute>
                    <CircleDashboard />
                  </MemberRoute>
                }
              />

              {/* Shared routes for authenticated users */}
              <Route
                path="/biodata-member"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hairstylist"]}>
                    <BiodataMember />
                  </ProtectedRoute>
                }
              />

              {/* Legacy redirects for backward compatibility */}
              <Route
                path="/circle/login"
                element={<Navigate to="/login" replace />}
              />
              <Route
                path="/hairstylist/login"
                element={<Navigate to="/login" replace />}
              />
              <Route
                path="/circle/dashboard"
                element={<Navigate to="/member/dashboard" replace />}
              />

              {/* Error routes */}
              <Route
                path="/unauthorized"
                element={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Access Denied
                      </h1>
                      <p className="text-gray-600 mb-4">
                        You don't have permission to access this page.
                      </p>
                      <a
                        href="/login"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Back to Login
                      </a>
                    </div>
                  </div>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
