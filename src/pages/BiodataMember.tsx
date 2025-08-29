import React, { useState, useEffect, useMemo } from 'react';
import { getMembers, Member } from "@/lib/member-storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { CalendarIcon, ArrowUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const BiodataMember = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Member | 'lastVisitDate', direction: 'ascending' | 'descending' } | null>(null);

  useEffect(() => {
    setMembers(getMembers());
  }, []);

  const filteredMembers = useMemo(() => {
    let currentMembers = [...members];

    if (searchTerm) {
      currentMembers = currentMembers.filter((member) =>
        member.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDate) {
      currentMembers = currentMembers.filter((member) =>
        member.lastVisitDate && format(member.lastVisitDate, "yyyy-MM-dd") === format(filterDate, "yyyy-MM-dd")
      );
    }

    if (sortConfig !== null) {
      currentMembers.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue instanceof Date && bValue instanceof Date) {
          return sortConfig.direction === 'ascending'
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }
        // Fallback for other types or if not dates
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return currentMembers;
  }, [members, searchTerm, filterDate, sortConfig]);

  const requestSort = (key: keyof Member | 'lastVisitDate') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Biodata Member Global View</h1>
      <p className="mb-4">Daftar lengkap semua member yang terdaftar di sistem.</p>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Cari berdasarkan nama member..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !filterDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filterDate ? format(filterDate, "PPP") : <span>Filter Tanggal Kunjungan</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filterDate}
              onSelect={setFilterDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {filterDate && (
          <Button variant="ghost" onClick={() => setFilterDate(undefined)}>
            Reset Filter Tanggal
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Lengkap</TableHead>
              <TableHead>Nomor WhatsApp</TableHead>
              <TableHead>Instagram Handle</TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('lastVisitDate')}>
                <div className="flex items-center">
                  Tanggal Kunjungan Terakhir
                  {sortConfig?.key === 'lastVisitDate' && (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Total Kunjungan</TableHead>
              <TableHead>Layanan Terakhir</TableHead>
              <TableHead>Komentar Hairstylist</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Tidak ada member ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
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

export default BiodataMember;
