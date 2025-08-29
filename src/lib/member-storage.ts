import { v4 as uuidv4 } from 'uuid';
import { dataService } from '../services/dataService';
import { User, Appointment } from '../types';
import { formatDateForInput } from '../utils/dataUtils';

// Legacy interfaces for backward compatibility
export interface MemberVisit {
  visitId: string;
  visitDate: Date;
  serviceType: string;
  hairstylistComment?: string;
  hairstylistId: string;
}

export interface Member {
  id: string;
  fullName: string;
  whatsappNumber: string;
  instagramHandle?: string;
  visits: MemberVisit[];
  totalVisits: number;
  lastVisitDate?: Date;
  lastServiceType?: string;
  latestHairstylistComment?: string;
}

const MEMBERS_STORAGE_KEY = "hms_members";

// Updated function that integrates with new data service
export const getMembers = (): Member[] => {
  if (typeof window === "undefined") {
    return [];
  }
  
  // First try to get from new data service
  const users = dataService.getUsers();
  const memberUsers = users.filter(user => user.role === 'member');
  const appointments = dataService.getAppointments();
  
  if (memberUsers.length > 0) {
    // Convert new structure to legacy format
    return memberUsers.map(user => {
      const userAppointments = appointments.filter(a => a.memberId === user.id);
      const completedAppointments = userAppointments.filter(a => a.status === 'completed');
      const lastAppointment = completedAppointments
        .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())[0];
      
      return {
        id: user.id,
        fullName: (user.profile as any).fullName || '',
        whatsappNumber: (user.profile as any).whatsappNumber || '',
        instagramHandle: (user.profile as any).instagramHandle,
        visits: completedAppointments.map(appointment => ({
          visitId: appointment.id,
          visitDate: new Date(appointment.scheduledDate),
          serviceType: appointment.serviceIds.join(', '), // Convert array to string for legacy
          hairstylistComment: appointment.notes,
          hairstylistId: appointment.hairstylistId
        })),
        totalVisits: completedAppointments.length,
        lastVisitDate: lastAppointment ? new Date(lastAppointment.scheduledDate) : undefined,
        lastServiceType: lastAppointment ? lastAppointment.serviceIds.join(', ') : undefined,
        latestHairstylistComment: lastAppointment?.notes
      };
    });
  }
  
  // Fallback to legacy storage
  const membersJson = localStorage.getItem(MEMBERS_STORAGE_KEY);
  if (membersJson) {
    const members = JSON.parse(membersJson) as Member[];
    return members.map(member => ({
      ...member,
      visits: member.visits.map(visit => ({
        ...visit,
        visitDate: new Date(visit.visitDate),
      })),
      lastVisitDate: member.lastVisitDate ? new Date(member.lastVisitDate) : undefined,
    }));
  }
  return [];
};

// Helper function to derive summary fields from member visits
const deriveMemberSummary = (member: Member): Member => {
  const sortedVisits = [...member.visits].sort((a, b) => b.visitDate.getTime() - a.visitDate.getTime());
  const latestVisit = sortedVisits.length > 0 ? sortedVisits[0] : undefined;

  return {
    ...member,
    visits: sortedVisits, // Ensure visits are always sorted
    totalVisits: sortedVisits.length,
    lastVisitDate: latestVisit?.visitDate,
    lastServiceType: latestVisit?.serviceType,
    latestHairstylistComment: latestVisit?.hairstylistComment,
  };
};

export const saveMembers = (members: Member[]): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
  } catch (error) {
    console.error("Error saving members to localStorage:", error);
  }
};

export const addMemberVisit = (
  memberData: Omit<Member, "id" | "visits" | "totalVisits" | "lastVisitDate" | "lastServiceType" | "latestHairstylistComment"> & {
    visitDate: Date;
    serviceType: string;
    hairstylistComment?: string;
    hairstylistId: string;
  }
): void => {
  // Try to use new data service first
  const users = dataService.getUsers();
  const existingUser = users.find(user => 
    user.role === 'member' && 
    (user.profile as any).whatsappNumber === memberData.whatsappNumber
  );
  
  const services = dataService.getServices();
  const serviceId = services.find(s => s.name === memberData.serviceType)?.id || uuidv4();
  
  if (existingUser) {
    // Create appointment in new system
    dataService.createAppointment({
      memberId: existingUser.id,
      hairstylistId: memberData.hairstylistId,
      serviceIds: [serviceId],
      scheduledDate: memberData.visitDate,
      status: 'completed',
      duration: 60, // Default duration
      totalPrice: 150000, // Default price
      notes: memberData.hairstylistComment
    });
  } else {
    // Create new member in new system
    const newUserResult = dataService.createUser({
      email: `${memberData.whatsappNumber}@member.hms`,
      role: 'member',
      profile: {
        fullName: memberData.fullName,
        whatsappNumber: memberData.whatsappNumber,
        instagramHandle: memberData.instagramHandle,
        joinDate: formatDateForInput(new Date()),
        preferences: {
          preferredServices: [memberData.serviceType],
          notes: ''
        },
        photos: {
          beforePhotos: [],
          afterPhotos: []
        }
      }
    });
    
    if (newUserResult.success && newUserResult.data) {
      // Create appointment for new member
      dataService.createAppointment({
        memberId: newUserResult.data.id,
        hairstylistId: memberData.hairstylistId,
        serviceIds: [serviceId],
        scheduledDate: memberData.visitDate,
        status: 'completed',
        duration: 60,
        totalPrice: 150000,
        notes: memberData.hairstylistComment
      });
    }
  }
  
  // Also maintain legacy storage for backward compatibility
  const members = getLegacyMembers();
  const existingMemberIndex = members.findIndex(
    (m) => m.whatsappNumber === memberData.whatsappNumber
  );

  const newVisit: MemberVisit = {
    visitId: uuidv4(),
    visitDate: memberData.visitDate,
    serviceType: memberData.serviceType,
    hairstylistComment: memberData.hairstylistComment,
    hairstylistId: memberData.hairstylistId,
  };

  let updatedMembers: Member[];

  if (existingMemberIndex !== -1) {
    const existingMember = { ...members[existingMemberIndex] };
    existingMember.visits = [...existingMember.visits, newVisit];
    const updatedMember = deriveMemberSummary(existingMember);
    updatedMember.fullName = memberData.fullName;
    updatedMember.instagramHandle = memberData.instagramHandle;

    updatedMembers = [
      ...members.slice(0, existingMemberIndex),
      updatedMember,
      ...members.slice(existingMemberIndex + 1),
    ];
  } else {
    // Add new member immutably
    const newMember: Member = {
      id: uuidv4(),
      fullName: memberData.fullName,
      whatsappNumber: memberData.whatsappNumber,
      instagramHandle: memberData.instagramHandle,
      visits: [newVisit],
      totalVisits: 0, // Will be updated by deriveMemberSummary
      lastVisitDate: undefined, // Will be updated by deriveMemberSummary
      lastServiceType: undefined, // Will be updated by deriveMemberSummary
      latestHairstylistComment: undefined, // Will be updated by deriveMemberSummary
    };
    const derivedNewMember = deriveMemberSummary(newMember); // Derive summary
    updatedMembers = [...members, derivedNewMember];
  }
  saveMembers(updatedMembers);
};

// Helper function to get legacy members from localStorage
const getLegacyMembers = (): Member[] => {
  const membersJson = localStorage.getItem(MEMBERS_STORAGE_KEY);
  if (membersJson) {
    const members = JSON.parse(membersJson) as Member[];
    return members.map(member => ({
      ...member,
      visits: member.visits.map(visit => ({
        ...visit,
        visitDate: new Date(visit.visitDate),
      })),
      lastVisitDate: member.lastVisitDate ? new Date(member.lastVisitDate) : undefined,
    }));
  }
  return [];
};

// Alias for saveMembers to maintain compatibility
const setMembers = saveMembers;

export const getMembersByHairstylist = (hairstylistId: string): Member[] => {
  const allMembers = getMembers();
  const hairstylistMembers: Member[] = [];

  allMembers.forEach(member => {
    const handledVisits = member.visits.filter(visit => visit.hairstylistId === hairstylistId);
    if (handledVisits.length > 0) {
      // Create a "view" of the member that only includes visits by this hairstylist
      // and ensure summary is derived from these specific visits
      const memberCopy = { ...member, visits: handledVisits };
      hairstylistMembers.push(deriveMemberSummary(memberCopy)); // Derive summary for this view
    }
  });
  return hairstylistMembers;
};

export const updateMemberInfo = (memberId: string, updatedInfo: Partial<Member>): void => {
  // Try to update in new data service first
  const users = dataService.getUsers();
  const user = users.find(u => u.id === memberId && u.role === 'member');
  
  if (user) {
    const updatedProfile = {
      ...user.profile,
      fullName: updatedInfo.fullName || (user.profile as any).fullName,
      whatsappNumber: updatedInfo.whatsappNumber || (user.profile as any).whatsappNumber,
      instagramHandle: updatedInfo.instagramHandle || (user.profile as any).instagramHandle
    };
    
    dataService.updateUser(memberId, {
      profile: updatedProfile
    });
  }
  
  // Also update legacy storage for backward compatibility
  const members = getLegacyMembers();
  const memberIndex = members.findIndex(m => m.id === memberId);

  if (memberIndex !== -1) {
    const existingMember = { ...members[memberIndex] };
    const updatedMember = { ...existingMember, ...updatedInfo };

    // If visits were updated (though not directly supported by current UI), re-derive summary
    const finalMember = updatedInfo.visits ? deriveMemberSummary(updatedMember) : updatedMember;

    const updatedMembers = [
      ...members.slice(0, memberIndex),
      finalMember,
      ...members.slice(memberIndex + 1),
    ];
    saveMembers(updatedMembers);
  }
};
