import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Download, 
  TrendingUp,
  TrendingDown,
  Users,
  Scissors,
  Calendar,
  DollarSign,
  BarChart3,
  Clock,
  Star
} from "lucide-react";

interface MemberVisit {
  id: string;
  memberName: string;
  memberPhone: string;
  memberInstagram: string;
  hairstylist: string;
  service: string;
  visitDate: string;
  duration: number; // minutes
  price: number;
  rating: number;
  notes: string;
  totalVisits: number;
}

interface HairstylistReport {
  id: string;
  name: string;
  avatar: string;
  totalClients: number;
  totalVisits: number;
  totalRevenue: number;
  averageRating: number;
  popularService: string;
  thisMonthVisits: number;
  lastMonthVisits: number;
  growthRate: number;
}

interface ServiceReport {
  serviceName: string;
  totalBookings: number;
  totalRevenue: number;
  averagePrice: number;
  popularityRank: number;
  growth: number;
}

const Reports = () => {
  const [memberVisits, setMemberVisits] = useState<MemberVisit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<MemberVisit[]>([]);
  const [hairstylistReports, setHairstylistReports] = useState<HairstylistReport[]>([]);
  const [serviceReports, setServiceReports] = useState<ServiceReport[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterHairstylist, setFilterHairstylist] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("thisMonth");

  useEffect(() => {
    // Mock data for member visits
    const mockVisits: MemberVisit[] = [
      {
        id: "1",
        memberName: "John Doe",
        memberPhone: "+6281234567890",
        memberInstagram: "@johndoe",
        hairstylist: "Ahmad Rahman",
        service: "Haircut",
        visitDate: "2024-01-20",
        duration: 45,
        price: 150000,
        rating: 5,
        notes: "Regular customer, prefers short sides",
        totalVisits: 12
      },
      {
        id: "2",
        memberName: "Michael Smith",
        memberPhone: "+6281234567891",
        memberInstagram: "@mikesmith",
        hairstylist: "Sarah Johnson",
        service: "Beard Trim",
        visitDate: "2024-01-19",
        duration: 30,
        price: 100000,
        rating: 4,
        notes: "First time customer",
        totalVisits: 1
      },
      {
        id: "3",
        memberName: "David Wilson",
        memberPhone: "+6281234567892",
        memberInstagram: "@davidw",
        hairstylist: "Ahmad Rahman",
        service: "Hair Styling",
        visitDate: "2024-01-18",
        duration: 60,
        price: 200000,
        rating: 5,
        notes: "Wedding preparation",
        totalVisits: 5
      },
      {
        id: "4",
        memberName: "John Doe",
        memberPhone: "+6281234567890",
        memberInstagram: "@johndoe",
        hairstylist: "Ahmad Rahman",
        service: "Haircut",
        visitDate: "2024-01-10",
        duration: 45,
        price: 150000,
        rating: 5,
        notes: "Monthly regular visit",
        totalVisits: 12
      },
      {
        id: "5",
        memberName: "Alex Brown",
        memberPhone: "+6281234567893",
        memberInstagram: "@alexb",
        hairstylist: "Sarah Johnson",
        service: "Hair Coloring",
        visitDate: "2024-01-15",
        duration: 120,
        price: 500000,
        rating: 4,
        notes: "Color change request",
        totalVisits: 3
      }
    ];

    // Mock hairstylist reports
    const mockHairstylistReports: HairstylistReport[] = [
      {
        id: "1",
        name: "Ahmad Rahman",
        avatar: "/api/placeholder/40/40",
        totalClients: 45,
        totalVisits: 89,
        totalRevenue: 13350000,
        averageRating: 4.8,
        popularService: "Haircut",
        thisMonthVisits: 23,
        lastMonthVisits: 18,
        growthRate: 27.8
      },
      {
        id: "2",
        name: "Sarah Johnson",
        avatar: "/api/placeholder/40/40",
        totalClients: 38,
        totalVisits: 72,
        totalRevenue: 18900000,
        averageRating: 4.9,
        popularService: "Hair Coloring",
        thisMonthVisits: 19,
        lastMonthVisits: 22,
        growthRate: -13.6
      },
      {
        id: "3",
        name: "Michael Brown",
        avatar: "/api/placeholder/40/40",
        totalClients: 25,
        totalVisits: 41,
        totalRevenue: 6150000,
        averageRating: 4.6,
        popularService: "Beard Trim",
        thisMonthVisits: 8,
        lastMonthVisits: 12,
        growthRate: -33.3
      }
    ];

    // Mock service reports
    const mockServiceReports: ServiceReport[] = [
      {
        serviceName: "Haircut",
        totalBookings: 156,
        totalRevenue: 23400000,
        averagePrice: 150000,
        popularityRank: 1,
        growth: 15.2
      },
      {
        serviceName: "Hair Coloring",
        totalBookings: 67,
        totalRevenue: 33500000,
        averagePrice: 500000,
        popularityRank: 2,
        growth: 8.7
      },
      {
        serviceName: "Beard Trim",
        totalBookings: 89,
        totalRevenue: 8900000,
        averagePrice: 100000,
        popularityRank: 3,
        growth: -5.3
      },
      {
        serviceName: "Hair Styling",
        totalBookings: 34,
        totalRevenue: 6800000,
        averagePrice: 200000,
        popularityRank: 4,
        growth: 22.1
      }
    ];

    setMemberVisits(mockVisits);
    setFilteredVisits(mockVisits);
    setHairstylistReports(mockHairstylistReports);
    setServiceReports(mockServiceReports);
  }, []);

  useEffect(() => {
    let filtered = memberVisits;

    if (searchTerm) {
      filtered = filtered.filter(visit => 
        visit.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.hairstylist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.service.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterHairstylist !== "all") {
      filtered = filtered.filter(visit => visit.hairstylist === filterHairstylist);
    }

    if (filterService !== "all") {
      filtered = filtered.filter(visit => visit.service === filterService);
    }

    setFilteredVisits(filtered);
  }, [searchTerm, filterHairstylist, filterService, memberVisits]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const exportReport = (type: string) => {
    // Mock export functionality
    const fileName = `HMS_${type}_Report_${new Date().toISOString().split('T')[0]}.csv`;
    console.log(`Exporting ${fileName}`);
  };

  const allHairstylists = [...new Set(memberVisits.map(v => v.hairstylist))];
  const allServices = [...new Set(memberVisits.map(v => v.service))];

  // Calculate overview statistics
  const totalRevenue = memberVisits.reduce((sum, visit) => sum + visit.price, 0);
  const totalVisits = memberVisits.length;
  const averageServicePrice = totalRevenue / totalVisits;
  const uniqueMembers = new Set(memberVisits.map(v => v.memberName)).size;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive reports on members, hairstylists, and business performance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisits}</div>
            <p className="text-xs text-muted-foreground">
              +8.2% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueMembers}</div>
            <p className="text-xs text-muted-foreground">
              +5.1% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Service Price</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageServicePrice)}</div>
            <p className="text-xs text-muted-foreground">
              +3.7% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="member-activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="member-activity">Member Activity</TabsTrigger>
          <TabsTrigger value="hairstylist-performance">Hairstylist Performance</TabsTrigger>
          <TabsTrigger value="service-analytics">Service Analytics</TabsTrigger>
        </TabsList>

        {/* Member Activity Tab */}
        <TabsContent value="member-activity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Member Visit History</CardTitle>
                  <CardDescription>
                    Track member visits, services, and hairstylist assignments
                  </CardDescription>
                </div>
                <Button onClick={() => exportReport('member_activity')} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members, hairstylists, or services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterHairstylist} onValueChange={setFilterHairstylist}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by hairstylist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hairstylists</SelectItem>
                    {allHairstylists.map(hairstylist => (
                      <SelectItem key={hairstylist} value={hairstylist}>{hairstylist}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterService} onValueChange={setFilterService}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {allServices.map(service => (
                      <SelectItem key={service} value={service}>{service}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Hairstylist</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Visit Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Total Visits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{visit.memberName}</div>
                            <div className="text-sm text-muted-foreground">{visit.memberPhone}</div>
                            <div className="text-sm text-muted-foreground">{visit.memberInstagram}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{visit.hairstylist}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{visit.service}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(visit.visitDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {visit.duration}m
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(visit.price)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{visit.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{visit.totalVisits} visits</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hairstylist Performance Tab */}
        <TabsContent value="hairstylist-performance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Hairstylist Performance Report</CardTitle>
                  <CardDescription>
                    Analyze hairstylist productivity, revenue, and customer satisfaction
                  </CardDescription>
                </div>
                <Button onClick={() => exportReport('hairstylist_performance')} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hairstylist</TableHead>
                      <TableHead>Total Clients</TableHead>
                      <TableHead>Total Visits</TableHead>
                      <TableHead>Revenue Generated</TableHead>
                      <TableHead>Avg. Rating</TableHead>
                      <TableHead>Popular Service</TableHead>
                      <TableHead>Monthly Growth</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hairstylistReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={report.avatar} />
                              <AvatarFallback>{report.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{report.name}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{report.totalClients}</TableCell>
                        <TableCell>{report.totalVisits}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(report.totalRevenue)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{report.averageRating}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{report.popularService}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 ${report.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {report.growthRate >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            <span className="font-medium">{Math.abs(report.growthRate)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Analytics Tab */}
        <TabsContent value="service-analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Service Analytics Report</CardTitle>
                  <CardDescription>
                    Popular services, revenue contribution, and growth trends
                  </CardDescription>
                </div>
                <Button onClick={() => exportReport('service_analytics')} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Total Bookings</TableHead>
                      <TableHead>Total Revenue</TableHead>
                      <TableHead>Average Price</TableHead>
                      <TableHead>Popularity Rank</TableHead>
                      <TableHead>Growth Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceReports.map((service) => (
                      <TableRow key={service.serviceName}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Scissors className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{service.serviceName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{service.totalBookings}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(service.totalRevenue)}</TableCell>
                        <TableCell>{formatCurrency(service.averagePrice)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">#{service.popularityRank}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 ${service.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {service.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            <span className="font-medium">{Math.abs(service.growth)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;