import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Plus, 
  Edit, 
  Key, 
  UserCheck, 
  UserX, 
  Star,
  Users,
  Calendar,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Hairstylist {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  specialties: string[];
  experience: number; // years
  joinDate: string;
  address: string;
  status: "active" | "inactive";
  avatar: string;
  totalClients: number;
  monthlyClients: number;
  rating: number;
  bio: string;
}

const Hairstylists = () => {
  const { toast } = useToast();
  const [hairstylists, setHairstylists] = useState<Hairstylist[]>([]);
  const [filteredHairstylists, setFilteredHairstylists] = useState<Hairstylist[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSpecialty, setFilterSpecialty] = useState("all");
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedHairstylist, setSelectedHairstylist] = useState<Hairstylist | null>(null);
  
  // Form states
  const [newHairstylist, setNewHairstylist] = useState({
    fullName: "",
    email: "",
    phone: "",
    specialties: "",
    experience: 0,
    address: "",
    bio: ""
  });

  const [editHairstylist, setEditHairstylist] = useState({
    fullName: "",
    email: "",
    phone: "",
    specialties: "",
    experience: 0,
    address: "",
    bio: ""
  });

  useEffect(() => {
    // Simulate loading stylists data
    const mockHairstylists: Hairstylist[] = [
      {
        id: "1",
        fullName: "Ahmad Rahman",
        email: "ahmad.rahman@hms.com",
        phone: "+6281234567890",
        specialties: ["Haircut", "Beard Trim", "Hair Styling"],
        experience: 5,
        joinDate: "2019-03-15",
        address: "Jakarta Selatan",
        status: "active",
        avatar: "/api/placeholder/40/40",
        totalClients: 156,
        monthlyClients: 23,
        rating: 4.8,
        bio: "Experienced hairstylist specializing in modern cuts and beard styling."
      },
      {
        id: "2",
        fullName: "Sarah Johnson",
        email: "sarah.johnson@hms.com",
        phone: "+6281234567891",
        specialties: ["Hair Coloring", "Perming", "Hair Treatment"],
        experience: 8,
        joinDate: "2016-07-22",
        address: "Jakarta Pusat",
        status: "active",
        avatar: "/api/placeholder/40/40",
        totalClients: 203,
        monthlyClients: 31,
        rating: 4.9,
        bio: "Color specialist with expertise in advanced coloring techniques."
      },
      {
        id: "3",
        fullName: "Michael Brown",
        email: "michael.brown@hms.com",
        phone: "+6281234567892",
        specialties: ["Haircut", "Hair Wash", "Scalp Treatment"],
        experience: 3,
        joinDate: "2021-11-10",
        address: "Jakarta Barat",
        status: "inactive",
        avatar: "/api/placeholder/40/40",
        totalClients: 89,
        monthlyClients: 0,
        rating: 4.5,
        bio: "Junior stylist focusing on precision cuts and scalp health."
      }
    ];
    setHairstylists(mockHairstylists);
    setFilteredHairstylists(mockHairstylists);
  }, []);

  useEffect(() => {
    let filtered = hairstylists;

    if (searchTerm) {
      filtered = filtered.filter(hairstylist => 
        hairstylist.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hairstylist.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hairstylist.specialties.some(specialty => specialty.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(hairstylist => hairstylist.status === filterStatus);
    }

    if (filterSpecialty !== "all") {
      filtered = filtered.filter(hairstylist => hairstylist.specialties.includes(filterSpecialty));
    }

    setFilteredHairstylists(filtered);
  }, [searchTerm, filterStatus, filterSpecialty, hairstylists]);

  const handleAddHairstylist = () => {
    const hairstylistData: Hairstylist = {
      id: Date.now().toString(),
      ...newHairstylist,
      specialties: newHairstylist.specialties.split(",").map(s => s.trim()),
      joinDate: new Date().toISOString().split('T')[0],
      status: "active",
      avatar: "/api/placeholder/40/40",
      totalClients: 0,
      monthlyClients: 0,
      rating: 0
    };

    setHairstylists(prev => [...prev, hairstylistData]);
    setIsAddDialogOpen(false);
    setNewHairstylist({
      fullName: "",
      email: "",
      phone: "",
      specialties: "",
      experience: 0,
      address: "",
      bio: ""
    });

    toast({
      title: "Hairstylist Added",
      description: `${newHairstylist.fullName} has been added successfully.`,
    });
  };

  const handleEditHairstylist = () => {
    if (!selectedHairstylist) return;
    
    const updatedHairstylist: Hairstylist = {
      ...selectedHairstylist,
      ...editHairstylist,
      specialties: editHairstylist.specialties.split(",").map(s => s.trim())
    };

    setHairstylists(prev => prev.map(h => 
      h.id === selectedHairstylist.id ? updatedHairstylist : h
    ));
    
    setIsEditDialogOpen(false);
    setSelectedHairstylist(null);
    
    toast({
      title: "Hairstylist Updated",
      description: `${editHairstylist.fullName} has been updated successfully.`,
    });
  };

  const openEditDialog = (hairstylist: Hairstylist) => {
    setSelectedHairstylist(hairstylist);
    setEditHairstylist({
      fullName: hairstylist.fullName,
      email: hairstylist.email,
      phone: hairstylist.phone,
      specialties: hairstylist.specialties.join(", "),
      experience: hairstylist.experience,
      address: hairstylist.address,
      bio: hairstylist.bio
    });
    setIsEditDialogOpen(true);
  };

  const handleToggleStatus = (hairstylistId: string) => {
    setHairstylists(prev => prev.map(hairstylist => 
      hairstylist.id === hairstylistId 
        ? { ...hairstylist, status: hairstylist.status === "active" ? "inactive" : "active" }
        : hairstylist
    ));
    
    const hairstylist = hairstylists.find(s => s.id === hairstylistId);
    toast({
      title: "Status Updated",
      description: `${hairstylist?.fullName} has been ${hairstylist?.status === "active" ? "deactivated" : "activated"}.`,
    });
  };

  const handleResetPassword = (hairstylistId: string) => {
    const hairstylist = hairstylists.find(s => s.id === hairstylistId);
    toast({
      title: "Password Reset",
      description: `Password reset link sent to ${hairstylist?.email}`,
    });
    setIsResetPasswordDialogOpen(false);
  };

  const allSpecialties = [...new Set(hairstylists.flatMap(s => s.specialties))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hairstylists Management</h2>
          <p className="text-muted-foreground">
            Manage HMS hairstylists and their information
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Hairstylist
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hairstylists</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hairstylists.length}</div>
            <p className="text-xs text-muted-foreground">
              {hairstylists.filter(s => s.status === "active").length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hairstylists.reduce((sum, s) => sum + s.totalClients, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              All time clients served
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hairstylists.reduce((sum, s) => sum + s.monthlyClients, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Clients this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hairstylists.length > 0 ? (hairstylists.reduce((sum, s) => sum + s.rating, 0) / hairstylists.length).toFixed(1) : '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall rating
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hairstylists Database</CardTitle>
          <CardDescription>
            {filteredHairstylists.length} of {hairstylists.length} hairstylists
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hairstylists, email, or specialties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {allSpecialties.map(specialty => (
                  <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hairstylist</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Specialties</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Clients</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHairstylists.map((hairstylist) => (
                  <TableRow key={hairstylist.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={hairstylist.avatar} />
                          <AvatarFallback>{hairstylist.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{hairstylist.fullName}</div>
                          <div className="text-sm text-muted-foreground">{hairstylist.experience} years experience</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {hairstylist.email}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {hairstylist.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {hairstylist.specialties.slice(0, 2).map(specialty => (
                          <Badge key={specialty} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {hairstylist.specialties.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{hairstylist.specialties.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{hairstylist.experience} years</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{hairstylist.totalClients} total</div>
                        <div className="text-muted-foreground">{hairstylist.monthlyClients} this month</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{hairstylist.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={hairstylist.status === "active" ? "default" : "secondary"}>
                        {hairstylist.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditDialog(hairstylist)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedHairstylist(hairstylist);
                            setIsResetPasswordDialogOpen(true);
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleStatus(hairstylist.id)}
                        >
                          {hairstylist.status === "active" ? (
                            <UserX className="h-4 w-4 text-red-500" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-500" />
                          )}
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

      {/* Add Stylist Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Hairstylist</DialogTitle>
            <DialogDescription>
              Create a new hairstylist account for HMS.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={newHairstylist.fullName}
                  onChange={(e) => setNewHairstylist(prev => ({...prev, fullName: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="hairstylist@hms.com"
                  value={newHairstylist.email}
                  onChange={(e) => setNewHairstylist(prev => ({...prev, email: e.target.value}))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+6281234567890"
                  value={newHairstylist.phone}
                  onChange={(e) => setNewHairstylist(prev => ({...prev, phone: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experience (years)</Label>
                <Input
                  id="experience"
                  type="number"
                  placeholder="0"
                  value={newHairstylist.experience}
                  onChange={(e) => setNewHairstylist(prev => ({...prev, experience: parseInt(e.target.value) || 0}))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties (comma separated)</Label>
              <Input
                id="specialties"
                placeholder="Haircut, Beard Trim, Hair Styling"
                value={newHairstylist.specialties}
                onChange={(e) => setNewHairstylist(prev => ({...prev, specialties: e.target.value}))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter address"
                value={newHairstylist.address}
                onChange={(e) => setNewHairstylist(prev => ({...prev, address: e.target.value}))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Enter hairstylist bio and specialties..."
                value={newHairstylist.bio}
                onChange={(e) => setNewHairstylist(prev => ({...prev, bio: e.target.value}))}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddHairstylist}>
              Add Hairstylist
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Hairstylist Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Hairstylist</DialogTitle>
            <DialogDescription>
              Update hairstylist information for {selectedHairstylist?.fullName}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter full name"
                  value={editHairstylist.fullName}
                  onChange={(e) => setEditHairstylist(prev => ({...prev, fullName: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="hairstylist@hms.com"
                  value={editHairstylist.email}
                  onChange={(e) => setEditHairstylist(prev => ({...prev, email: e.target.value}))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  placeholder="+6281234567890"
                  value={editHairstylist.phone}
                  onChange={(e) => setEditHairstylist(prev => ({...prev, phone: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-experience">Experience (years)</Label>
                <Input
                  id="edit-experience"
                  type="number"
                  placeholder="0"
                  value={editHairstylist.experience}
                  onChange={(e) => setEditHairstylist(prev => ({...prev, experience: parseInt(e.target.value) || 0}))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-specialties">Specialties (comma separated)</Label>
              <Input
                id="edit-specialties"
                placeholder="Haircut, Beard Trim, Hair Styling"
                value={editHairstylist.specialties}
                onChange={(e) => setEditHairstylist(prev => ({...prev, specialties: e.target.value}))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                placeholder="Enter address"
                value={editHairstylist.address}
                onChange={(e) => setEditHairstylist(prev => ({...prev, address: e.target.value}))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                placeholder="Enter hairstylist bio and specialties..."
                value={editHairstylist.bio}
                onChange={(e) => setEditHairstylist(prev => ({...prev, bio: e.target.value}))}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditHairstylist}>
              Update Hairstylist
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Send password reset link to {selectedHairstylist?.fullName}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              A password reset link will be sent to: <strong>{selectedHairstylist?.email}</strong>
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleResetPassword(selectedHairstylist?.id || "")}>
              Send Reset Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Hairstylists;