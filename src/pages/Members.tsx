
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Plus, Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";

interface Member {
  id: string;
  fullName: string;
  whatsapp: string;
  instagram: string;
  lastVisit: string;
  stylist: string;
  service: string;
  stylistComment: string;
  memberComment: string;
  status: "active" | "inactive";
}

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStylist, setFilterStylist] = useState("all");
  const [filterService, setFilterService] = useState("all");

  useEffect(() => {
    // Simulate loading members - in real app, this would fetch from backend
    const mockMembers: Member[] = [
      {
        id: "1",
        fullName: "John Doe",
        whatsapp: "+6281234567890",
        instagram: "@johndoe",
        lastVisit: "2024-01-15",
        stylist: "Ahmad Rahman",
        service: "Haircut",
        stylistComment: "Prefers short sides, longer on top",
        memberComment: "Great service as always!",
        status: "active"
      },
      {
        id: "2",
        fullName: "Michael Smith",
        whatsapp: "+6281234567891",
        instagram: "@mikesmith",
        lastVisit: "2024-01-14",
        stylist: "Sarah Johnson",
        service: "Beard Trim",
        stylistComment: "Likes natural beard shape",
        memberComment: "Very satisfied with the result",
        status: "active"
      },
      {
        id: "3",
        fullName: "David Wilson",
        whatsapp: "+6281234567892",
        instagram: "@davidw",
        lastVisit: "2024-01-13",
        stylist: "Ahmad Rahman",
        service: "Hair Wash",
        stylistComment: "Sensitive scalp, use gentle products",
        memberComment: "Relaxing experience",
        status: "active"
      }
    ];
    setMembers(mockMembers);
    setFilteredMembers(mockMembers);
  }, []);

  useEffect(() => {
    let filtered = members;

    if (searchTerm) {
      filtered = filtered.filter(member => 
        member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.stylist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.service.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStylist !== "all") {
      filtered = filtered.filter(member => member.stylist === filterStylist);
    }

    if (filterService !== "all") {
      filtered = filtered.filter(member => member.service === filterService);
    }

    setFilteredMembers(filtered);
  }, [searchTerm, filterStylist, filterService, members]);

  const handleExport = () => {
    // Simulate export functionality
    const csvContent = [
      "Full Name,WhatsApp,Instagram,Last Visit,Stylist,Service,Stylist Comment,Member Comment",
      ...filteredMembers.map(member => 
        `${member.fullName},${member.whatsapp},${member.instagram},${member.lastVisit},${member.stylist},${member.service},"${member.stylistComment}","${member.memberComment}"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hms_members.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stylists = [...new Set(members.map(m => m.stylist))];
  const services = [...new Set(members.map(m => m.service))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Members</h2>
          <p className="text-muted-foreground">
            Manage The Circle members and their information
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link to="/dashboard/members/add">
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Link>
          </Button>
        </div>
      </div>

            <Card>
              <CardHeader>
                <CardTitle>Member Database</CardTitle>
                <CardDescription>
                  {filteredMembers.length} of {members.length} members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members, stylists, or services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterStylist} onValueChange={setFilterStylist}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by stylist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stylists</SelectItem>
                      {stylists.map(stylist => (
                        <SelectItem key={stylist} value={stylist}>{stylist}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterService} onValueChange={setFilterService}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      {services.map(service => (
                        <SelectItem key={service} value={service}>{service}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Last Visit</TableHead>
                        <TableHead>Stylist</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.fullName}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{member.whatsapp}</div>
                              <div className="text-muted-foreground">{member.instagram}</div>
                            </div>
                          </TableCell>
                          <TableCell>{member.lastVisit}</TableCell>
                          <TableCell>{member.stylist}</TableCell>
                          <TableCell>{member.service}</TableCell>
                          <TableCell>
                            <Badge variant={member.status === "active" ? "default" : "secondary"}>
                              {member.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
    </div>
  );
};

export default Members;
