
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LogOut, Star, Calendar, TrendingUp, Camera, Award, User, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from '../hooks/use-auth';
import { memberHelpers, visitHelpers } from '../lib/supabase-helpers';
import { MembershipCalculator } from '../lib/membership-calculator';
import PhotoGallery from '../components/PhotoGallery';
import ReviewSystem from '../components/ReviewSystem';
import MembershipLevelCard from '../components/MembershipLevelCard';
import { Member, Visit, MembershipTier } from '../types';

const CircleDashboard = () => {
  const { user, userProfile, signOut } = useAuth();
  const [memberData, setMemberData] = useState<Member | null>(null);
  const [visitHistory, setVisitHistory] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadMemberData();
    }
  }, [user]);

  const loadMemberData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load member profile with user data
      const member = await memberHelpers.getMemberWithProfile(user.id);
      if (member) {
        setMemberData(member);
        
        // Load visit history
        const visits = await visitHelpers.getVisitsWithDetails({
          member_id: user.id,
          limit: 10
        });
        setVisitHistory(visits);
      }
    } catch (error) {
      console.error('Failed to load member data:', error);
      toast.error('Failed to load your profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout');
    }
  };

  const getMembershipProgress = () => {
    if (!memberData) return { visitProgress: 0, spendingProgress: 0, overallProgress: 0, isMaxTier: false };
    
    return MembershipCalculator.calculateProgress(
      memberData.total_visits,
      memberData.total_spent,
      memberData.membership_tier
    );
  };

  const getNextTierInfo = () => {
    if (!memberData) return { nextTier: null, requirementsToNext: null };
    
    return MembershipCalculator.getNextTierInfo(memberData.membership_tier);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!memberData || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Member profile not found</p>
          <Button onClick={handleLogout} className="mt-4">
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  const membershipInfo = MembershipCalculator.getLevelInfo(memberData.membership_tier);
  const progress = getMembershipProgress();
  const nextTierInfo = getNextTierInfo();
  const firstName = userProfile.full_name?.split(' ')[0] || 'Member';
  const lastVisit = visitHistory[0];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/hms logo white.svg" alt="HMS Logo" className="h-16 w-16" />
            <div>
              <h1 className="text-xl font-medium">The Circle</h1>
              <p className="text-sm text-gray-400">Member Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Welcome back</p>
              <p className="font-medium">{userProfile.full_name}</p>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="text-gray-300 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Welcome Section with Membership Info */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-light mb-2">Welcome back, {firstName}.</h1>
              <div className="flex items-center gap-3">
                <Badge 
                  className={`${membershipInfo.color} text-white px-3 py-1`}
                  variant="secondary"
                >
                  <Award className="h-4 w-4 mr-1" />
                  {membershipInfo.name} Member
                </Badge>
                <span className="text-gray-400">
                  Since {format(new Date(memberData.created_at), 'MMMM yyyy')}
                </span>
              </div>
            </div>
            
            {/* Membership Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-2xl font-bold text-amber-500">{memberData.total_visits}</p>
                <p className="text-xs text-gray-400">Total Visits</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-2xl font-bold text-green-500">{formatCurrency(memberData.total_spent)}</p>
                <p className="text-xs text-gray-400">Total Spent</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-2xl font-bold text-blue-500">{memberData.loyalty_points}</p>
                <p className="text-xs text-gray-400">Points</p>
              </div>
            </div>
          </div>


        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="membership" className="data-[state=active]:bg-amber-600">
              Membership
            </TabsTrigger>
            <TabsTrigger value="visits" className="data-[state=active]:bg-amber-600">
              Visit History
            </TabsTrigger>
            <TabsTrigger value="photos" className="data-[state=active]:bg-amber-600">
              Photo Gallery
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-amber-600">
              Reviews
            </TabsTrigger>
          </TabsList>

          {/* Membership Tab */}
          <TabsContent value="membership" className="space-y-6">
            <MembershipLevelCard member={memberData} className="bg-gray-800 border-gray-700 text-white" />
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Last Visit Section */}
            {lastVisit && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-amber-500" />
                    Your Last Visit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Date</p>
                      <p className="text-white font-medium">
                        {format(new Date(lastVisit.visit_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Hairstylist</p>
                      <p className="text-white font-medium">
                        {lastVisit.hairstylist?.user_profile?.full_name || 'N/A'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Services</p>
                      <p className="text-white font-medium">
                        {lastVisit.visit_services?.length || 0} service(s)
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Amount</p>
                      <p className="text-white font-medium">
                        {formatCurrency(lastVisit.final_price)}
                      </p>
                    </div>
                  </div>
                  
                  {lastVisit.visit_services && lastVisit.visit_services.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <p className="text-gray-400 text-sm mb-2">Services:</p>
                      <div className="flex flex-wrap gap-2">
                        {lastVisit.visit_services.map((vs: any, index: number) => (
                          <Badge key={index} variant="outline" className="border-gray-600">
                            {vs.service?.name || 'Unknown Service'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Membership Benefits */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Your {membershipInfo.name} Benefits
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Enjoy {membershipInfo.discountPercentage}% discount on all services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {membershipInfo.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visit History Tab */}
          <TabsContent value="visits" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Visit History</CardTitle>
                <CardDescription className="text-gray-300">
                  Your recent visits and services
                </CardDescription>
              </CardHeader>
              <CardContent>
                {visitHistory.length > 0 ? (
                  <div className="space-y-4">
                    {visitHistory.map((visit) => (
                      <div key={visit.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-white font-medium">
                              {format(new Date(visit.visit_date), 'MMMM d, yyyy')}
                            </p>
                            <p className="text-gray-400 text-sm">
                              with {visit.hairstylist?.user_profile?.full_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">
                              {formatCurrency(visit.final_price)}
                            </p>
                            {visit.discount_percentage > 0 && (
                              <p className="text-green-400 text-sm">
                                {visit.discount_percentage}% discount applied
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {visit.visit_services && visit.visit_services.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {visit.visit_services.map((vs: any, index: number) => (
                              <Badge key={index} variant="secondary" className="bg-gray-600">
                                {vs.service?.name || 'Unknown Service'}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {visit.visit_photos && visit.visit_photos.length > 0 && (
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Camera className="h-4 w-4" />
                            {visit.visit_photos.length} photo(s)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Visits Yet</h3>
                    <p className="text-gray-600">Your visit history will appear here once you start visiting.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photo Gallery Tab */}
          <TabsContent value="photos">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Your Photo Gallery</CardTitle>
                <CardDescription className="text-gray-300">
                  Browse your transformation photos from all visits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PhotoGallery
                  memberId={user?.id}
                  showPrivatePhotos={true}
                  className=""
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <ReviewSystem 
              memberId={user?.id || ''}
              showSubmitForm={false}
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm pt-8 border-t border-gray-800 mt-8">
          <p>Need assistance? Contact your hairstylist or visit our salon.</p>
          <p className="mt-1">Haijoel Men's Salon - Your grooming destination</p>
        </div>
      </div>
    </div>
  );
};

export default CircleDashboard;
