import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isHairstylist: boolean;
  isMember: boolean;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching user profile for ID:', userId);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('❌ Error fetching user profile:', error);
        
        // Check for specific RLS recursion error
        if (error.code === '42P17' && error.message?.includes('infinite recursion')) {
          console.error('🔄 RLS Policy Error: Infinite recursion detected!');
          throw new Error('Database configuration error. Please check Row Level Security policies.');
        }
        
        // Check for missing profile
        if (error.code === 'PGRST116') {
          console.log('❓ User profile not found, attempting to create default profile...');
          return await createDefaultProfile(userId);
        }
        
        throw new Error(`Profile fetch failed: ${error.message}`);
      }
      
      console.log('✅ User profile found:', data);
      return data as UserProfile;
    } catch (error: any) {
      console.error('❌ Exception fetching user profile:', error);
      throw error;
    }
  };

  const createDefaultProfile = async (userId: string) => {
    try {
      console.log('🛠️ Creating default admin profile for user:', userId);
      
      // Get user email from auth
      const { data: authUser } = await supabase.auth.getUser();
      const userEmail = authUser.user?.email || 'admin@haijoel.com';
      
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: userEmail,
          role: 'admin', // Default to admin for now
          full_name: 'System Administrator',
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating default profile:', error);
        
        // Check for RLS recursion error
        if (error.code === '42P17' && error.message?.includes('infinite recursion')) {
          throw new Error('Database RLS policy error. Please disable RLS temporarily or fix policies.');
        }
        
        throw new Error(`Profile creation failed: ${error.message}`);
      }
      
      console.log('✅ Default profile created successfully:', data);
      return data as UserProfile;
    } catch (error: any) {
      console.error('❌ Exception creating default profile:', error);
      throw error;
    }
  };

  const refetchProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id).then(profile => {
          setUserProfile(profile);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.id);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('🔍 Auth state change - fetching profile for:', session.user.id);
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        } else {
          console.log('🚫 Auth state change - no user, clearing profile');
          setUserProfile(null);
        }
        
        console.log('🏁 Auth state change complete, setting loading to false');
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🚀 Starting sign in for:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Supabase auth error:', error);
        toast.error(error.message || 'Authentication failed');
        throw error;
      }

      console.log('✅ Supabase auth success:', data.user?.id);
      
      if (data.user) {
        console.log('🔍 Fetching user profile...');
        const profile = await fetchUserProfile(data.user.id);
        if (!profile) {
          console.error('❌ User profile not found for user:', data.user.id);
          toast.error('User profile not found. Please contact administrator.');
          throw new Error('User profile not found. Please contact administrator.');
        }
        console.log('✅ User profile loaded:', profile.role);
        
        // Don't set userProfile here, let the auth state change handler do it
        // This prevents double setting which might cause issues
        toast.success(`Welcome back, ${profile.full_name}!`);
      }
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      // Only show toast if we haven't already shown one
      if (!error.message?.includes('User profile not found')) {
        toast.error(error.message || 'Failed to sign in');
      }
      throw error;
    } finally {
      console.log('🏁 Sign in process completed, setting loading to false');
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setUserProfile(null);
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isAdmin: userProfile?.role === 'admin',
    isHairstylist: userProfile?.role === 'hairstylist',
    isMember: userProfile?.role === 'member',
    refetchProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for role-based access
export function useRequireAuth(requiredRole?: UserRole) {
  const auth = useAuth();
  
  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      throw new Error('Authentication required');
    }
    
    if (requiredRole && auth.userProfile?.role !== requiredRole) {
      throw new Error(`${requiredRole} access required`);
    }
  }, [auth.loading, auth.isAuthenticated, auth.userProfile?.role, requiredRole]);
  
  return auth;
}

// Legacy localStorage fallback for existing code
export function useLegacyAuth() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isHairstylistAuthenticated, setIsHairstylistAuthenticated] = useState(false);
  const [isMemberAuthenticated, setIsMemberAuthenticated] = useState(false);

  useEffect(() => {
    // Check legacy auth tokens
    const adminToken = localStorage.getItem('hms_admin_token');
    const hairstylistToken = localStorage.getItem('hms_hairstylist_token');
    const memberData = localStorage.getItem('hms_member_data');

    setIsAdminAuthenticated(!!adminToken);
    setIsHairstylistAuthenticated(!!hairstylistToken);
    setIsMemberAuthenticated(!!memberData);
  }, []);

  return {
    isAdminAuthenticated,
    isHairstylistAuthenticated,
    isMemberAuthenticated
  };
}