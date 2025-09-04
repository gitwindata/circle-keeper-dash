import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Star, 
  Clock, 
  DollarSign, 
  Camera, 
  MessageSquare,
  Award,
  Activity,
  Plus,
  UserPlus
} from "lucide-react";
import { useAuth } from '../hooks/use-auth';
import { hairstylistHelpers, visitHelpers, memberHelpers } from '../lib/supabase-helpers';
import { MembershipCalculator } from '../lib/membership-calculator';
import VisitRecordingForm from '../components/VisitRecordingForm';
import PersonalNotesManager from '../components/PersonalNotesManager';
import MemberAssignmentDialog from '../components/MemberAssignmentDialog';
import PhotoGallery from '../components/PhotoGallery';
import { Member, Visit, Hairstylist, MembershipTier } from '../types';
import { format } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";

interface HairstylistStats {
  totalAssignedMembers: number;
  thisWeekVisits: number;
  thisMonthRevenue: number;
  averageRating: number;
  totalVisits: number;
  membershipDistribution: Record<MembershipTier, number>;
}

interface RecentActivity {
  id: string;
  type: 'visit' | 'note' | 'photo' | 'review';
  description: string;
  timestamp: string;
  member?: string;
}

const HairstylistDashboard = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [hairstylistData, setHairstylistData] = useState<Hairstylist | null>(null);
  const [assignedMembers, setAssignedMembers] = useState<Member[]>([]);
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);
  const [stats, setStats] = useState<HairstylistStats>({
    totalAssignedMembers: 0,
    thisWeekVisits: 0,
    thisMonthRevenue: 0,
    averageRating: 0,
    totalVisits: 0,
    membershipDistribution: {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      diamond: 0
    }
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);

  useEffect(() => {
    if (user && userProfile?.role === 'hairstylist') {
      loadHairstylistData();
    }
  }, [user, userProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadHairstylistData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('🔄 Loading hairstylist data for user ID:', user.id);
      
      // Load hairstylist profile
      const hairstylist = await hairstylistHelpers.getHairstylistWithProfile(user.id);
      if (!hairstylist) {
        toast({
          title: "Error",
          description: "Hairstylist profile not found",
          variant: "destructive"
        });
        return;
      }
      setHairstylistData(hairstylist);
      console.log('✅ Hairstylist profile loaded:', hairstylist);
      
      // Load assigned members using user ID (not hairstylist.id)
      console.log('🔍 Loading assigned members for user ID:', user.id);
      const members = await hairstylistHelpers.getAssignedMembers(user.id);
      setAssignedMembers(members);
      console.log('👥 Assigned members loaded:', members);
      
      // Load recent visits
      const visits = await visitHelpers.getVisitsWithDetails({
        hairstylist_id: user.id,
        limit: 20
      });
      setRecentVisits(visits);
      
      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const thisWeekVisits = visits.filter(
        visit => new Date(visit.visit_date) >= weekAgo
      ).length;
      
      const thisMonthRevenue = visits
        .filter(visit => new Date(visit.visit_date) >= monthAgo)
        .reduce((sum, visit) => sum + (visit.final_price || 0), 0);
      
      // Calculate membership distribution of assigned members
      const membershipDistribution: Record<MembershipTier, number> = {
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 0,
        diamond: 0
      };
      
      members.forEach(member => {
        membershipDistribution[member.membership_tier]++;
      });
      
      setStats({
        totalAssignedMembers: members.length,
        thisWeekVisits,
        thisMonthRevenue,
        averageRating: 4.7, // Could calculate from reviews
        totalVisits: visits.length,
        membershipDistribution
      });
      
      // Generate recent activity
      const activities: RecentActivity[] = [];
      
      // Add recent visits
      visits.slice(0, 5).forEach(visit => {
        activities.push({
          id: `visit-${visit.id}`,
          type: 'visit',
          description: `Visit completed with ${visit.member?.user_profile?.full_name}`,
          timestamp: visit.visit_date,
          member: visit.member?.user_profile?.full_name
        });
      });
      
      // Sort activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 8));
      
    } catch (error) {
      console.error('Failed to load hairstylist data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentComplete = () => {
    // Reload data after assignment
    loadHairstylistData();
    setShowAssignmentDialog(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'visit': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'note': return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'photo': return <Camera className="h-4 w-4 text-purple-500" />;
      case 'review': return <Star className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMembershipColor = (tier: MembershipTier) => {
    return MembershipCalculator.getTierColor(tier);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hairstylistData || !userProfile) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600">Hairstylist profile not found</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Assigned Members",
      value: stats.totalAssignedMembers,
      icon: Users,
      description: "Members under your care",
      color: "text-blue-600"
    },
    {
      title: "This Week Visits",
      value: stats.thisWeekVisits,
      icon: Calendar,
      description: "Last 7 days",
      color: "text-green-600"
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(stats.thisMonthRevenue),
      icon: DollarSign,
      description: "Last 30 days",
      color: "text-purple-600"
    },
    {
      title: "Your Rating",
      value: `${stats.averageRating}/5`,
      icon: Star,
      description: "Customer rating",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome, {userProfile.full_name?.split(' ')[0]}
          </h2>
          <p className="text-muted-foreground">
            Here's your performance overview and client management tools
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowVisitForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Visit
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowAssignmentDialog(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assign Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">My Members</TabsTrigger>
          <TabsTrigger value="visits">Recent Visits</TabsTrigger>
          <TabsTrigger value="photos">Photo Gallery</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest activities and client interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentActivity.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Member Tier Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Member Tiers</CardTitle>
                <CardDescription>
                  Distribution of your assigned members by tier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.membershipDistribution).map(([tier, count]) => {
                    const tierInfo = MembershipCalculator.getLevelInfo(tier as MembershipTier);
                    const percentage = stats.totalAssignedMembers > 0 ? (count / stats.totalAssignedMembers) * 100 : 0;
                    
                    return (
                      <div key={tier} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge className={`${getMembershipColor(tier as MembershipTier)} text-white text-xs`}>
                              {tierInfo.name}
                            </Badge>
                            <span className="text-muted-foreground">
                              {count} members
                            </span>
                          </div>
                          <span className="font-medium">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={percentage} className="h-1" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Assigned Members</CardTitle>
                  <CardDescription>
                    Members under your care and their details
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  {assignedMembers.length} member(s) assigned
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {assignedMembers.slice(0, 6).map((member) => (
                  <Card key={member.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.user_profile?.avatar_url} />
                          <AvatarFallback>
                            {member.user_profile?.full_name?.[0] || 'M'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {member.user_profile?.full_name}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={`${getMembershipColor(member.membership_tier)} text-white text-xs`}
                            >
                              {MembershipCalculator.formatTierName(member.membership_tier)}
                            </Badge>
                            {!member.user_profile?.is_active && (
                              <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>
                          <span>Visits: </span>
                          <span className="font-medium">{member.total_visits}</span>
                        </div>
                        <div>
                          <span>Points: </span>
                          <span className="font-medium">{member.membership_points}</span>
                        </div>
                      </div>
                      
                      {/* Membership Progress */}
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Progress to next tier</span>
                          <span>
                            {(() => {
                              const progress = MembershipCalculator.calculateProgress(
                                member.total_visits, 
                                member.total_spent, 
                                member.membership_tier
                              );
                              return `${Math.round(progress.overallProgress)}%`;
                            })()} 
                          </span>
                        </div>
                        <Progress 
                          value={(() => {
                            const progress = MembershipCalculator.calculateProgress(
                              member.total_visits, 
                              member.total_spent, 
                              member.membership_tier
                            );
                            return progress.overallProgress;
                          })()} 
                          className="h-1" 
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {assignedMembers.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Members Assigned</h3>
                    <p className="text-gray-600">Contact your admin to get members assigned to you.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Visits Tab */}
        <TabsContent value="visits">
          <Card>
            <CardHeader>
              <CardTitle>Recent Visits</CardTitle>
              <CardDescription>
                Your recent client visits and services performed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentVisits.slice(0, 10).map((visit) => (
                  <div key={visit.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={visit.member?.user_profile?.avatar_url} />
                          <AvatarFallback>
                            {visit.member?.user_profile?.full_name?.[0] || 'M'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {visit.member?.user_profile?.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(visit.visit_date), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(visit.final_price)}
                        </p>
                        {visit.discount_percentage > 0 && (
                          <p className="text-sm text-green-600">
                            {visit.discount_percentage}% discount
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {visit.services && visit.services.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {visit.services.map((vs, index: number) => (
                          <Badge key={index} variant="secondary">
                            {vs.service?.name || 'Unknown Service'}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {visit.hairstylist_notes && (
                      <p className="text-sm text-muted-foreground italic">
                        "{visit.hairstylist_notes}"
                      </p>
                    )}
                  </div>
                ))}
                {recentVisits.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Visits Yet</h3>
                    <p className="text-gray-600">Start recording visits to see them here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photo Gallery Tab */}
        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>Photo Gallery</CardTitle>
              <CardDescription>
                Photos from your client visits and transformations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoGallery
                hairstylistId={user?.id}
                showPrivatePhotos={true}
                className=""
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <PersonalNotesManager 
            hairstylistId={user?.id || ''}
          />
        </TabsContent>
      </Tabs>

      {/* Visit Recording Modal */}
      {showVisitForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Record New Visit</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowVisitForm(false)}
                >
                  ×
                </Button>
              </div>
              <VisitRecordingForm
                hairstylistId={user?.id || ''}
                assignedMembers={assignedMembers}
                onVisitRecorded={() => {
                  setShowVisitForm(false);
                  loadHairstylistData();
                }}
                onCancel={() => setShowVisitForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Member Assignment Dialog */}
      <MemberAssignmentDialog
        open={showAssignmentDialog}
        onOpenChange={setShowAssignmentDialog}
        hairstylistId={user?.id || ''}
        onAssignmentComplete={handleAssignmentComplete}
      />
    </div>
  );
};

export default HairstylistDashboard;
