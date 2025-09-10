import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Download, Plus, Edit, Trash2, Key, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { memberHelpers, handleSupabaseError } from "../lib/supabase-helpers";
import { Member, UserProfile } from "../types";

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
  const [members, setMembers] = useState<
    (Member & { user_profile: UserProfile | null })[]
  >([]);
  const [filteredMembers, setFilteredMembers] = useState<
    (Member & { user_profile: UserProfile | null })[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<
    (Member & { user_profile: UserProfile | null }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<
    (Member & { user_profile: UserProfile | null }) | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<MemberFormData>({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    whatsapp_number: "",
    instagram_handle: "",
    notes: "",
  });

  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
    resetMethod: "email" as "email" | "direct",
  });

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      password: "",
      phone: "",
      whatsapp_number: "",
      instagram_handle: "",
      notes: "",
    });
  };

  const handleInputChange = (field: keyof MemberFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await memberHelpers.getAllMembersWithProfiles();
      console.log("Loaded members data:", data);
      setMembers(data);
      setFilteredMembers(data);
    } catch (error) {
      console.error("Error loading members:", error);
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await memberHelpers.createMemberWithAuth({
        email: formData.email,
        password:
          formData.password || `temp${Math.random().toString(36).slice(-8)}`,
        full_name: formData.full_name,
        phone: formData.phone,
        whatsapp_number: formData.whatsapp_number,
        instagram_handle: formData.instagram_handle,
        notes: formData.notes,
      });

      setMembers((prev) => [result.member, ...prev]);
      setFilteredMembers((prev) => [result.member, ...prev]);
      toast.success(
        `${formData.full_name} has been added to The Circle successfully.`
      );
      if (result.tempPassword) {
        toast.info(`Temporary password: ${result.tempPassword}`, {
          duration: 10000,
        });
      }
      resetForm();
      setShowAddDialog(false);
    } catch (error: unknown) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member. Please try again.");
    }
  };

  const handleEditMember = (
    member: Member & { user_profile: UserProfile | null }
  ) => {
    if (!member.user_profile) {
      toast.error("Cannot edit member: User profile not found");
      return;
    }

    setEditingMember(member);
    setFormData({
      full_name: member.user_profile.full_name,
      email: member.user_profile.email,
      password: "", // Don't prefill password for security
      phone: member.user_profile.phone || "",
      whatsapp_number: member.user_profile.whatsapp_number || "",
      instagram_handle: member.user_profile.instagram_handle || "",
      notes: member.notes || "",
    });
    setShowAddDialog(true);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingMember) return;

    try {
      // TODO: Implement update member function
      toast.success(`${formData.full_name} has been updated successfully.`);
      resetForm();
      setEditingMember(null);
      setShowAddDialog(false);
      await loadMembers(); // Reload data
    } catch (error: unknown) {
      console.error("Error updating member:", error);
      toast.error("Failed to update member. Please try again.");
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (
      member &&
      confirm(
        `Are you sure you want to delete ${member.user_profile.full_name}?`
      )
    ) {
      try {
        // TODO: Implement delete member function
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        setFilteredMembers((prev) => prev.filter((m) => m.id !== memberId));
        toast.success(
          `${
            member.user_profile?.full_name || "Member"
          } has been removed from The Circle.`
        );
      } catch (error: unknown) {
        console.error("Error deleting member:", error);
        toast.error("Failed to delete member. Please try again.");
      }
    }
  };

  const handleDialogClose = () => {
    setShowAddDialog(false);
    setEditingMember(null);
    resetForm();
  };

  const handleResetPassword = async () => {
    if (!selectedMember?.user_profile?.email) {
      toast.error("Member email not found");
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (resetPasswordData.resetMethod === "email") {
        // Send email reset link
        await memberHelpers.sendPasswordResetEmail(selectedMember.user_profile.email);
        toast.success(`Reset link sent to ${selectedMember.user_profile.email}`);
      } else {
        // Direct password reset
        if (!resetPasswordData.newPassword || resetPasswordData.newPassword.length < 6) {
          toast.error("Password must be at least 6 characters long.");
          return;
        }
        
        if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
          toast.error("Passwords do not match.");
          return;
        }

        await memberHelpers.resetPasswordDirect(selectedMember.id, resetPasswordData.newPassword);
        toast.success(`Password has been updated for ${selectedMember.user_profile.full_name}`);
      }
      
      setIsResetPasswordDialogOpen(false);
      setResetPasswordData({
        newPassword: "",
        confirmPassword: "",
        resetMethod: "email",
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error(handleSupabaseError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = members.filter(
        (member) =>
          member.user_profile?.full_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          member.user_profile?.email
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          member.user_profile?.phone
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          member.user_profile?.whatsapp_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [searchTerm, members]);

  const handleExport = () => {
    const csvContent = [
      "Full Name,Email,Phone,WhatsApp,Instagram,Membership Tier,Total Visits,Notes",
      ...filteredMembers.map(
        (member) =>
          `${member.user_profile.full_name},${member.user_profile.email},${
            member.user_profile.phone || ""
          },${member.user_profile.whatsapp_number || ""},${
            member.user_profile.instagram_handle || ""
          },${member.membership_tier},${member.total_visits},"${
            member.notes || ""
          }"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hms_members.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Members</h2>
            <p className="text-muted-foreground">Loading members...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  {editingMember ? "Edit Member" : "Add New Member"}
                </DialogTitle>
                <DialogDescription>
                  {editingMember
                    ? "Update member information"
                    : "Add a new member to The Circle. They will receive login credentials."}
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={editingMember ? handleUpdateMember : handleAddMember}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      placeholder="Enter full name"
                      value={formData.full_name}
                      onChange={(e) =>
                        handleInputChange("full_name", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                {!editingMember && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password (Optional)</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Leave blank for auto-generated password"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      If left blank, a temporary password will be generated
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+6281234567890"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                    <Input
                      id="whatsapp_number"
                      placeholder="+6281234567890"
                      value={formData.whatsapp_number}
                      onChange={(e) =>
                        handleInputChange("whatsapp_number", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram_handle">Instagram Handle</Label>
                  <Input
                    id="instagram_handle"
                    placeholder="@username"
                    value={formData.instagram_handle}
                    onChange={(e) =>
                      handleInputChange("instagram_handle", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes about the member..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1">
                    {editingMember ? "Update Member" : "Add Member"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDialogClose}
                  >
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
          <CardDescription>
            {filteredMembers.length} of {members.length} members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Membership</TableHead>
                  <TableHead>Visits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">
                          {member.user_profile?.full_name || "N/A"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.user_profile?.email || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {member.user_profile?.phone && (
                          <div>📞 {member.user_profile.phone}</div>
                        )}
                        {member.user_profile?.whatsapp_number && (
                          <div>💬 {member.user_profile.whatsapp_number}</div>
                        )}
                        {member.user_profile?.instagram_handle && (
                          <div>📷 {member.user_profile.instagram_handle}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {member.membership_tier}
                      </Badge>
                    </TableCell>
                    <TableCell>{member.total_visits}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.user_profile?.is_active
                            ? "default"
                            : "secondary"
                        }
                      >
                        {member.user_profile?.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMember(member)}
                          disabled={!member.user_profile}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setIsResetPasswordDialogOpen(true);
                          }}
                          disabled={!member.user_profile}
                        >
                          <Key className="h-4 w-4" />
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
              {selectedMember?.user_profile?.full_name}
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
                  <strong>{selectedMember?.user_profile?.email}</strong>
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
                    placeholder="Enter new password (min. 6 chars)"
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

export default Members;
