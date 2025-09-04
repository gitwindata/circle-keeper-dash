import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { UserProfile, UserRole } from "../types";
import { toast } from "sonner";

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
  const isInitializing = useRef(false);
  const currentUserId = useRef<string | null>(null);

  const createDefaultProfile = useCallback(
    async (userId: string): Promise<UserProfile> => {
      try {
        console.log("🆕 Creating default profile for user:", userId);
        const { data: user } = await supabase.auth.getUser();

        const newProfile: Omit<
          UserProfile,
          "id" | "created_at" | "updated_at"
        > = {
          email: user.user?.email || "",
          full_name: user.user?.user_metadata?.full_name || "New User",
          role: "hairstylist",
          avatar_url: null,
          phone: null,
          is_active: true,
        };

        const { data, error } = await supabase
          .from("user_profiles")
          .insert([{ ...newProfile, id: userId }])
          .select()
          .single();

        if (error) {
          console.error("❌ Error creating default profile:", error);
          throw new Error(`Failed to create profile: ${error.message}`);
        }

        console.log("✅ Default profile created:", data);
        return data as UserProfile;
      } catch (error: unknown) {
        console.error("❌ Exception creating default profile:", error);
        throw error;
      }
    },
    []
  );

  const fetchUserProfile = useCallback(
    async (userId: string) => {
      try {
        console.log("🔍 Fetching user profile for ID:", userId);
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("❌ Error fetching user profile:", error);

          // Check for specific RLS recursion error
          if (
            error.code === "42P17" &&
            error.message?.includes("infinite recursion")
          ) {
            console.error("🔄 RLS Policy Error: Infinite recursion detected!");
            throw new Error(
              "Database configuration error. Please check Row Level Security policies."
            );
          }

          // Check for missing profile
          if (error.code === "PGRST116") {
            console.log(
              "❓ User profile not found, attempting to create default profile..."
            );
            return await createDefaultProfile(userId);
          }

          throw new Error(`Profile fetch failed: ${error.message}`);
        }

        console.log("✅ User profile found:", data);
        return data as UserProfile;
      } catch (error: unknown) {
        console.error("❌ Exception fetching user profile:", error);
        throw error;
      }
    },
    [createDefaultProfile]
  );

  const refetchProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    const initializeAuth = async () => {
      if (isInitializing.current) return;
      isInitializing.current = true;

      try {
        console.log("🚀 Initializing auth...");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("❌ Error getting session:", error);
          if (isMounted) setLoading(false);
          return;
        }

        if (session?.user && isMounted) {
          console.log("✅ Session found, setting user state...");
          setUser(session.user);
          currentUserId.current = session.user.id;

          try {
            const profile = await fetchUserProfile(session.user.id);
            if (isMounted) {
              setUserProfile(profile);
              console.log("✅ Profile loaded successfully");
            }
          } catch (error) {
            console.error("❌ Error fetching profile:", error);
            if (isMounted) {
              setUserProfile(null);
              toast.error("Failed to load user profile");
            }
          }
        } else {
          console.log("🚫 No session found");
          if (isMounted) {
            setUser(null);
            setUserProfile(null);
            currentUserId.current = null;
          }
        }
      } catch (error) {
        console.error("❌ Error initializing auth:", error);
        if (isMounted) {
          setUser(null);
          setUserProfile(null);
          currentUserId.current = null;
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log("🏁 Auth initialization complete");
        }
        isInitializing.current = false;
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted || isInitializing.current) return;

      console.log("🔄 Auth state change:", event, session?.user?.id);

      if (event === "SIGNED_OUT" || !session?.user) {
        console.log("🚫 User signed out or no session");
        setUser(null);
        setUserProfile(null);
        currentUserId.current = null;
        setLoading(false);
        return;
      }

      // Only handle SIGNED_IN if this is actually a new user
      if (event === "SIGNED_IN" && session?.user) {
        // Skip if we already have this user loaded
        if (currentUserId.current === session.user.id) {
          console.log("✅ Same user already loaded, skipping profile fetch");
          if (isMounted) setLoading(false);
          return;
        }

        console.log("✅ New user signed in, updating state...");
        setUser(session.user);
        currentUserId.current = session.user.id;

        try {
          const profile = await fetchUserProfile(session.user.id);
          if (isMounted) {
            setUserProfile(profile);
            console.log("✅ Profile updated after sign in");
          }
        } catch (error) {
          console.error("❌ Error fetching profile after sign in:", error);
          if (isMounted) {
            setUserProfile(null);
          }
        }
      }

      if (isMounted) {
        setLoading(false);
        console.log("🏁 Auth state change complete");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("🚀 Starting sign in for:", email);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Supabase auth error:", error);
        toast.error(error.message || "Authentication failed");
        throw error;
      }

      console.log("✅ Supabase auth success:", data.user?.id);

      // Don't fetch profile here - let the auth state change handler do it
      // This prevents double fetching and race conditions
      if (data.user) {
        console.log(
          "✅ Sign in successful, auth state change will handle profile loading"
        );
        toast.success("Welcome back!");
      }
    } catch (error: unknown) {
      console.error("❌ Sign in error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to sign in";
      toast.error(errorMessage);
      setLoading(false); // Reset loading on error
      throw error;
    }
    // Don't set loading to false here - let auth state change handle it
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setUserProfile(null);
      toast.success("Signed out successfully");
    } catch (error: unknown) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
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
    isAdmin: userProfile?.role === "admin",
    isHairstylist: userProfile?.role === "hairstylist",
    isMember: userProfile?.role === "member",
    refetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook for role-based access
export function useRequireAuth(requiredRole?: UserRole) {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      throw new Error("Authentication required");
    }

    if (requiredRole && auth.userProfile?.role !== requiredRole) {
      throw new Error(`${requiredRole} access required`);
    }
  }, [
    auth.loading,
    auth.isAuthenticated,
    auth.userProfile?.role,
    requiredRole,
  ]);

  return auth;
}

// Legacy localStorage fallback for existing code
export function useLegacyAuth() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isHairstylistAuthenticated, setIsHairstylistAuthenticated] =
    useState(false);
  const [isMemberAuthenticated, setIsMemberAuthenticated] = useState(false);

  useEffect(() => {
    // Check legacy auth tokens
    const adminToken = localStorage.getItem("hms_admin_token");
    const hairstylistToken = localStorage.getItem("hms_hairstylist_token");
    const memberData = localStorage.getItem("hms_member_data");

    setIsAdminAuthenticated(!!adminToken);
    setIsHairstylistAuthenticated(!!hairstylistToken);
    setIsMemberAuthenticated(!!memberData);
  }, []);

  return {
    isAdminAuthenticated,
    isHairstylistAuthenticated,
    isMemberAuthenticated,
  };
}
