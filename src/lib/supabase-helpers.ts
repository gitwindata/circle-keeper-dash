import { supabase, supabaseAdmin } from './supabase';
import { Member, UserProfile, Hairstylist, Visit, UserRole } from '../types';

// Helper to get appropriate client based on user role
const getSupabaseClient = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    // If user is admin and we have service role key, use admin client
    if (profile?.role === 'admin' && supabaseAdmin) {
      console.log('🔑 Using admin client (bypasses RLS)');
      return supabaseAdmin;
    }
  }
  
  console.log('👤 Using regular client (RLS enforced)');
  return supabase;
};

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
    async getAllMembersWithProfiles(): Promise<(Member & { user_profile: UserProfile })[]> {
    console.log('🔍 Debug: Fetching all members with profiles...');
    
    // Get appropriate client (admin client for admin users)
    const client = await getSupabaseClient();
    
    // Check specific member ID and its user_profile
    const testMemberId = 'fe277989-0042-4791-8ed6-4a1f2461e924';
    
    const { data: specificProfile } = await client
      .from('user_profiles')
      .select('*')
      .eq('id', testMemberId);
    
    console.log(`👤 Debug: User profile for member ${testMemberId}:`, JSON.stringify(specificProfile, null, 2));
    
    // Check all user_profiles
    const { data: allProfiles } = await client
      .from('user_profiles')
      .select('*');
    
    console.log('📋 Debug: All user profiles:', JSON.stringify(allProfiles, null, 2));
    
    // Since members.id references user_profiles.id, we join with foreign key
    const { data, error } = await client
      .from('members')
      .select(`
        *,
        user_profile:user_profiles(*)
      `)
      .order('id', { ascending: false });

    console.log('� Debug: Join query data:', JSON.stringify(data, null, 2));
    console.log('❌ Debug: Join query error:', error);

    if (error) {
      console.error('Error fetching members:', error);
      // If the named foreign key doesn't work, try explicit join
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('members')
        .select(`
          *,
          user_profile:user_profiles(*)
        `)
        .eq('user_profiles.id', 'members.id')
        .order('id', { ascending: false });
        
      console.log('🔄 Fallback query data:', fallbackData);
      if (fallbackError) {
        console.error('Fallback query error:', fallbackError);
        throw fallbackError;
      }
      return fallbackData || [];
    }

    // Transform the data - user_profile should be object, not array
    const transformedData = data?.map(member => ({
      ...member,
      user_profile: member.user_profile || null
    })) || [];

    console.log('🔄 Transformed data:', JSON.stringify(transformedData, null, 2));
    return transformedData.filter(item => item.user_profile !== null);
  },

  // Create complete member with auth account
  async createMemberWithAuth(memberData: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    whatsapp_number?: string;
    instagram_handle?: string;
    notes?: string;
    preferred_services?: string[];
  }): Promise<{ member: Member & { user_profile: UserProfile }, tempPassword: string }> {
    try {
      // Step 1: Create auth user
      const tempPassword = memberData.password || `temp${Math.random().toString(36).slice(-8)}`;
      
      let authUser;
      let userId;

      if (supabaseAdmin) {
        // Use admin client to create user directly
        console.log('🔑 Creating user with admin client...');
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: memberData.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: memberData.full_name,
            role: 'member'
          }
        });

        if (error) {
          console.error('Admin user creation error:', error);
          throw new Error(`Failed to create user account: ${error.message}`);
        }

        authUser = data;
        userId = data.user?.id;
      } else {
        // Fallback: Use regular signup (user will need to confirm email)
        console.log('👤 Creating user with regular signup...');
        const { data, error } = await supabase.auth.signUp({
          email: memberData.email,
          password: tempPassword,
          options: {
            data: {
              full_name: memberData.full_name,
              role: 'member'
            }
          }
        });

        if (error) {
          console.error('Regular signup error:', error);
          throw new Error(`Failed to create user account: ${error.message}`);
        }

        authUser = data;
        userId = data.user?.id;
      }

      if (!userId) {
        throw new Error('Failed to create user account - no user ID returned');
      }

      // Get appropriate client for subsequent operations
      const client = await getSupabaseClient();

      // Step 2: Create user profile
      const { data: userProfile, error: profileError } = await client
        .from('user_profiles')
        .insert({
          id: userId,
          email: memberData.email,
          full_name: memberData.full_name,
          phone: memberData.phone,
          whatsapp_number: memberData.whatsapp_number,
          instagram_handle: memberData.instagram_handle,
          role: 'member' as const,
          is_active: true
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Cleanup: delete auth user if profile creation fails
        if (supabaseAdmin) {
          await supabaseAdmin.auth.admin.deleteUser(userId);
        }
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      // Step 3: Create member record
      const { data: member, error: memberError } = await client
        .from('members')
        .insert({
          id: userId,
          notes: memberData.notes,
          preferred_services: memberData.preferred_services || [],
          membership_tier: 'bronze' as const,
          membership_points: 0,
          total_visits: 0,
          total_spent: 0
        })
        .select()
        .single();

      if (memberError) {
        console.error('Member creation error:', memberError);
        // Cleanup: delete auth user and profile if member creation fails
        if (supabaseAdmin) {
          await supabaseAdmin.auth.admin.deleteUser(userId);
        }
        await client.from('user_profiles').delete().eq('id', userId);
        throw new Error(`Failed to create member record: ${memberError.message}`);
      }

      return {
        member: {
          ...member,
          user_profile: userProfile
        },
        tempPassword
      };
    } catch (error) {
      console.error('Complete member creation failed:', error);
      throw error;
    }
  },

  // Create new member (simplified approach)
  async createMember(memberData: {
    full_name: string;
    email: string;
    phone?: string;
    whatsapp_number?: string;
    instagram_handle?: string;
    notes?: string;
    preferred_services?: string[];
  }): Promise<Member & { user_profile: UserProfile }> {
    // Generate UUID for new member
    const memberId = crypto.randomUUID();

    // Create user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: memberId,
        email: memberData.email,
        full_name: memberData.full_name,
        phone: memberData.phone,
        whatsapp_number: memberData.whatsapp_number,
        instagram_handle: memberData.instagram_handle,
        role: 'member' as const,
        is_active: true
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw profileError;
    }

    // Create member record
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        id: memberId,
        notes: memberData.notes,
        preferred_services: memberData.preferred_services || [],
        membership_tier: 'bronze' as const,
        membership_points: 0,
        total_visits: 0,
        total_spent: 0
      })
      .select()
      .single();

    if (memberError) {
      console.error('Member creation error:', memberError);
      throw memberError;
    }

    return {
      ...member,
      user_profile: userProfile
    };
  },

  // Update member and profile
  async updateMember(
    memberId: string,
    updates: {
      full_name?: string;
      phone?: string;
      whatsapp_number?: string;
      instagram_handle?: string;
      notes?: string;
      preferred_services?: string[];
    }
  ): Promise<void> {
    // Update user profile
    const profileUpdates = {
      full_name: updates.full_name,
      phone: updates.phone,
      whatsapp_number: updates.whatsapp_number,
      instagram_handle: updates.instagram_handle
    };

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update(profileUpdates)
      .eq('id', memberId);

    if (profileError) throw profileError;

    // Update member record
    const memberUpdates = {
      notes: updates.notes,
      preferred_services: updates.preferred_services
    };

    const { error: memberError } = await supabase
      .from('members')
      .update(memberUpdates)
      .eq('id', memberId);

    if (memberError) throw memberError;
  },

  // Delete member
  async deleteMember(memberId: string): Promise<void> {
    // Delete member record (this will cascade to user_profiles due to FK)
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  },

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
        whatsapp_number: data.whatsapp_number,
        instagram_handle: data.instagram_handle,
        avatar_url: data.avatar_url,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    };
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
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('hairstylists')
      .select(`
        *,
        user_profile:user_profiles!inner(*)
      `);

    if (error) throw error;
    
    // Sort on the client side to avoid Supabase cross-table sorting issues
    const sortedData = (data || []).sort((a, b) => {
      const nameA = a.user_profile?.full_name || '';
      const nameB = b.user_profile?.full_name || '';
      return nameA.localeCompare(nameB);
    });
    
    return sortedData;
  },

  // Create a new hairstylist with auth user
  async createHairstylistWithAuth(hairstylistData: {
    email: string;
    full_name: string;
    phone: string;
    specialties: string[];
    experience_years: number;
    schedule_notes?: string;
    status: 'active' | 'inactive';
  }) {
    try {
      const adminClient = await getSupabaseClient();
      
      // Create auth user
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email: hairstylistData.email,
        email_confirm: true,
        user_metadata: {
          full_name: hairstylistData.full_name,
          phone: hairstylistData.phone,
          role: 'hairstylist'
        }
      });

      if (authError) throw authError;
      
      // Create user profile
      const { data: userProfile, error: profileError } = await adminClient
        .from('user_profiles')
        .insert({
          id: authUser.user.id,
          email: hairstylistData.email,
          full_name: hairstylistData.full_name,
          phone: hairstylistData.phone,
          role: 'hairstylist',
          is_active: hairstylistData.status === 'active'
        })
        .select()
        .single();

      if (profileError) {
        // Cleanup auth user on profile creation failure
        await adminClient.auth.admin.deleteUser(authUser.user.id);
        throw profileError;
      }

      // Create hairstylist record
      const { data: hairstylist, error: hairstylistError } = await adminClient
        .from('hairstylists')
        .insert({
          id: authUser.user.id,
          specialties: hairstylistData.specialties,
          experience_years: hairstylistData.experience_years,
          schedule_notes: hairstylistData.schedule_notes || '',
          commission_rate: 50.0 // Default commission rate
        })
        .select()
        .single();

      if (hairstylistError) {
        // Cleanup auth user and profile on hairstylist creation failure
        await adminClient
          .from('user_profiles')
          .delete()
          .eq('id', authUser.user.id);
        await adminClient.auth.admin.deleteUser(authUser.user.id);
        throw hairstylistError;
      }

      return {
        ...hairstylist,
        user_profile: userProfile
      };
    } catch (error) {
      console.error('Error creating hairstylist with auth:', error);
      throw error;
    }
  },

  // Update hairstylist
  async updateHairstylist(id: string, updateData: {
    full_name?: string;
    phone?: string;
    specialties?: string[];
    experience_years?: number;
    schedule_notes?: string;
    status?: 'active' | 'inactive';
  }) {
    const client = await getSupabaseClient();
    
    // Update user profile if profile data is provided
    if (updateData.full_name || updateData.phone || updateData.status !== undefined) {
      const profileUpdate: Record<string, unknown> = {};
      if (updateData.full_name) profileUpdate.full_name = updateData.full_name;
      if (updateData.phone) profileUpdate.phone = updateData.phone;
      if (updateData.status !== undefined) profileUpdate.is_active = updateData.status === 'active';

      const { error: profileError } = await client
        .from('user_profiles')
        .update(profileUpdate)
        .eq('id', id);

      if (profileError) throw profileError;
    }

    // Update hairstylist record
    const hairstylistUpdate: Record<string, unknown> = {};
    if (updateData.specialties) hairstylistUpdate.specialties = updateData.specialties;
    if (updateData.experience_years !== undefined) hairstylistUpdate.experience_years = updateData.experience_years;
    if (updateData.schedule_notes !== undefined) hairstylistUpdate.schedule_notes = updateData.schedule_notes;

    const { data, error } = await client
      .from('hairstylists')
      .update(hairstylistUpdate)
      .eq('id', id)
      .select(`
        *,
        user_profile:user_profiles(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Deactivate hairstylist (soft delete)
  async deactivateHairstylist(id: string) {
    const client = await getSupabaseClient();
    
    // Update both user profile and hairstylist status
    const { error: profileError } = await client
      .from('user_profiles')
      .update({ is_active: false })
      .eq('id', id);

    if (profileError) throw profileError;

    const { error: hairstylistError } = await client
      .from('hairstylists')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (hairstylistError) throw hairstylistError;
  },

  // Activate hairstylist
  async activateHairstylist(id: string) {
    const client = await getSupabaseClient();
    
    // Update both user profile and hairstylist status
    const { error: profileError } = await client
      .from('user_profiles')
      .update({ is_active: true })
      .eq('id', id);

    if (profileError) throw profileError;

    const { error: hairstylistError } = await client
      .from('hairstylists')
      .update({ status: 'active' })
      .eq('id', id);

    if (hairstylistError) throw hairstylistError;
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