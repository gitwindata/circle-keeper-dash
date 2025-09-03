import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Check, 
  X, 
  Scissors,
  Crown,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { memberHelpers, hairstylistHelpers } from '../lib/supabase-helpers';
import { MembershipCalculator } from '../lib/membership-calculator';
import { Member, Hairstylist, MembershipTier } from '../types';
import { toast } from 'sonner';

interface MemberAssignmentPanelProps {
  className?: string;
}

interface Assignment {
  id: string;
  member_id: string;
  hairstylist_id: string;
  is_primary: boolean;
  assigned_at: string;
  notes?: string;
}

interface MemberWithAssignments extends Member {
  user_profile: any;
  assignments: Assignment[];
  assignedHairstylists: Hairstylist[];
}

const MemberAssignmentPanel: React.FC<MemberAssignmentPanelProps> = ({ className = '' }) => {
  const [members, setMembers] = useState<MemberWithAssignments[]>([]);
  const [hairstylists, setHairstylists] = useState<Hairstylist[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<MembershipTier | 'all'>('all');
  const [selectedMember, setSelectedMember] = useState<MemberWithAssignments | null>(null);
  const [selectedHairstylists, setSelectedHairstylists] = useState<string[]>([]);
  const [primaryHairstylist, setPrimaryHairstylist] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load members with their current assignments
      const [membersData, hairstylistsData] = await Promise.all([
        memberHelpers.getAllMembersWithProfiles(),
        hairstylistHelpers.getAllHairstylistsWithProfiles()
      ]);

      // Load assignments for each member
      const membersWithAssignments = await Promise.all(
        membersData.map(async (member) => {
          const assignedHairstylists = await hairstylistHelpers.getAssignedHairstylists(member.id);
          return {
            ...member,
            assignedHairstylists,
            assignments: [] // This would come from assignments table
          };
        })
      );

      setMembers(membersWithAssignments);
      setHairstylists(hairstylistsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.user_profile?.full_name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesTier = selectedTier === 'all' || member.membership_tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const unassignedMembers = filteredMembers.filter(member => 
    member.assignedHairstylists.length === 0
  );

  const handleMemberSelect = (member: MemberWithAssignments) => {
    setSelectedMember(member);
    setSelectedHairstylists(member.assignedHairstylists.map(h => h.id));
    
    // Set primary hairstylist if exists
    const primary = member.assignments?.find(a => a.is_primary);
    setPrimaryHairstylist(primary?.hairstylist_id || '');
    
    setAssignmentNotes('');
    setShowAssignmentForm(true);
  };

  const handleHairstylistToggle = (hairstylistId: string) => {
    setSelectedHairstylists(prev => {
      if (prev.includes(hairstylistId)) {
        // If removing and it's the primary, clear primary
        if (hairstylistId === primaryHairstylist) {
          setPrimaryHairstylist('');
        }
        return prev.filter(id => id !== hairstylistId);
      } else {
        return [...prev, hairstylistId];
      }
    });
  };

  const handlePrimarySelect = (hairstylistId: string) => {
    // Ensure the selected primary is in the selected list
    if (!selectedHairstylists.includes(hairstylistId)) {
      setSelectedHairstylists(prev => [...prev, hairstylistId]);
    }
    setPrimaryHairstylist(hairstylistId);
  };

  const handleSaveAssignments = async () => {
    if (!selectedMember) return;

    if (selectedHairstylists.length === 0) {
      toast.error('Please select at least one hairstylist');
      return;
    }

    if (selectedHairstylists.length > 1 && !primaryHairstylist) {
      toast.error('Please select a primary hairstylist when assigning multiple hairstylists');
      return;
    }

    setSaving(true);

    try {
      // Create assignments
      const assignments = selectedHairstylists.map(hairstylistId => ({
        member_id: selectedMember.id,
        hairstylist_id: hairstylistId,
        is_primary: hairstylistId === primaryHairstylist || selectedHairstylists.length === 1,
        notes: assignmentNotes
      }));

      await memberHelpers.updateMemberAssignments(selectedMember.id, assignments);
      
      toast.success('Member assignments updated successfully');
      setShowAssignmentForm(false);
      loadData(); // Reload to get updated data
      
    } catch (error: any) {
      console.error('Failed to save assignments:', error);
      toast.error('Failed to save assignments: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAssignment = async (memberId: string, hairstylistId: string) => {
    try {
      await memberHelpers.removeAssignment(memberId, hairstylistId);
      toast.success('Assignment removed successfully');
      loadData();
    } catch (error: any) {
      console.error('Failed to remove assignment:', error);
      toast.error('Failed to remove assignment: ' + error.message);
    }
  };

  const getTierColor = (tier: MembershipTier) => {
    return MembershipCalculator.getTierColor(tier);
  };

  const getTierName = (tier: MembershipTier) => {
    return MembershipCalculator.formatTierName(tier);
  };

  if (loading) {
    return (
      <div className={`${className} space-y-4`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Member-Hairstylist Assignments</h3>
          <p className="text-sm text-gray-600">
            Assign members to hairstylists for personalized service
          </p>
        </div>
        <Badge variant="outline">
          {unassignedMembers.length} unassigned members
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedTier} onValueChange={(value) => setSelectedTier(value as any)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="bronze">Bronze</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="platinum">Platinum</SelectItem>
            <SelectItem value="diamond">Diamond</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Unassigned Members Alert */}
      {unassignedMembers.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {unassignedMembers.length} member(s) are not assigned to any hairstylist yet.
          </AlertDescription>
        </Alert>
      )}

      {/* Members List */}
      <div className="grid gap-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.user_profile?.avatar_url} />
                    <AvatarFallback>
                      {member.user_profile?.full_name?.[0] || 'M'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-medium">
                        {member.user_profile?.full_name || 'Unknown Member'}
                      </h4>
                      <Badge 
                        className={`${getTierColor(member.membership_tier)} text-white text-xs`}
                      >
                        {getTierName(member.membership_tier)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{member.total_visits} visits</span>
                      <span>•</span>
                      <span>Member since {new Date(member.created_at).getFullYear()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Current Assignments */}
                  <div className="text-right">
                    {member.assignedHairstylists.length > 0 ? (
                      <div className="space-y-1">
                        {member.assignedHairstylists.map((hairstylist, index) => (
                          <div key={hairstylist.id} className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              <Scissors className="h-3 w-3 mr-1" />
                              {hairstylist.user_profile?.full_name}
                            </Badge>
                            {/* Show if primary */}
                            {index === 0 && member.assignedHairstylists.length > 1 && (
                              <Badge variant="outline" className="text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        Unassigned
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMemberSelect(member)}
                  >
                    {member.assignedHairstylists.length > 0 ? 'Edit' : 'Assign'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredMembers.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Members Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'No members match the selected filters'}
            </p>
          </div>
        )}
      </div>

      {/* Assignment Form Modal */}
      {showAssignmentForm && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Assign Hairstylists - {selectedMember.user_profile?.full_name}
              </CardTitle>
              <CardDescription>
                Select one or more hairstylists to work with this member
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Member Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedMember.user_profile?.avatar_url} />
                  <AvatarFallback>
                    {selectedMember.user_profile?.full_name?.[0] || 'M'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{selectedMember.user_profile?.full_name}</h4>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getTierColor(selectedMember.membership_tier)} text-white text-xs`}>
                      {getTierName(selectedMember.membership_tier)}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {selectedMember.total_visits} visits
                    </span>
                  </div>
                </div>
              </div>

              {/* Hairstylist Selection */}
              <div>
                <Label className="text-base font-medium">Select Hairstylists</Label>
                <p className="text-sm text-gray-600 mb-4">
                  Choose which hairstylists can work with this member
                </p>
                
                <div className="space-y-3">
                  {hairstylists.map((hairstylist) => (
                    <div key={hairstylist.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={hairstylist.id}
                        checked={selectedHairstylists.includes(hairstylist.id)}
                        onCheckedChange={() => handleHairstylistToggle(hairstylist.id)}
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={hairstylist.user_profile?.avatar_url} />
                        <AvatarFallback>
                          {hairstylist.user_profile?.full_name?.[0] || 'H'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">
                          {hairstylist.user_profile?.full_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {hairstylist.experience_years} years experience
                          {hairstylist.specialties && hairstylist.specialties.length > 0 && (
                            <span> • {hairstylist.specialties.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      {selectedHairstylists.includes(hairstylist.id) && selectedHairstylists.length > 1 && (
                        <Button
                          variant={primaryHairstylist === hairstylist.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePrimarySelect(hairstylist.id)}
                        >
                          {primaryHairstylist === hairstylist.id ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Primary
                            </>
                          ) : (
                            'Set Primary'
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Primary Selection Note */}
              {selectedHairstylists.length > 1 && (
                <Alert>
                  <AlertDescription>
                    When multiple hairstylists are selected, choose one as the primary contact. 
                    The primary hairstylist will be the main point of contact for this member.
                  </AlertDescription>
                </Alert>
              )}

              {/* Assignment Notes */}
              <div>
                <Label htmlFor="notes">Assignment Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this assignment..."
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAssignmentForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAssignments}
                  disabled={saving || selectedHairstylists.length === 0}
                >
                  {saving ? 'Saving...' : 'Save Assignments'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MemberAssignmentPanel;