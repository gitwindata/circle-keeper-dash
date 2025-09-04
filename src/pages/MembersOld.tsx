
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
import { memberHelpers } from "../lib/supabase-helpers";
import { Member, UserProfile } from "../types";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Filter, Download, Plus, Edit, Trash2, UserPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { memberHelpers, hairstylistHelpers } from "@/lib/supabase-helpers";
import { Member as MemberType, Hairstylist } from "@/types";

interface MemberFormData {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  whatsapp_number: string;
  instagram_handle: string;
  notes: string;
}

const Members = () => {
  const [members, setMembers] = useState<MemberType[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberType[]>([]);
  const [hairstylists, setHairstylists] = useState<Hairstylist[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStylist, setFilterStylist] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberType | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<MemberFormData>({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    whatsapp_number: "",
    instagram_handle: "",
    notes: ""
  });

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      password: "",
      phone: "",
      whatsapp_number: "",
      instagram_handle: "",
      notes: ""
    });
  };

  const handleInputChange = (field: keyof MemberFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const loadMembers = async () => {
    try {
      setLoading(true);
      const membersData = await memberHelpers.getAllMembersWithProfiles();
      setMembers(membersData);
      setFilteredMembers(membersData);
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const loadHairstylists = async () => {
    try {
      const hairstylistsData = await hairstylistHelpers.getAllHairstylistsWithProfiles();
      setHairstylists(hairstylistsData);
    } catch (error) {
      console.error('Error loading hairstylists:', error);
      toast.error('Failed to load hairstylists');
    }
  };

    const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await memberHelpers.createMemberWithAuth({
        email: formData.email,
        password: formData.password || `temp${Math.random().toString(36).slice(-8)}`,
        full_name: formData.full_name,
        phone: formData.phone,
        whatsapp_number: formData.whatsapp_number,
        instagram_handle: formData.instagram_handle,
        notes: formData.notes
      });
      
      setMembers(prev => [result.member, ...prev]);
      toast.success(`${formData.full_name} has been added to The Circle successfully.`);
      resetForm();
      setShowAddDialog(false);
    } catch (error: unknown) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member. Please try again.');
    }
  };

    const handleEditMember = (member: Member & { user_profile: UserProfile }) => {
    setEditingMember(member);
    setFormData({
      full_name: member.user_profile.full_name,
      email: member.user_profile.email,
      password: "", // Don't prefill password for security
      phone: member.user_profile.phone || "",
      whatsapp_number: member.user_profile.whatsapp_number || "",
      instagram_handle: member.user_profile.instagram_handle || "",
      notes: member.notes || ""
    });
    setShowAddDialog(true);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMember) return;
    
    try {
      await memberHelpers.updateMember(editingMember.id, {
        full_name: formData.full_name,
        phone: formData.phone,
        whatsapp_number: formData.whatsapp_number,
        instagram_handle: formData.instagram_handle,
        notes: formData.notes,
        preferred_services: formData.preferred_services
      });

      toast.success(`${formData.full_name} has been updated successfully.`);
      resetForm();
      setEditingMember(null);
      setShowAddDialog(false);
      await loadMembers(); // Reload members list
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('Failed to update member');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member && confirm(`Are you sure you want to delete ${member.user_profile?.full_name}?`)) {
      try {
        await memberHelpers.deleteMember(memberId);
        toast.success(`${member.user_profile?.full_name} has been removed from The Circle.`);
        await loadMembers(); // Reload members list
      } catch (error) {
        console.error('Error deleting member:', error);
        toast.error('Failed to delete member');
      }
    }
  };

  const handleDialogClose = () => {
    setShowAddDialog(false);
    setEditingMember(null);
    resetForm();
  };

  useEffect(() => {
    loadMembers();
    loadHairstylists();
  }, []);

  useEffect(() => {
    let filtered = members;

    if (searchTerm) {
      filtered = filtered.filter(member => 
        member.user_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.user_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.preferred_services.some(service => 
          service.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (filterStylist !== "all") {
      // For now, we'll skip stylist filtering until we have assignment data
      // TODO: Implement hairstylist assignment filtering
    }

    if (filterService !== "all") {
      filtered = filtered.filter(member => 
        member.preferred_services.includes(filterService)
      );
    }

    setFilteredMembers(filtered);
  }, [searchTerm, filterStylist, filterService, members]);

  const uniqueServices = [...new Set(members.flatMap(m => m.preferred_services))];

  const handleExport = () => {
    const csvContent = [
      "Full Name,Email,Phone,WhatsApp,Instagram,Join Date,Total Visits,Total Spent,Membership Tier",
      ...filteredMembers.map(member => 
        `${member.user_profile?.full_name},${member.user_profile?.email},${member.user_profile?.phone},${member.user_profile?.whatsapp_number},${member.user_profile?.instagram_handle},${member.join_date},${member.total_visits},${member.total_spent},${member.membership_tier}`
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
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      placeholder="Enter full name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange("full_name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="member@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      disabled={!!editingMember} // Cannot change email when editing
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+62812345678"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                    <Input
                      id="whatsapp_number"
                      placeholder="+6281234567890"
                      value={formData.whatsapp_number}
                      onChange={(e) => handleInputChange("whatsapp_number", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram_handle">Instagram Handle</Label>
                  <Input
                    id="instagram_handle"
                    placeholder="@username"
                    value={formData.instagram_handle}
                    onChange={(e) => handleInputChange("instagram_handle", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Internal notes about member preferences..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
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
                      {hairstylists.map(stylist => (
                        <SelectItem key={stylist.id} value={stylist.user_profile?.full_name || ''}>
                          {stylist.user_profile?.full_name}
                        </SelectItem>
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
                        <TableHead>Join Date</TableHead>
                        <TableHead>Total Visits</TableHead>
                        <TableHead>Membership</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">
                            Loading members...
                          </TableCell>
                        </TableRow>
                      ) : filteredMembers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No members found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMembers.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">
                              {member.user_profile?.full_name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{member.user_profile?.whatsapp_number || member.user_profile?.phone || 'No phone'}</div>
                                <div className="text-muted-foreground">{member.user_profile?.instagram_handle || 'No Instagram'}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {member.join_date ? new Date(member.join_date).toLocaleDateString() : 'Unknown'}
                            </TableCell>
                            <TableCell>{member.total_visits || 0} visits</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {member.membership_tier || 'bronze'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={member.user_profile?.is_active ? "default" : "secondary"}>
                                {member.user_profile?.is_active ? 'active' : 'inactive'}
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
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
    </div>
  );
};

export default Members;
