import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../hooks/use-auth';

const DebugPage = () => {
  const [dbStatus, setDbStatus] = useState<string>('Checking...');
  const [users, setUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    checkDatabaseConnection();
    loadUsers();
    loadProfiles();
  }, []);

  const checkDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('services').select('count');
      if (error) throw error;
      setDbStatus('✅ Connected');
    } catch (error: any) {
      setDbStatus(`❌ Error: ${error.message}`);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      setUsers(users || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*');
      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error loading profiles:', error);
    }
  };

  const createTestProfile = async (authUserId: string, email: string, role: 'admin' | 'hairstylist' | 'member') => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: authUserId,
          email: email,
          role: role,
          full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create role-specific record
      if (role === 'hairstylist') {
        await supabase.from('hairstylists').insert({ id: authUserId });
      } else if (role === 'member') {
        await supabase.from('members').insert({ id: authUserId });
      }
      
      alert(`✅ Profile created for ${email}`);
      loadProfiles();
    } catch (error: any) {
      alert(`❌ Error creating profile: ${error.message}`);
    }
  };

  return (
    <div className=\"p-6 max-w-6xl mx-auto\">
      <h1 className=\"text-2xl font-bold mb-6\">🔧 Debug Dashboard</h1>
      
      {/* Database Status */}
      <Card className=\"mb-6\">
        <CardHeader>
          <CardTitle>Database Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Status: {dbStatus}</p>
        </CardContent>
      </Card>

      {/* Current Auth State */}
      <Card className=\"mb-6\">
        <CardHeader>
          <CardTitle>Current Auth State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className=\"space-y-2\">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>User ID:</strong> {user?.id || 'Not authenticated'}</p>
            <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
            <p><strong>Profile Role:</strong> {userProfile?.role || 'No profile'}</p>
            <p><strong>Profile Name:</strong> {userProfile?.full_name || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Auth Users */}
      <Card className=\"mb-6\">
        <CardHeader>
          <CardTitle>Auth Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className=\"space-y-2 max-h-60 overflow-y-auto\">
            {users.map((user: any) => (
              <div key={user.id} className=\"border p-2 rounded\">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Profiles */}
      <Card className=\"mb-6\">
        <CardHeader>
          <CardTitle>User Profiles ({profiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className=\"space-y-2 max-h-60 overflow-y-auto\">
            {profiles.map((profile: any) => (
              <div key={profile.id} className=\"border p-2 rounded\">
                <p><strong>ID:</strong> {profile.id}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Role:</strong> {profile.role}</p>
                <p><strong>Name:</strong> {profile.full_name}</p>
                <p><strong>Active:</strong> {profile.is_active ? 'Yes' : 'No'}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className=\"space-y-4\">
            <div>
              <h3 className=\"font-semibold mb-2\">Create Test Profiles</h3>
              <p className=\"text-sm text-gray-600 mb-2\">
                First create users in Supabase Auth Dashboard, then use these buttons:
              </p>
              <div className=\"space-y-2\">
                {users.map((authUser: any) => {
                  const hasProfile = profiles.find(p => p.id === authUser.id);
                  if (hasProfile) return null;
                  
                  return (
                    <div key={authUser.id} className=\"flex items-center gap-2 p-2 border rounded\">
                      <span className=\"text-sm\">{authUser.email}</span>
                      <Button 
                        size=\"sm\" 
                        onClick={() => createTestProfile(authUser.id, authUser.email, 'admin')}
                      >
                        Make Admin
                      </Button>
                      <Button 
                        size=\"sm\" 
                        onClick={() => createTestProfile(authUser.id, authUser.email, 'hairstylist')}
                      >
                        Make Hairstylist
                      </Button>
                      <Button 
                        size=\"sm\" 
                        onClick={() => createTestProfile(authUser.id, authUser.email, 'member')}
                      >
                        Make Member
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <Button onClick={() => window.location.reload()}>
              🔄 Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugPage;