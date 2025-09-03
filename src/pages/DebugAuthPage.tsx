import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  Database, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface UserProfile {
  id: string;
  email: string;
  role: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

const DebugAuthPage = () => {
  const { user, userProfile, loading: authLoading, signIn } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Test login form
  const [testEmail, setTestEmail] = useState('admin@haijoel.com');
  const [testPassword, setTestPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [testingLogin, setTestingLogin] = useState(false);

  useEffect(() => {
    checkDatabaseConnection();
    fetchAuthData();
  }, []);

  const checkDatabaseConnection = async () => {
    try {
      setConnectionStatus('checking');
      const { data, error } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Database connection failed:', error);
      setConnectionStatus('failed');
      setError(error.message);
    }
  };

  const fetchAuthData = async () => {
    setLoading(true);
    try {
      // Check if we can access auth admin functions (this will fail if not admin)
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.log('Auth admin access not available (expected for non-service role)');
        setAuthUsers([]);
      } else {
        setAuthUsers(authData.users.map(u => ({
          id: u.id,
          email: u.email || '',
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at
        })));
      }

      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;
      setUserProfiles(profiles || []);
      
    } catch (error) {
      console.error('Error fetching auth data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setTestingLogin(true);
    try {
      console.log('🧪 Testing login with:', testEmail);
      await signIn(testEmail, testPassword);
      toast.success('Login test successful!');
    } catch (error: any) {
      console.error('Login test failed:', error);
      toast.error(`Login test failed: ${error.message}`);
    } finally {
      setTestingLogin(false);
    }
  };

  const createTestProfile = async (authUserId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: authUserId,
          email: email,
          role: 'admin',
          full_name: 'Test Admin User',
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Test profile created successfully!');
      fetchAuthData();
    } catch (error: any) {
      console.error('Error creating test profile:', error);
      toast.error(`Failed to create profile: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'hairstylist': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Authentication Debug Page
          </CardTitle>
          <CardDescription>
            This page helps diagnose authentication and user profile issues. Use this to troubleshoot login problems.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Current Auth State */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current Authentication State
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              {getStatusIcon(authLoading ? 'checking' : user ? 'connected' : 'failed')}
              <span className="text-sm">
                Auth Loading: {authLoading ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(user ? 'connected' : 'failed')}
              <span className="text-sm">
                User: {user ? 'Authenticated' : 'Not Authenticated'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(userProfile ? 'connected' : 'failed')}
              <span className="text-sm">
                Profile: {userProfile ? 'Loaded' : 'Not Loaded'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {userProfile && (
                <Badge className={getRoleBadgeColor(userProfile.role)}>
                  {userProfile.role}
                </Badge>
              )}
              <span className="text-sm">
                Role: {userProfile?.role || 'Unknown'}
              </span>
            </div>
          </div>
          
          {user && (
            <Alert>
              <AlertDescription>
                <strong>User ID:</strong> {user.id}<br/>
                <strong>Email:</strong> {user.email}<br/>
                <strong>Last Sign In:</strong> {user.last_sign_in_at || 'Never'}
              </AlertDescription>
            </Alert>
          )}
          
          {userProfile && (
            <Alert>
              <AlertDescription>
                <strong>Profile Name:</strong> {userProfile.full_name}<br/>
                <strong>Profile Role:</strong> {userProfile.role}<br/>
                <strong>Active:</strong> {userProfile.is_active ? 'Yes' : 'No'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Database Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Connection
            <Button 
              variant="outline" 
              size="sm"
              onClick={checkDatabaseConnection}
              disabled={connectionStatus === 'checking'}
            >
              <RefreshCw className={`h-4 w-4 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`} />
              Test Connection
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            {getStatusIcon(connectionStatus)}
            <span className="text-sm font-medium">
              Status: {connectionStatus === 'connected' ? 'Connected' : 
                      connectionStatus === 'failed' ? 'Failed' : 'Checking...'}
            </span>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Supabase URL:</strong><br/>
              {import.meta.env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ Missing'}
            </div>
            <div>
              <strong>Supabase Key:</strong><br/>
              {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Login */}
      <Card>
        <CardHeader>
          <CardTitle>Test Login</CardTitle>
          <CardDescription>
            Test the login functionality with credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="test-email">Email</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter test email"
              />
            </div>
            <div>
              <Label htmlFor="test-password">Password</Label>
              <div className="relative">
                <Input
                  id="test-password"
                  type={showPassword ? 'text' : 'password'}
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="Enter test password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={testLogin}
                disabled={testingLogin}
                className="w-full"
              >
                {testingLogin ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  'Test Login'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Profiles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            User Profiles
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchAuthData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            User profiles in the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading...</span>
            </div>
          ) : userProfiles.length === 0 ? (
            <Alert>
              <AlertDescription>
                No user profiles found in the database. This might be the cause of the login issue.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {userProfiles.map((profile) => (
                <div key={profile.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(profile.role)}>
                        {profile.role}
                      </Badge>
                      <span className="font-medium">{profile.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(profile.is_active ? 'active' : 'inactive')}
                      <span className="text-sm text-gray-500">
                        {profile.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>ID:</strong> {profile.id}</div>
                    <div><strong>Email:</strong> {profile.email}</div>
                    <div><strong>Created:</strong> {new Date(profile.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auth Users (if available) */}
      {authUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Authentication Users</CardTitle>
            <CardDescription>
              Users in Supabase Auth (requires service role access)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {authUsers.map((authUser) => {
                const hasProfile = userProfiles.some(p => p.id === authUser.id);
                return (
                  <div key={authUser.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{authUser.email}</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(hasProfile ? 'connected' : 'failed')}
                        <span className="text-sm">
                          {hasProfile ? 'Has Profile' : 'No Profile'}
                        </span>
                        {!hasProfile && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => createTestProfile(authUser.id, authUser.email)}
                          >
                            Create Profile
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div><strong>ID:</strong> {authUser.id}</div>
                      <div><strong>Created:</strong> {new Date(authUser.created_at).toLocaleString()}</div>
                      <div><strong>Last Sign In:</strong> {authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString() : 'Never'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DebugAuthPage;