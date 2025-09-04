import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Scissors } from "lucide-react";
import { toast } from "sonner";
import QuickProfileFix from "../components/QuickProfileFix";

const UnifiedLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    signIn,
    userProfile,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    console.log(
      "🔄 UnifiedLogin useEffect - isAuthenticated:",
      isAuthenticated,
      "userProfile:",
      userProfile?.role,
      "authLoading:",
      authLoading
    );

    if (authLoading) {
      console.log("😴 Auth still loading, waiting...");
      return;
    }

    if (isAuthenticated && userProfile && !authLoading) {
      console.log("🔄 User already authenticated, redirecting...");
      switch (userProfile.role) {
        case "admin":
          console.log("👑 Redirecting admin to dashboard");
          navigate("/dashboard", { replace: true });
          break;
        case "hairstylist":
          console.log("✂️ Redirecting hairstylist to dashboard");
          navigate("/hairstylist/dashboard", { replace: true });
          break;
        case "member":
          console.log("👤 Redirecting member to dashboard");
          navigate("/member/dashboard", { replace: true });
          break;
        default:
          console.log("❌ Unknown role, staying on login");
          break;
      }
    }
  }, [isAuthenticated, userProfile, authLoading, navigate]);

  // Reset loading state when authentication is complete
  useEffect(() => {
    if (!authLoading && (userProfile || !isAuthenticated)) {
      setLoading(false);
    }
  }, [authLoading, userProfile, isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      console.log("🚀 Starting login process...");
      await signIn(email, password);
      console.log("✅ Sign in completed, checking for redirect...");

      // Don't navigate here, let the useEffect handle redirection
      // after the auth state is properly updated
    } catch (error: unknown) {
      console.error("❌ Login error:", error);
      setLoading(false); // Reset loading state on error
      // Error toast is already shown in the signIn function
    }
    // Note: Don't set loading to false here on success
    // Let the useEffect handle the navigation and state cleanup
  };

  return (
    <>
      <QuickProfileFix />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="space-y-6 text-center pt-8 pb-6">
              {/* Logo */}
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Scissors className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <CardTitle className="text-2xl font-semibold text-gray-900">
                  Welcome back
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Sign in to your Circle Keeper account
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                      placeholder="Enter your password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-sm"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in...
                    </div>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              {/* Demo Credentials */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Demo Accounts
                  </h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div>
                      <strong>Admin:</strong> admin@haijoel.com / admin123
                    </div>
                    <div>
                      <strong>Hairstylist:</strong> stylist@haijoel.com /
                      stylist123
                    </div>
                    <div>
                      <strong>Member:</strong> member@haijoel.com / member123
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                  Haijoel Men's Salon Management System
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              © 2024 Circle Keeper. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default UnifiedLogin;
