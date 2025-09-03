import { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const QuickProfileFix = () => {
  const { user, userProfile, loading: authLoading, refetchProfile } = useAuth();
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  const createProfile = async () => {
    if (!user) return;
    
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email || 'admin@haijoel.com',
          role: 'admin',
          full_name: 'System Administrator',
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('✅ Profile created:', data);
      toast.success('Profile created successfully!');
      setCreated(true);
      
      // Refresh the profile
      await refetchProfile();
      
      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Error creating profile:', error);
      toast.error(`Failed to create profile: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  // Don't show if user is not authenticated
  if (!user) return null;
  
  // Don't show if profile already exists
  if (userProfile) return null;
  
  // Don't show if still loading
  if (authLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Profile Setup Required
          </CardTitle>
          <CardDescription>
            Your account is authenticated but missing a user profile. 
            Click below to create your admin profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>User ID:</strong> {user.id}<br/>
              <strong>Email:</strong> {user.email}
            </AlertDescription>
          </Alert>
          
          {created ? (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-green-600 font-medium">Profile Created Successfully!</p>
              <p className="text-sm text-gray-600">Redirecting to dashboard...</p>
            </div>
          ) : (
            <Button 
              onClick={createProfile}
              disabled={creating}
              className="w-full"
              size="lg"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Profile...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Admin Profile
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickProfileFix;