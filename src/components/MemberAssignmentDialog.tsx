import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, Phone, Instagram, Mail } from "lucide-react";
import { memberHelpers } from "@/lib/supabase-helpers";
import type { Member, UserProfile, MembershipTier } from "@/types";

interface MemberAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hairstylistId: string;
  onAssignmentComplete: () => void;
}

interface UnassignedMember extends Member {
  user_profile: UserProfile;
}

const MemberAssignmentDialog = ({
  open,
  onOpenChange,
  hairstylistId,
  onAssignmentComplete,
}: MemberAssignmentDialogProps) => {
  const { toast } = useToast();
  const [unassignedMembers, setUnassignedMembers] = useState<
    UnassignedMember[]
  >([]);
  const [filteredMembers, setFilteredMembers] = useState<UnassignedMember[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (open) {
      loadUnassignedMembers();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMembers(unassignedMembers);
    } else {
      const filtered = unassignedMembers.filter(
        (member) =>
          member.user_profile.full_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          member.user_profile.email
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          member.user_profile.phone?.includes(searchQuery) ||
          member.user_profile.whatsapp_number?.includes(searchQuery)
      );
      setFilteredMembers(filtered);
    }
  }, [searchQuery, unassignedMembers]);

  const loadUnassignedMembers = async () => {
    try {
      setLoading(true);
      const members = await memberHelpers.getUnassignedMembers();
      setUnassignedMembers(members);
      setFilteredMembers(members);
    } catch (error) {
      console.error("Failed to load unassigned members:", error);
      toast({
        title: "Error",
        description: "Failed to load available members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMember = async (memberId: string, memberName: string) => {
    try {
      setAssigning(true);
      await memberHelpers.assignExistingMemberToHairstylist(
        memberId,
        hairstylistId
      );

      toast({
        title: "Success",
        description: `${memberName} has been assigned to you successfully!`,
      });

      // Remove the assigned member from the list
      setUnassignedMembers((prev) => prev.filter((m) => m.id !== memberId));
      onAssignmentComplete();
    } catch (error: any) {
      console.error("Failed to assign member:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to assign member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const getMembershipBadgeColor = (tier: MembershipTier) => {
    const colors = {
      bronze: "bg-orange-100 text-orange-800",
      silver: "bg-gray-100 text-gray-800",
      gold: "bg-yellow-100 text-yellow-800",
      platinum: "bg-purple-100 text-purple-800",
      diamond: "bg-blue-100 text-blue-800",
    };
    return colors[tier];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Member to Your List
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">
                    Loading available members...
                  </p>
                </div>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "No members match your search"
                    : "No unassigned members available"}
                </p>
                {!searchQuery && (
                  <p className="text-xs text-muted-foreground mt-1">
                    All members have been assigned to hairstylists
                  </p>
                )}
              </div>
            ) : (
              filteredMembers.map((member) => (
                <Card
                  key={member.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.user_profile.avatar_url} />
                          <AvatarFallback>
                            {member.user_profile.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">
                              {member.user_profile.full_name}
                            </h3>
                            <Badge
                              className={getMembershipBadgeColor(
                                member.membership_tier
                              )}
                            >
                              {member.membership_tier}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            {member.user_profile.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {member.user_profile.email}
                              </div>
                            )}
                            {member.user_profile.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {member.user_profile.phone}
                              </div>
                            )}
                            {member.user_profile.instagram_handle && (
                              <div className="flex items-center gap-1">
                                <Instagram className="h-3 w-3" />@
                                {member.user_profile.instagram_handle}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                            <span>Visits: {member.total_visits}</span>
                            <span>
                              Joined:{" "}
                              {new Date(member.join_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() =>
                          handleAssignMember(
                            member.id,
                            member.user_profile.full_name
                          )
                        }
                        disabled={assigning}
                        size="sm"
                      >
                        {assigning ? "Assigning..." : "Assign"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberAssignmentDialog;
