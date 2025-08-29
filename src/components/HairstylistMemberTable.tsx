import React, { useState, useEffect } from 'react';
import { getMembersByHairstylist, updateMemberInfo, Member, MemberVisit, getMembers, saveMembers } from "@/lib/member-storage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface HairstylistMemberTableProps {
  hairstylistId: string;
  onMemberDataChange: () => void; // Callback to refresh data in parent
}

const serviceTypes = ["Potong", "Ritual", "Coloring", "Styling", "Treatment"];

const HairstylistMemberTable: React.FC<HairstylistMemberTableProps> = ({ hairstylistId, onMemberDataChange }) => {
  const [myMembers, setMyMembers] = useState<Member[]>([]);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (hairstylistId) {
      setMyMembers(getMembersByHairstylist(hairstylistId));
    }
  }, [hairstylistId, onMemberDataChange]); // Rerun when parent signals data change

  const handleEditClick = (member: Member) => {
    setEditingMember(member);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingMember) {
      updateMemberInfo(editingMember.id, {
        fullName: editingMember.fullName,
        whatsappNumber: editingMember.whatsappNumber,
        instagramHandle: editingMember.instagramHandle,
        // Note: For simplicity, we are not allowing editing of past visits directly here.
        // Only basic member info is editable.
      });
      // If we want to allow editing of the latest visit details, we'd need more complex logic
      // For now, let's assume only core member info is editable from this table.
      // If the latest visit's comment/service type needs to be updated, it would be a new visit entry.

      // Refresh the list
      setMyMembers(getMembersByHairstylist(hairstylistId));
      onMemberDataChange(); // Notify parent
      setIsEditDialogOpen(false);
      setEditingMember(null);
    }
  };

  // For simplicity, let's make the latest visit's comment editable directly for the hairstylist
  const handleEditLatestVisitComment = (memberId: string, newComment: string) => {
    const members = getMembersByHairstylist(hairstylistId);
    const memberToUpdate = members.find(m => m.id === memberId);

    if (memberToUpdate && memberToUpdate.visits.length > 0) {
      const latestVisit = memberToUpdate.visits[0];
      latestVisit.hairstylistComment = newComment;
      // Update the member in the main storage
      const allMembers = getMembers();
      const globalMemberIndex = allMembers.findIndex(m => m.id === memberId);
      if (globalMemberIndex !== -1) {
        allMembers[globalMemberIndex].visits = memberToUpdate.visits;
        allMembers[globalMemberIndex].latestHairstylistComment = newComment; // Update top-level summary
        saveMembers(allMembers);
        setMyMembers(getMembersByHairstylist(hairstylistId)); // Refresh local state
        onMemberDataChange(); // Notify parent
      }
    }
  };


  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Member yang Saya Tangani</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Lengkap</TableHead>
              <TableHead>Nomor WhatsApp</TableHead>
              <TableHead>Instagram Handle</TableHead>
              <TableHead>Tanggal Kunjungan Terakhir</TableHead>
              <TableHead>Layanan Terakhir</TableHead>
              <TableHead>Komentar Hairstylist</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Belum ada member yang Anda tangani.
                </TableCell>
              </TableRow>
            ) : (
              myMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.fullName}</TableCell>
                  <TableCell>{member.whatsappNumber}</TableCell>
                  <TableCell>{member.instagramHandle || '-'}</TableCell>
                  <TableCell>
                    {member.lastVisitDate ? format(member.lastVisitDate, "PPP") : '-'}
                  </TableCell>
                  <TableCell>{member.lastServiceType || '-'}</TableCell>
                  <TableCell>
                    <Input
                      value={member.latestHairstylistComment || ''}
                      onChange={(e) => handleEditLatestVisitComment(member.id, e.target.value)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(member)}>
                      Edit Info
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingMember && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Info Member</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fullName" className="text-right">
                  Nama Lengkap
                </Label>
                <Input
                  id="fullName"
                  value={editingMember.fullName}
                  onChange={(e) => setEditingMember({ ...editingMember, fullName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="whatsappNumber" className="text-right">
                  Nomor WhatsApp
                </Label>
                <Input
                  id="whatsappNumber"
                  value={editingMember.whatsappNumber}
                  onChange={(e) => setEditingMember({ ...editingMember, whatsappNumber: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="instagramHandle" className="text-right">
                  Instagram Handle
                </Label>
                <Input
                  id="instagramHandle"
                  value={editingMember.instagramHandle || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, instagramHandle: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSaveEdit}>Simpan Perubahan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default HairstylistMemberTable;
