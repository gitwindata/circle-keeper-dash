import { supabase } from './supabase';
import { UserProfile, UserRole, Member, Hairstylist } from '../types';

// Auth helper functions
export const authHelpers = {
  // Create user profile after signup
  async createUserProfile(
    userId: string,
    email: string,
    role: UserRole,
    profileData: Partial<UserProfile>
  ): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        role,
        ...profileData,
      })
      .select()
      .single();

    if (error) throw error;
    return data as UserProfile;
  },

  // Get user profile by ID
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }
    return data as UserProfile;
  },

  // Update user profile
  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserProfile;
  },

  // Create role-specific profile (hairstylist or member)
  async createRoleProfile(
    userId: string,
    role: UserRole,
    roleData?: any
  ): Promise<void> {
    if (role === 'hairstylist') {
      const { error } = await supabase
        .from('hairstylists')
        .insert({
          id: userId,
          ...roleData,
        });
      if (error) throw error;
    } else if (role === 'member') {
      const { error } = await supabase
        .from('members')
        .insert({
          id: userId,
          ...roleData,
        });
      if (error) throw error;
    }
  },

  // Check if user has required role
  async checkUserRole(userId: string, requiredRole: UserRole): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    return profile?.role === requiredRole;
  },
};

// Member management helpers
export const memberHelpers = {
  // Get member with profile data by user auth ID
  async getMemberWithProfile(userId: string): Promise<(Member & { user_profile: UserProfile }) | null> {
    // First try to find member record that corresponds to this user
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        member:members(*)
      `)
      .eq('id', userId)
      .eq('role', 'member')
      .single();

    if (error) {
      console.warn('Member user profile not found:', userId);
      return null;
    }

    if (!data.member) {
      console.warn('User profile found but no member record:', userId);
      return null;
    }

    // Return the member with the user profile
    return {
      ...data.member,
      user_profile: {
        id: data.id,
        email: data.email,
        role: data.role,
        full_name: data.full_name,
        phone: data.phone,
        avatar_url: data.avatar_url,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    };
  },

  // Get all members with profiles
  async getAllMembersWithProfiles(): Promise<(Member & { user_profile: UserProfile })[]> {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        user_profile:user_profiles(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Update member stats
  async updateMemberStats(
    memberId: string,
    stats: {
      total_visits?: number;
      total_spent?: number;
      last_visit_date?: string;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('members')
      .update(stats)
      .eq('id', memberId);

    if (error) throw error;
  },
};

// Hairstylist management helpers
export const hairstylistHelpers = {
  // Get hairstylist with profile data by user auth ID
  async getHairstylistWithProfile(userId: string): Promise<(Hairstylist & { user_profile: UserProfile }) | null> {
    // First try to find hairstylist record that corresponds to this user
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        hairstylist:hairstylists(*)
      `)
      .eq('id', userId)
      .eq('role', 'hairstylist')
      .single();

    if (error) {
      console.warn('Hairstylist user profile not found:', userId);
      return null;
    }

    if (!data.hairstylist) {
      console.warn('User profile found but no hairstylist record:', userId);
      return null;
    }

    // Return the hairstylist with the user profile
    return {
      ...data.hairstylist,
      user_profile: {
        id: data.id,
        email: data.email,
        role: data.role,
        full_name: data.full_name,
        phone: data.phone,
        avatar_url: data.avatar_url,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    };
  },

  // Get all hairstylists with profiles
  async getAllHairstylistsWithProfiles(): Promise<(Hairstylist & { user_profile: UserProfile })[]> {
    const { data, error } = await supabase
      .from('hairstylists')
      .select(`
        *,
        user_profile:user_profiles(*)
      `)
      .eq('user_profile.is_active', true)
      .order('user_profile.full_name');

    if (error) throw error;
    return data || [];
  },

  // Get hairstylist's assigned members
  async getAssignedMembers(hairstylistId: string): Promise<(Member & { user_profile: UserProfile })[]> {
    const { data, error } = await supabase
      .from('member_hairstylist_assignments')
      .select(`
        member:members(
          *,
          user_profile:user_profiles(*)
        )
      `)
      .eq('hairstylist_id', hairstylistId);

    if (error) throw error;
    return data?.map((item: any) => item.member).filter(Boolean) || [];
  },
};

// Visit management helpers
export const visitHelpers = {
  // Create a new visit with services
  async createVisit(visitData: {
    member_id: string;
    hairstylist_id: string;
    service_ids: string[];
    total_price: number;
    discount_percentage?: number;
    final_price: number;
    hairstylist_notes?: string;
    visit_date?: string;
  }) {
    // Start a transaction
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .insert({
        member_id: visitData.member_id,
        hairstylist_id: visitData.hairstylist_id,
        total_price: visitData.total_price,
        discount_percentage: visitData.discount_percentage || 0,
        final_price: visitData.final_price,
        hairstylist_notes: visitData.hairstylist_notes,
        visit_date: visitData.visit_date || new Date().toISOString(),
        status: 'completed',
      })
      .select()
      .single();

    if (visitError) throw visitError;

    // Insert visit services
    const visitServices = visitData.service_ids.map(serviceId => ({
      visit_id: visit.id,
      service_id: serviceId,
      price: 0, // Will be updated based on service data
      duration_minutes: 0, // Will be updated based on service data
    }));

    const { error: servicesError } = await supabase
      .from('visit_services')
      .insert(visitServices);

    if (servicesError) throw servicesError;

    return visit;
  },

  // Get visits with related data
  async getVisitsWithDetails(filters?: {
    member_id?: string;
    hairstylist_id?: string;
    limit?: number;
  }) {
    let query = supabase
      .from('visits')
      .select(`
        *,
        member:members(
          *,
          user_profile:user_profiles(*)
        ),
        hairstylist:hairstylists(
          *,
          user_profile:user_profiles(*)
        ),
        visit_services(
          *,
          service:services(*)
        ),
        visit_photos(*),
        reviews(*)
      `)
      .order('visit_date', { ascending: false });

    if (filters?.member_id) {
      query = query.eq('member_id', filters.member_id);
    }
    if (filters?.hairstylist_id) {
      query = query.eq('hairstylist_id', filters.hairstylist_id);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
};

// Assignment helpers
export const assignmentHelpers = {
  // Assign member to hairstylist(s)
  async assignMemberToHairstylists(
    memberId: string,
    hairstylistIds: string[],
    assignedBy: string,
    primaryHairstylistId?: string
  ): Promise<void> {
    // Remove existing assignments
    await supabase
      .from('member_hairstylist_assignments')
      .delete()
      .eq('member_id', memberId);

    // Create new assignments
    const assignments = hairstylistIds.map(hairstylistId => ({
      member_id: memberId,
      hairstylist_id: hairstylistId,
      is_primary: hairstylistId === primaryHairstylistId,
      assigned_by: assignedBy,
    }));

    const { error } = await supabase
      .from('member_hairstylist_assignments')
      .insert(assignments);

    if (error) throw error;
  },

  // Get member assignments
  async getMemberAssignments(memberId: string) {
    const { data, error } = await supabase
      .from('member_hairstylist_assignments')
      .select(`
        *,
        hairstylist:hairstylists(
          *,
          user_profile:user_profiles(*)
        )
      `)
      .eq('member_id', memberId);

    if (error) throw error;
    return data || [];
  },
};

// Storage helpers for photos
export const storageHelpers = {
  // Upload photo to Supabase Storage
  async uploadPhoto(
    file: File,
    bucket: string,
    path: string
  ): Promise<{ path: string; url: string }> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      path: data.path,
      url: publicUrl,
    };
  },

  // Delete photo from storage
  async deletePhoto(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  },
};

// Error handling helper
export const handleSupabaseError = (error: any): string => {
  if (error?.message) {
    // Common Supabase errors
    if (error.message.includes('duplicate key')) {
      return 'This record already exists.';
    }
    if (error.message.includes('violates row-level security')) {
      return 'You do not have permission to perform this action.';
    }
    if (error.message.includes('invalid input syntax')) {
      return 'Invalid data format.';
    }
    return error.message;
  }
  return 'An unexpected error occurred.';
};