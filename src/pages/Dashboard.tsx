
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, TrendingUp, UserPlus, DollarSign, Star, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from '../hooks/use-auth';
import { memberHelpers, hairstylistHelpers, visitHelpers } from '../lib/supabase-helpers';
import { MembershipCalculator } from '../lib/membership-calculator';
import MemberAssignmentPanel from '../components/MemberAssignmentPanel';
import { Member, Hairstylist, Visit, MembershipTier, UserProfile } from '../types';
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
  const [members, setMembers] = useState<(Member & { user_profile: UserProfile })[]>([]);
  const [hairstylists, setHairstylists] = useState<(Hairstylist & { user_profile: UserProfile })[]>([]);
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
          const joinDate = new Date(member.join_date);
          return joinDate >= weekAgo;
        })
        .slice(0, 3)
        .forEach(member => {
          activities.push({
            id: `member-${member.id}`,
            type: 'member_added',
            description: `${member.user_profile?.full_name} joined The Circle`,
            timestamp: member.join_date,
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
      default: return <Calendar className="h-4 w-4 text-gray-500" />;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening at your salon.
          </p>
        </div>
        <Button 
          onClick={loadDashboardData}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Activity className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <card.icon className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <p className="text-sm text-gray-500 mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity - Takes 2/3 width */}
        <div className="lg:col-span-2">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
                  <CardDescription className="text-gray-600">
                    Latest visits and member activities
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  {recentActivity.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 py-2">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Membership Distribution - Takes 1/3 width */}
        <div className="lg:col-span-1">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-900">Membership Tiers</CardTitle>
              <CardDescription className="text-gray-600">
                Distribution across tiers
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {Object.entries(stats.membershipDistribution).map(([tier, count]) => {
                  const tierInfo = MembershipCalculator.getLevelInfo(tier as MembershipTier);
                  const percentage = stats.totalMembers > 0 ? (count / stats.totalMembers) * 100 : 0;
                  
                  return (
                    <div key={tier} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getMembershipColor(tier as MembershipTier)}`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">{tier}</p>
                          <p className="text-xs text-gray-500">{count} members</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Overview */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900">Revenue Overview</CardTitle>
            <CardDescription className="text-gray-600">
              Financial performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Monthly Revenue</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(stats.thisMonthRevenue)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Average Rating</span>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-lg font-bold text-gray-900">{stats.averageRating}</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Avg Revenue per Visit</span>
                <span className="text-lg font-bold text-gray-900">
                  {stats.thisWeekVisits > 0 
                    ? formatCurrency(stats.thisMonthRevenue / (stats.thisWeekVisits * 4))
                    : formatCurrency(0)
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
            <CardDescription className="text-gray-600">
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <Link 
                to="/dashboard/members" 
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">View Members</span>
                <span className="text-xs text-gray-500 mt-1">{stats.totalMembers} total</span>
              </Link>
              
              <Link 
                to="/dashboard/members/add" 
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                  <UserPlus className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Add Member</span>
                <span className="text-xs text-gray-500 mt-1">Create new</span>
              </Link>
              
              <Link 
                to="/dashboard/stylists" 
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Manage Stylists</span>
                <span className="text-xs text-gray-500 mt-1">{stats.totalHairstylists} active</span>
              </Link>

              <div 
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
                onClick={() => setActiveTab('assignments')}
              >
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Assignments</span>
                <span className="text-xs text-gray-500 mt-1">Manage pairs</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Assignment Panel - Hidden by default, shows when needed */}
      {activeTab === 'assignments' && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Member-Hairstylist Assignments</CardTitle>
                <CardDescription className="text-gray-600">
                  Manage which hairstylists are assigned to which members
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setActiveTab('overview')}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <MemberAssignmentPanel />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
