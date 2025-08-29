import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AddMemberForm from "@/components/AddMemberForm";
import { useToast } from "@/components/ui/use-toast";
import HairstylistMemberTable from "@/components/HairstylistMemberTable";

const HairstylistMyMembers = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [hairstylistId, setHairstylistId] = useState<string | null>(null);
  const [memberDataVersion, setMemberDataVersion] = useState(0); // To trigger re-renders in child components
  const { toast } = useToast();

  useEffect(() => {
    setHairstylistId(localStorage.getItem('hms_hairstylist_id'));
  }, []);

  const handleMemberDataChange = useCallback(() => {
    setMemberDataVersion(prev => prev + 1); // Increment to force re-render
  }, []);

  const handleMemberAdded = () => {
    toast({
      title: "Member Ditambahkan!",
      description: "Member baru berhasil ditambahkan ke sistem.",
    });
    handleMemberDataChange(); // Refresh data in tables
  };

  if (!hairstylistId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading hairstylist data or not logged in...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Member yang Saya Tangani</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>Tambah Member Baru</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Member Baru</DialogTitle>
            </DialogHeader>
            <AddMemberForm onMemberAdded={handleMemberAdded} onClose={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <HairstylistMemberTable hairstylistId={hairstylistId} onMemberDataChange={handleMemberDataChange} />
    </div>
  );
};

export default HairstylistMyMembers;
