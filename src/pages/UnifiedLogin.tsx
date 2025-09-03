import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Mail, Lock, Scissors, Users, Crown } from 'lucide-react';
import { toast } from 'sonner';
import QuickProfileFix from '../components/QuickProfileFix';

const UnifiedLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'hairstylist' | 'member'>('member');
  const { signIn, userProfile, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    console.log('🔄 UnifiedLogin useEffect - isAuthenticated:', isAuthenticated, 'userProfile:', userProfile?.role, 'authLoading:', authLoading);
    
    if (authLoading) {
      console.log('😴 Auth still loading, waiting...');
      return;
    }
    
    if (isAuthenticated && userProfile && !authLoading) {
      console.log('🔄 User already authenticated, redirecting...');
      switch (userProfile.role) {
        case 'admin':
          console.log('👑 Redirecting admin to dashboard');
          navigate('/dashboard', { replace: true });
          break;
        case 'hairstylist':
          console.log('✂️ Redirecting hairstylist to dashboard');
          navigate('/hairstylist/dashboard', { replace: true });
          break;
        case 'member':
          console.log('👤 Redirecting member to dashboard');
          navigate('/member/dashboard', { replace: true });
          break;
        default:
          console.log('❌ Unknown role, staying on login');
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
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🚀 Starting login process...');
      await signIn(email, password);
      console.log('✅ Sign in completed, checking for redirect...');
      
      // Don't navigate here, let the useEffect handle redirection
      // after the auth state is properly updated
    } catch (error: any) {
      console.error('❌ Login error:', error);
      setLoading(false); // Reset loading state on error
      // Error toast is already shown in the signIn function
    }
    // Note: Don't set loading to false here on success
    // Let the useEffect handle the navigation and state cleanup
  };

  const roleInfo = {
    member: {
      icon: Crown,
      title: 'Member Login',
      description: 'Access your profile, visit history, and membership benefits',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    hairstylist: {
      icon: Scissors,
      title: 'Hairstylist Login',
      description: 'Manage your clients, record visits, and track your performance',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    admin: {
      icon: Users,
      title: 'Admin Login',
      description: 'Full system access for managing members, hairstylists, and business operations',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  };

  const currentRole = roleInfo[selectedRole];
  const IconComponent = currentRole.icon;

  return (
    <>
      <QuickProfileFix />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <Scissors className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Circle Keeper Dashboard</h1>
          <p className="text-gray-600">Haijoel Men's Salon Management System</p>
        </div>

        {/* Role Selection Tabs */}
        <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as any)} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="member" className="text-xs">
              <Crown className="h-4 w-4 mr-1" />
              Member
            </TabsTrigger>
            <TabsTrigger value="hairstylist" className="text-xs">
              <Scissors className="h-4 w-4 mr-1" />
              Hairstylist
            </TabsTrigger>
            <TabsTrigger value="admin" className="text-xs">
              <Users className="h-4 w-4 mr-1" />
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedRole} className="mt-4">
            <Card className={`${currentRole.bgColor} ${currentRole.borderColor} border-2`}>
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  <IconComponent className={`h-8 w-8 ${currentRole.color}`} />
                </div>
                <CardTitle className={`${currentRole.color} text-lg`}>
                  {currentRole.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {currentRole.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 pt-6 border-t">
              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Demo Credentials:</strong><br />
                  Admin: admin@haijoel.com / admin123<br />
                  Hairstylist: stylist@haijoel.com / stylist123<br />
                  Member: member@haijoel.com / member123
                </AlertDescription>
              </Alert>
            </div>

            {/* Footer Links */}
            <div className="mt-6 text-center text-sm text-gray-600">
              <Link to="/" className="hover:text-gray-900">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>© 2024 Haijoel Men's Salon. All rights reserved.</p>
          <p className="mt-1">Need help? Contact support</p>
        </div>
      </div>
    </div>
    </>
  );
};

export default UnifiedLogin;