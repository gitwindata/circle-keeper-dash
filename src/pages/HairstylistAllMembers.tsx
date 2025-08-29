import React, { useCallback, useState } from 'react';
import GlobalMemberViewPanel from "@/components/GlobalMemberViewPanel";

const HairstylistAllMembers = () => {
  const [memberDataVersion, setMemberDataVersion] = useState(0); // To trigger re-renders in child components

  const handleMemberDataChange = useCallback(() => {
    setMemberDataVersion(prev => prev + 1); // Increment to force re-render
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Semua Biodata Member</h1>
      <GlobalMemberViewPanel onMemberDataChange={handleMemberDataChange} />
    </div>
  );
};

export default HairstylistAllMembers;
