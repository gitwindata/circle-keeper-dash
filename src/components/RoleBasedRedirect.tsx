import { useAuth } from '../hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

// Auto-redirect component based on user role
const RoleBasedRedirect = () => {
  const { userProfile, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🧭 RoleBasedRedirect - loading:', loading, 'user:', user?.id, 'userProfile:', userProfile?.role);
    
    if (loading || !userProfile) {
      console.log('😴 RoleBasedRedirect - waiting for auth to complete...');
      return;
    }

    console.log('🚀 RoleBasedRedirect - redirecting user with role:', userProfile.role);
    
    // Redirect based on user role
    switch (userProfile.role) {
      case 'admin':
        console.log('👑 Redirecting admin to /dashboard');
        navigate('/dashboard', { replace: true });
        break;
      case 'hairstylist':
        console.log('✂️ Redirecting hairstylist to /hairstylist/dashboard');
        navigate('/hairstylist/dashboard', { replace: true });
        break;
      case 'member':
        console.log('👤 Redirecting member to /member/dashboard');
        navigate('/member/dashboard', { replace: true });
        break;
      default:
        console.log('❌ Unknown role, redirecting to /unauthorized');
        navigate('/unauthorized', { replace: true });
    }
  }, [userProfile, loading, navigate, user]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
        {/* Debug info */}
        <div className="mt-4 text-xs text-gray-400">
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
          <p>User: {user ? 'Authenticated' : 'Not authenticated'}</p>
          <p>Profile: {userProfile ? userProfile.role : 'Not loaded'}</p>
        </div>
      </div>
    </div>
  );
};

export default RoleBasedRedirect;