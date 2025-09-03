import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { UserRole } from '../types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, requiredRole, allowedRoles }: ProtectedRouteProps) => {
  const { user, userProfile, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wait for user profile to load
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (requiredRole && userProfile.role !== requiredRole) {
    toast.error(`Access denied. ${requiredRole} role required.`);
    return <Navigate to="/unauthorized" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    toast.error('Access denied. Insufficient permissions.');
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

// Specific role-based route components for convenience
export const AdminRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
);

export const HairstylistRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="hairstylist">{children}</ProtectedRoute>
);

export const MemberRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="member">{children}</ProtectedRoute>
);

// Route that allows multiple roles
export const StaffRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['admin', 'hairstylist']}>{children}</ProtectedRoute>
);