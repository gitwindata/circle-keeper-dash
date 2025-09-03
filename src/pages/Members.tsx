
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Filter, Download, Plus, Edit, Trash2, UserPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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

interface MemberFormData {
  fullName: string;
  whatsapp: string;
  instagram: string;
  lastVisit: string;
  stylist: string;
  service: string;
  stylistComment: string;
  memberComment: string;
}

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStylist, setFilterStylist] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<MemberFormData>({
    fullName: "",
    whatsapp: "",
    instagram: "",
    lastVisit: "",
    stylist: "",
    service: "",
    stylistComment: "",
    memberComment: ""
  });


  const resetForm = () => {
    setFormData({
      fullName: "",
      whatsapp: "",
      instagram: "",
      lastVisit: "",
      stylist: "",
      service: "",
      stylistComment: "",
      memberComment: ""
    });
  };

  const handleInputChange = (field: keyof MemberFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newMember: Member = {
      id: Date.now().toString(),
      ...formData,
      status: "active"
    };
    
    setMembers(prev => [...prev, newMember]);
    toast.success(`${formData.fullName} has been added to The Circle successfully.`);
    resetForm();
    setShowAddDialog(false);
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setFormData({
      fullName: member.fullName,
      whatsapp: member.whatsapp,
      instagram: member.instagram,
      lastVisit: member.lastVisit,
      stylist: member.stylist,
      service: member.service,
      stylistComment: member.stylistComment,
      memberComment: member.memberComment
    });
    setShowAddDialog(true);
  };

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMember) return;
    
    const updatedMember: Member = {
      ...editingMember,
      ...formData
    };
    
    setMembers(prev => prev.map(m => m.id === editingMember.id ? updatedMember : m));
    toast.success(`${formData.fullName} has been updated successfully.`);
    resetForm();
    setEditingMember(null);
    setShowAddDialog(false);
  };

  const handleDeleteMember = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member && confirm(`Are you sure you want to delete ${member.fullName}?`)) {
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success(`${member.fullName} has been removed from The Circle.`);
    }
  };

  const handleDialogClose = () => {
    setShowAddDialog(false);
    setEditingMember(null);
    resetForm();
  };

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

  const uniqueStylists = [...new Set(members.map(m => m.stylist))];
  const uniqueServices = [...new Set(members.map(m => m.service))];

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
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingMember(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? 'Edit Member' : 'Add New Member'}
                </DialogTitle>
                <DialogDescription>
                  {editingMember ? 'Update member information' : 'Add a new member to The Circle'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={editingMember ? handleUpdateMember : handleAddMember} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter full name"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                    <Input
                      id="whatsapp"
                      placeholder="+6281234567890"
                      value={formData.whatsapp}
                      onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram Handle</Label>
                    <Input
                      id="instagram"
                      placeholder="@username"
                      value={formData.instagram}
                      onChange={(e) => handleInputChange("instagram", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastVisit">Last Visit Date</Label>
                    <Input
                      id="lastVisit"
                      type="date"
                      value={formData.lastVisit}
                      onChange={(e) => handleInputChange("lastVisit", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stylist">Hairstylist</Label>
                    <Select value={formData.stylist} onValueChange={(value) => handleInputChange("stylist", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stylist" />
                      </SelectTrigger>
                      <SelectContent>
                        {stylists.map(stylist => (
                          <SelectItem key={stylist} value={stylist}>{stylist}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service">Service Received</Label>
                    <Select value={formData.service} onValueChange={(value) => handleInputChange("service", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(service => (
                          <SelectItem key={service} value={service}>{service}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stylistComment">Stylist Comment</Label>
                  <Textarea
                    id="stylistComment"
                    placeholder="Internal notes about client preferences..."
                    value={formData.stylistComment}
                    onChange={(e) => handleInputChange("stylistComment", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memberComment">Member Comment</Label>
                  <Textarea
                    id="memberComment"
                    placeholder="Member feedback or comments..."
                    value={formData.memberComment}
                    onChange={(e) => handleInputChange("memberComment", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1">
                    {editingMember ? 'Update Member' : 'Add Member'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
                      {uniqueStylists.map(stylist => (
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
                      {uniqueServices.map(service => (
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
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditMember(member)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteMember(member.id)}
                              >
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
