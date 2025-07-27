
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Scissors, TrendingUp } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    thisWeekVisits: 0,
    topStylist: "",
    totalServices: 0
  });

  useEffect(() => {
    // Simulate loading stats - in real app, this would fetch from backend
    setStats({
      totalMembers: 247,
      thisWeekVisits: 34,
      topStylist: "Ahmad Rahman",
      totalServices: 12
    });
  }, []);

  const statCards = [
    {
      title: "Total Members",
      value: stats.totalMembers,
      icon: Users,
      description: "Active Circle members",
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
      title: "Top Stylist",
      value: stats.topStylist,
      icon: Scissors,
      description: "Most bookings this month",
      color: "text-purple-600"
    },
    {
      title: "Services Offered",
      value: stats.totalServices,
      icon: TrendingUp,
      description: "Available services",
      color: "text-orange-600"
    }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              <h1 className="text-xl font-semibold">HMS Admin Dashboard</h1>
            </div>
          </header>
          
          <div className="flex-1 p-6 space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground">
                Welcome back! Here's what's happening at HMS.
              </p>
            </div>

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

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest member activities and visits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">John Doe visited today</p>
                        <p className="text-xs text-muted-foreground">Haircut with Ahmad Rahman</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New member added</p>
                        <p className="text-xs text-muted-foreground">Michael Smith joined The Circle</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Service completed</p>
                        <p className="text-xs text-muted-foreground">Beard trim by Sarah Johnson</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks and shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <a href="/members" className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Users className="h-5 w-5 mb-2" />
                      <p className="text-sm font-medium">View Members</p>
                    </a>
                    <a href="/members/add" className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Users className="h-5 w-5 mb-2" />
                      <p className="text-sm font-medium">Add Member</p>
                    </a>
                    <a href="/stylists" className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Scissors className="h-5 w-5 mb-2" />
                      <p className="text-sm font-medium">Manage Stylists</p>
                    </a>
                    <a href="/reports" className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <TrendingUp className="h-5 w-5 mb-2" />
                      <p className="text-sm font-medium">View Reports</p>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
