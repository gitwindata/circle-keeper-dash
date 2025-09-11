import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  MapPin,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { hairstylistHelpers } from "@/lib/supabase-helpers";
import { handleSupabaseError } from "@/lib/supabase-helpers";
import { supabase } from "@/lib/supabase";
import type { Hairstylist, UserProfile } from "@/types";

// Extended hairstylist type for UI purposes
interface HairstylistWithProfile extends Hairstylist {
  user_profile: UserProfile;
}

const Hairstylists = () => {
  const { toast } = useToast();
  const [hairstylists, setHairstylists] = useState<HairstylistWithProfile[]>(
    []
  );
  const [filteredHairstylists, setFilteredHairstylists] = useState<
    HairstylistWithProfile[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSpecialty, setFilterSpecialty] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] =
    useState(false);
  const [selectedHairstylist, setSelectedHairstylist] =
    useState<HairstylistWithProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [newHairstylist, setNewHairstylist] = useState({
    full_name: "",
    email: "",
    phone: "",
    cabang: "",
    specialties: "",
    experience_years: 0,
    bio: "",
  });

  const [editHairstylist, setEditHairstylist] = useState({
    full_name: "",
    email: "",
    phone: "",
    cabang: "",
    specialties: "",
    experience_years: 0,
    bio: "",
  });

  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
    resetMethod: "email" as "email" | "direct",
  });

  // Load hairstylists data
  const loadHairstylists = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading hairstylists data...');
      const data = await hairstylistHelpers.getAllHairstylistsWithProfiles();
      console.log('📊 Hairstylists data received:', data);
      setHairstylists(data);
      setFilteredHairstylists(data);
    } catch (error) {
      console.error("❌ Error loading hairstylists:", error);
      toast({
        title: "Error",
        description: handleSupabaseError(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHairstylists();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let filtered = hairstylists;

    if (searchTerm) {
      filtered = filtered.filter(
        (hairstylist) =>
          hairstylist.user_profile.full_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          hairstylist.user_profile.email
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          hairstylist.specialties.some((specialty) =>
            specialty.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((hairstylist) =>
        filterStatus === "active"
          ? hairstylist.user_profile.is_active
          : !hairstylist.user_profile.is_active
      );
    }

    if (filterSpecialty !== "all") {
      filtered = filtered.filter((hairstylist) =>
        hairstylist.specialties.includes(filterSpecialty)
      );
    }

    setFilteredHairstylists(filtered);
  }, [searchTerm, filterStatus, filterSpecialty, hairstylists]);

  const handleAddHairstylist = async () => {
    if (
      !newHairstylist.full_name ||
      !newHairstylist.email ||
      !newHairstylist.phone
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const specialtiesArray = newHairstylist.specialties
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await hairstylistHelpers.createHairstylistWithAuth({
        email: newHairstylist.email,
        full_name: newHairstylist.full_name,
        phone: newHairstylist.phone,
        cabang: newHairstylist.cabang,
        specialties: specialtiesArray,
        experience_years: newHairstylist.experience_years,
        schedule_notes: newHairstylist.bio,
        status: "active",
      });

      setIsAddDialogOpen(false);
      setNewHairstylist({
        full_name: "",
        email: "",
        phone: "",
        cabang: "",
        specialties: "",
        experience_years: 0,
        bio: "",
      });

      toast({
        title: "Success",
        description: `${newHairstylist.full_name} has been added successfully.`,
      });

      // Reload data
      await loadHairstylists();
    } catch (error) {
      console.error("Error adding hairstylist:", error);
      toast({
        title: "Error",
        description: handleSupabaseError(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditHairstylist = async () => {
    if (
      !selectedHairstylist ||
      !editHairstylist.full_name ||
      !editHairstylist.email ||
      !editHairstylist.phone
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editHairstylist.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Show warning if email is being changed
    const isEmailChanged = editHairstylist.email !== selectedHairstylist.user_profile.email;
    if (isEmailChanged) {
      const confirmEmailChange = confirm(
        `⚠️ WARNING: Changing the email from "${selectedHairstylist.user_profile.email}" to "${editHairstylist.email}" will affect the hairstylist's login credentials.\n\nThe hairstylist will need to use the new email address to log in.\n\nDo you want to proceed with this change?`
      );
      
      if (!confirmEmailChange) {
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const specialtiesArray = editHairstylist.specialties
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await hairstylistHelpers.updateHairstylist(selectedHairstylist.id, {
        full_name: editHairstylist.full_name,
        email: editHairstylist.email,
        phone: editHairstylist.phone,
        cabang: editHairstylist.cabang,
        specialties: specialtiesArray,
        experience_years: editHairstylist.experience_years,
        schedule_notes: editHairstylist.bio,
      });

      setIsEditDialogOpen(false);
      setSelectedHairstylist(null);

      toast({
        title: "Success",
        description: `${editHairstylist.full_name} has been updated successfully.${isEmailChanged ? ' Please inform them of their new login email.' : ''}`,
      });

      // Reload data
      await loadHairstylists();
    } catch (error) {
      console.error("Error updating hairstylist:", error);
      toast({
        title: "Error",
        description: handleSupabaseError(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (hairstylist: HairstylistWithProfile) => {
    setSelectedHairstylist(hairstylist);
    setEditHairstylist({
      full_name: hairstylist.user_profile.full_name,
      email: hairstylist.user_profile.email,
      phone: hairstylist.user_profile.phone || "",
      cabang: hairstylist.cabang || "",
      specialties: hairstylist.specialties.join(", "),
      experience_years: hairstylist.experience_years,
      bio: hairstylist.schedule_notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleToggleStatus = async (hairstylistId: string) => {
    const hairstylist = hairstylists.find((s) => s.id === hairstylistId);
    if (!hairstylist) return;

    try {
      if (hairstylist.user_profile.is_active) {
        await hairstylistHelpers.deactivateHairstylist(hairstylistId);
      } else {
        await hairstylistHelpers.activateHairstylist(hairstylistId);
      }

      toast({
        title: "Success",
        description: `${hairstylist.user_profile.full_name} has been ${
          hairstylist.user_profile.is_active ? "deactivated" : "activated"
        }.`,
      });

      // Reload data
      await loadHairstylists();
    } catch (error) {
      console.error("Error toggling hairstylist status:", error);
      toast({
        title: "Error",
        description: handleSupabaseError(error),
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedHairstylist) return;

    try {
      setIsSubmitting(true);
      
      if (resetPasswordData.resetMethod === "email") {
        // Send email reset link (existing functionality)
        await hairstylistHelpers.sendPasswordResetEmail(selectedHairstylist.user_profile.email);
        toast({
          title: "Password Reset Email Sent",
          description: `Reset link sent to ${selectedHairstylist.user_profile.email}`,
        });
      } else {
        // Direct password reset
        if (!resetPasswordData.newPassword || resetPasswordData.newPassword.length < 6) {
          toast({
            title: "Error",
            description: "Password must be at least 6 characters long.",
            variant: "destructive",
          });
          return;
        }
        
        if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match.",
            variant: "destructive",
          });
          return;
        }

        await hairstylistHelpers.resetPasswordDirect(selectedHairstylist.id, resetPasswordData.newPassword);
        toast({
          title: "Password Reset Successful",
          description: `Password has been updated for ${selectedHairstylist.user_profile.full_name}`,
        });
      }
      
      setIsResetPasswordDialogOpen(false);
      setResetPasswordData({
        newPassword: "",
        confirmPassword: "",
        resetMethod: "email",
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: handleSupabaseError(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allSpecialties = [
    ...new Set(hairstylists.flatMap((s) => s.specialties)),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading hairstylists...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Hairstylists Management
          </h2>
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
            <CardTitle className="text-sm font-medium">
              Total Hairstylists
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hairstylists.length}</div>
            <p className="text-xs text-muted-foreground">
              {hairstylists.filter((s) => s.user_profile.is_active).length}{" "}
              active
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
              {hairstylists.reduce((sum, s) => sum + (s.total_clients || 0), 0)}
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
              {hairstylists.reduce(
                (sum, s) => sum + (s.monthly_clients || 0),
                0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Clients this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Experience
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hairstylists.length > 0
                ? (
                    hairstylists.reduce(
                      (sum, s) => sum + s.experience_years,
                      0
                    ) / hairstylists.length
                  ).toFixed(1)
                : "0.0"}
            </div>
            <p className="text-xs text-muted-foreground">Years experience</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
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
                {allSpecialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hairstylist</TableHead>
                  <TableHead>Cabang</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Specialties</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Clients</TableHead>
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
                          <AvatarImage
                            src={hairstylist.user_profile.avatar_url || ""}
                          />
                          <AvatarFallback>
                            {hairstylist.user_profile.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {hairstylist.user_profile.full_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {hairstylist.experience_years} years experience
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {hairstylist.cabang || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {hairstylist.user_profile.email}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {hairstylist.user_profile.phone || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {hairstylist.specialties
                          .slice(0, 2)
                          .map((specialty) => (
                            <Badge
                              key={specialty}
                              variant="secondary"
                              className="text-xs"
                            >
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
                    <TableCell>{hairstylist.experience_years} years</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {hairstylist.total_clients || 0} total
                        </div>
                        <div className="text-muted-foreground">
                          {hairstylist.monthly_clients || 0} this month
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          hairstylist.user_profile.is_active
                            ? "default"
                            : "secondary"
                        }
                      >
                        {hairstylist.user_profile.is_active
                          ? "active"
                          : "inactive"}
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
                          {hairstylist.user_profile.is_active ? (
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
                  value={newHairstylist.full_name}
                  onChange={(e) =>
                    setNewHairstylist((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="hairstylist@hms.com"
                  value={newHairstylist.email}
                  onChange={(e) =>
                    setNewHairstylist((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setNewHairstylist((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cabang">Cabang</Label>
                <Input
                  id="cabang"
                  placeholder="Enter branch name"
                  value={newHairstylist.cabang}
                  onChange={(e) =>
                    setNewHairstylist((prev) => ({
                      ...prev,
                      cabang: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Experience (years)</Label>
                <Input
                  id="experience"
                  type="number"
                  placeholder="0"
                  value={newHairstylist.experience_years}
                  onChange={(e) =>
                    setNewHairstylist((prev) => ({
                      ...prev,
                      experience_years: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties (comma separated)</Label>
              <Input
                id="specialties"
                placeholder="Haircut, Beard Trim, Hair Styling"
                value={newHairstylist.specialties}
                onChange={(e) =>
                  setNewHairstylist((prev) => ({
                    ...prev,
                    specialties: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Enter hairstylist bio and specialties..."
                value={newHairstylist.bio}
                onChange={(e) =>
                  setNewHairstylist((prev) => ({
                    ...prev,
                    bio: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddHairstylist} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
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
              Update hairstylist information for{" "}
              {selectedHairstylist?.user_profile.full_name}.
            </DialogDescription>
          </DialogHeader>
          
          {/* Email Change Warning Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-amber-800">
                  Important: Email Address Changes
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    Changing the email address will affect the hairstylist's login credentials. 
                    They will need to use the new email address to access their account.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter full name"
                  value={editHairstylist.full_name}
                  onChange={(e) =>
                    setEditHairstylist((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="hairstylist@hms.com"
                  value={editHairstylist.email}
                  onChange={(e) =>
                    setEditHairstylist((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="border-amber-200 focus:border-amber-400"
                />
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Changes will affect login credentials
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  placeholder="+6281234567890"
                  value={editHairstylist.phone}
                  onChange={(e) =>
                    setEditHairstylist((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cabang">Cabang</Label>
                <Input
                  id="edit-cabang"
                  placeholder="Enter branch name"
                  value={editHairstylist.cabang}
                  onChange={(e) =>
                    setEditHairstylist((prev) => ({
                      ...prev,
                      cabang: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-experience">Experience (years)</Label>
                <Input
                  id="edit-experience"
                  type="number"
                  placeholder="0"
                  value={editHairstylist.experience_years}
                  onChange={(e) =>
                    setEditHairstylist((prev) => ({
                      ...prev,
                      experience_years: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-specialties">
                Specialties (comma separated)
              </Label>
              <Input
                id="edit-specialties"
                placeholder="Haircut, Beard Trim, Hair Styling"
                value={editHairstylist.specialties}
                onChange={(e) =>
                  setEditHairstylist((prev) => ({
                    ...prev,
                    specialties: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                placeholder="Enter hairstylist bio and specialties..."
                value={editHairstylist.bio}
                onChange={(e) =>
                  setEditHairstylist((prev) => ({
                    ...prev,
                    bio: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditHairstylist} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Update Hairstylist
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={isResetPasswordDialogOpen}
        onOpenChange={setIsResetPasswordDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Choose how to reset password for{" "}
              {selectedHairstylist?.user_profile.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Reset Method Selection */}
            <div className="space-y-3">
              <Label>Reset Method</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resetMethod"
                    value="email"
                    checked={resetPasswordData.resetMethod === "email"}
                    onChange={(e) =>
                      setResetPasswordData((prev) => ({
                        ...prev,
                        resetMethod: e.target.value as "email" | "direct",
                        newPassword: "",
                        confirmPassword: "",
                      }))
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Send reset link via email</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resetMethod"
                    value="direct"
                    checked={resetPasswordData.resetMethod === "direct"}
                    onChange={(e) =>
                      setResetPasswordData((prev) => ({
                        ...prev,
                        resetMethod: e.target.value as "email" | "direct",
                      }))
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Set new password directly</span>
                </label>
              </div>
            </div>

            {/* Email Reset Info */}
            {resetPasswordData.resetMethod === "email" && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  A password reset link will be sent to:{" "}
                  <strong>{selectedHairstylist?.user_profile.email}</strong>
                </p>
              </div>
            )}

            {/* Direct Reset Form */}
            {resetPasswordData.resetMethod === "direct" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password (min. 6 characters)"
                    value={resetPasswordData.newPassword}
                    onChange={(e) =>
                      setResetPasswordData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={resetPasswordData.confirmPassword}
                    onChange={(e) =>
                      setResetPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                  />
                </div>
                {resetPasswordData.newPassword &&
                  resetPasswordData.confirmPassword &&
                  resetPasswordData.newPassword !== resetPasswordData.confirmPassword && (
                    <p className="text-sm text-red-600">Passwords do not match</p>
                  )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsResetPasswordDialogOpen(false);
                setResetPasswordData({
                  newPassword: "",
                  confirmPassword: "",
                  resetMethod: "email",
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {resetPasswordData.resetMethod === "email"
                ? "Send Reset Link"
                : "Update Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Hairstylists;
