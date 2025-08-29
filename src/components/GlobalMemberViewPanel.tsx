import React, { useState, useEffect } from 'react';
import { getMembers, Member } from "@/lib/member-storage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface GlobalMemberViewPanelProps {
  onMemberDataChange: () => void; // Callback to refresh data
}

const GlobalMemberViewPanel: React.FC<GlobalMemberViewPanelProps> = ({ onMemberDataChange }) => {
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  useEffect(() => {
    setAllMembers(getMembers());
  }, [onMemberDataChange]); // Rerun when parent signals data change

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Semua Biodata Member (Global)</h2>
      <div className="rounded-md border h-[400px] overflow-y-auto"> {/* Fixed height for scrolling */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Lengkap</TableHead>
              <TableHead>Nomor WhatsApp</TableHead>
              <TableHead>Instagram Handle</TableHead>
              <TableHead>Tanggal Kunjungan Terakhir</TableHead>
              <TableHead>Total Kunjungan</TableHead>
              <TableHead>Layanan Terakhir</TableHead>
              <TableHead>Komentar Hairstylist</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Tidak ada member ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              allMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.fullName}</TableCell>
                  <TableCell>{member.whatsappNumber}</TableCell>
                  <TableCell>{member.instagramHandle || '-'}</TableCell>
                  <TableCell>
                    {member.lastVisitDate ? format(member.lastVisitDate, "PPP") : '-'}
                  </TableCell>
                  <TableCell>{member.totalVisits}</TableCell>
                  <TableCell>{member.lastServiceType || '-'}</TableCell>
                  <TableCell>{member.latestHairstylistComment || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GlobalMemberViewPanel;
