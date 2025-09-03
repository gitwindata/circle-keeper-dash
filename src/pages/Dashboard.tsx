
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, TrendingUp, UserPlus, DollarSign, Star, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from '../hooks/use-auth';
import { memberHelpers, hairstylistHelpers, visitHelpers } from '../lib/supabase-helpers';
import { MembershipCalculator } from '../lib/membership-calculator';
import MemberAssignmentPanel from '../components/MemberAssignmentPanel';
import { Member, Hairstylist, Visit, MembershipTier } from '../types';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface DashboardStats {
  totalMembers: number;
  totalHairstylists: number;
  thisWeekVisits: number;
  thisMonthRevenue: number;
  averageRating: number;
  membershipDistribution: Record<MembershipTier, number>;
}

interface RecentActivity {
  id: string;
  type: 'visit' | 'member_added' | 'review' | 'upgrade';
  description: string;
  timestamp: string;
  member?: string;
  hairstylist?: string;
}

const Dashboard = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalHairstylists: 0,
    thisWeekVisits: 0,
    thisMonthRevenue: 0,
    averageRating: 0,
    membershipDistribution: {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      diamond: 0
    }
  });
  const [members, setMembers] = useState<(Member & { user_profile: any })[]>([]);
  const [hairstylists, setHairstylists] = useState<(Hairstylist & { user_profile: any })[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      loadDashboardData();
    }
  }, [userProfile]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load members and hairstylists
      const [membersData, hairstylistsData] = await Promise.all([
        memberHelpers.getAllMembersWithProfiles(),
        hairstylistHelpers.getAllHairstylistsWithProfiles()
      ]);
      
      setMembers(membersData);
      setHairstylists(hairstylistsData);
      
      // Load recent visits for stats
      const recentVisits = await visitHelpers.getVisitsWithDetails({ limit: 100 });
      
      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const thisWeekVisits = recentVisits.filter(
        visit => new Date(visit.visit_date) >= weekAgo
      ).length;
      
      const thisMonthRevenue = recentVisits
        .filter(visit => new Date(visit.visit_date) >= monthAgo)
        .reduce((sum, visit) => sum + (visit.final_price || 0), 0);
      
      // Calculate membership distribution
      const membershipStats = MembershipCalculator.getMembershipStats(membersData);
      
      setStats({
        totalMembers: membersData.length,
        totalHairstylists: hairstylistsData.length,
        thisWeekVisits,
        thisMonthRevenue,
        averageRating: 4.8, // Could calculate from reviews
        membershipDistribution: membershipStats.tierDistribution
      });
      
      // Generate recent activity
      const activities: RecentActivity[] = [];
      
      // Add recent visits
      recentVisits.slice(0, 5).forEach(visit => {
        activities.push({
          id: `visit-${visit.id}`,
          type: 'visit',
          description: `${visit.member?.user_profile?.full_name} visited ${visit.hairstylist?.user_profile?.full_name}`,
          timestamp: visit.visit_date,
          member: visit.member?.user_profile?.full_name,
          hairstylist: visit.hairstylist?.user_profile?.full_name
        });
      });
      
      // Add new members
      membersData
        .filter(member => {
          const createdAt = new Date(member.created_at);
          return createdAt >= weekAgo;
        })
        .slice(0, 3)
        .forEach(member => {
          activities.push({
            id: `member-${member.id}`,
            type: 'member_added',
            description: `${member.user_profile?.full_name} joined The Circle`,
            timestamp: member.created_at,
            member: member.user_profile?.full_name
          });
        });
      
      // Sort activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 8));
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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
      case 'visit': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'member_added': return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'review': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'upgrade': return <TrendingUp className="h-4 w-4 text-purple-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMembershipColor = (tier: MembershipTier) => {
    return MembershipCalculator.getTierColor(tier);
  };

  if (loading) {
    return (
      <div className="flex-1 p-6">
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

  const statCards = [
    {
      title: "Total Members",
      value: stats.totalMembers,
      icon: Users,
      description: "Active Circle members",
      color: "text-blue-600"
    },
    {
      title: "Total Hairstylists",
      value: stats.totalHairstylists,
      icon: Users,
      description: "Active staff members",
      color: "text-green-600"
    },
    {
      title: "This Week Visits",
      value: stats.thisWeekVisits,
      icon: Calendar,
      description: "Last 7 days",
      color: "text-purple-600"
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(stats.thisMonthRevenue),
      icon: DollarSign,
      description: "Last 30 days",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="flex-1 p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening at HMS.
        </p>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Member Assignments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest activities and visits
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

            {/* Membership Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Membership Distribution</CardTitle>
                <CardDescription>
                  Member tiers breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.membershipDistribution).map(([tier, count]) => {
                    const tierInfo = MembershipCalculator.getLevelInfo(tier as MembershipTier);
                    const percentage = stats.totalMembers > 0 ? (count / stats.totalMembers) * 100 : 0;
                    
                    return (
                      <div key={tier} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getMembershipColor(tier as MembershipTier)} text-white`}>
                            {tierInfo.name}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {count} members
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Member Assignments Tab */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Member-Hairstylist Assignments</CardTitle>
              <CardDescription>
                Manage which hairstylists are assigned to which members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemberAssignmentPanel />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>
                  Financial performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">This Month</span>
                    <span className="text-lg font-bold">{formatCurrency(stats.thisMonthRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-lg font-bold">{stats.averageRating}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Revenue per Visit</span>
                    <span className="text-lg font-bold">
                      {stats.thisWeekVisits > 0 
                        ? formatCurrency(stats.thisMonthRevenue / (stats.thisWeekVisits * 4))
                        : formatCurrency(0)
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Member Retention</span>
                    <span className="text-lg font-bold text-green-600">94%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Visits per Member</span>
                    <span className="text-lg font-bold">
                      {stats.totalMembers > 0 
                        ? ((stats.thisWeekVisits * 52) / stats.totalMembers).toFixed(1)
                        : '0'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Premium Members</span>
                    <span className="text-lg font-bold text-purple-600">
                      {((stats.membershipDistribution.gold + 
                         stats.membershipDistribution.platinum + 
                         stats.membershipDistribution.diamond) / 
                        Math.max(stats.totalMembers, 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Link 
                  to="/dashboard/members" 
                  className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Users className="h-8 w-8 mb-2 text-blue-600" />
                  <span className="text-sm font-medium">View Members</span>
                  <span className="text-xs text-muted-foreground">{stats.totalMembers} total</span>
                </Link>
                
                <Link 
                  to="/dashboard/members/add" 
                  className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <UserPlus className="h-8 w-8 mb-2 text-green-600" />
                  <span className="text-sm font-medium">Add Member</span>
                  <span className="text-xs text-muted-foreground">Create new</span>
                </Link>
                
                <Link 
                  to="/dashboard/stylists" 
                  className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Users className="h-8 w-8 mb-2 text-purple-600" />
                  <span className="text-sm font-medium">Manage Stylists</span>
                  <span className="text-xs text-muted-foreground">{stats.totalHairstylists} active</span>
                </Link>
                
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center p-4 h-auto"
                  onClick={loadDashboardData}
                >
                  <Activity className="h-8 w-8 mb-2 text-gray-600" />
                  <span className="text-sm font-medium">Refresh Data</span>
                  <span className="text-xs text-muted-foreground">Update stats</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
