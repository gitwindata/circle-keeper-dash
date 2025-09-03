import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Complete database types based on our schema
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'hairstylist' | 'member'
          full_name: string
          phone: string | null
          whatsapp_number: string | null
          instagram_handle: string | null
          address: string | null
          avatar_url: string | null
          bio: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: 'admin' | 'hairstylist' | 'member'
          full_name: string
          phone?: string | null
          whatsapp_number?: string | null
          instagram_handle?: string | null
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'hairstylist' | 'member'
          full_name?: string
          phone?: string | null
          whatsapp_number?: string | null
          instagram_handle?: string | null
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      hairstylists: {
        Row: {
          id: string
          specialties: string[]
          experience_years: number
          join_date: string
          total_clients: number
          monthly_clients: number
          total_revenue: number
          average_rating: number
          schedule_notes: string | null
          commission_rate: number
        }
        Insert: {
          id: string
          specialties?: string[]
          experience_years?: number
          join_date?: string
          total_clients?: number
          monthly_clients?: number
          total_revenue?: number
          average_rating?: number
          schedule_notes?: string | null
          commission_rate?: number
        }
        Update: {
          id?: string
          specialties?: string[]
          experience_years?: number
          join_date?: string
          total_clients?: number
          monthly_clients?: number
          total_revenue?: number
          average_rating?: number
          schedule_notes?: string | null
          commission_rate?: number
        }
      }
      members: {
        Row: {
          id: string
          membership_tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
          membership_points: number
          total_visits: number
          total_spent: number
          join_date: string
          last_visit_date: string | null
          preferred_services: string[]
          notes: string | null
          referral_code: string | null
          referred_by: string | null
          birthday: string | null
        }
        Insert: {
          id: string
          membership_tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
          membership_points?: number
          total_visits?: number
          total_spent?: number
          join_date?: string
          last_visit_date?: string | null
          preferred_services?: string[]
          notes?: string | null
          referral_code?: string | null
          referred_by?: string | null
          birthday?: string | null
        }
        Update: {
          id?: string
          membership_tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
          membership_points?: number
          total_visits?: number
          total_spent?: number
          join_date?: string
          last_visit_date?: string | null
          preferred_services?: string[]
          notes?: string | null
          referral_code?: string | null
          referred_by?: string | null
          birthday?: string | null
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          category: 'haircut' | 'styling' | 'treatment' | 'coloring' | 'beard' | 'wash' | 'combo'
          base_price: number
          duration_minutes: number
          is_active: boolean
          requires_consultation: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: 'haircut' | 'styling' | 'treatment' | 'coloring' | 'beard' | 'wash' | 'combo'
          base_price: number
          duration_minutes: number
          is_active?: boolean
          requires_consultation?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: 'haircut' | 'styling' | 'treatment' | 'coloring' | 'beard' | 'wash' | 'combo'
          base_price?: number
          duration_minutes?: number
          is_active?: boolean
          requires_consultation?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      visits: {
        Row: {
          id: string
          member_id: string
          hairstylist_id: string
          visit_date: string
          status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          total_duration: number | null
          total_price: number
          discount_percentage: number
          final_price: number
          hairstylist_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          hairstylist_id: string
          visit_date?: string
          status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          total_duration?: number | null
          total_price: number
          discount_percentage?: number
          final_price: number
          hairstylist_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          hairstylist_id?: string
          visit_date?: string
          status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          total_duration?: number | null
          total_price?: number
          discount_percentage?: number
          final_price?: number
          hairstylist_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      visit_services: {
        Row: {
          id: string
          visit_id: string
          service_id: string
          price: number
          duration_minutes: number
          notes: string | null
        }
        Insert: {
          id?: string
          visit_id: string
          service_id: string
          price: number
          duration_minutes: number
          notes?: string | null
        }
        Update: {
          id?: string
          visit_id?: string
          service_id?: string
          price?: number
          duration_minutes?: number
          notes?: string | null
        }
      }
      visit_photos: {
        Row: {
          id: string
          visit_id: string
          photo_type: 'before' | 'after' | 'profile'
          file_path: string
          file_url: string
          description: string | null
          uploaded_by: string
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          visit_id: string
          photo_type: 'before' | 'after' | 'profile'
          file_path: string
          file_url: string
          description?: string | null
          uploaded_by: string
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          visit_id?: string
          photo_type?: 'before' | 'after' | 'profile'
          file_path?: string
          file_url?: string
          description?: string | null
          uploaded_by?: string
          is_public?: boolean
          created_at?: string
        }
      }
      member_hairstylist_assignments: {
        Row: {
          id: string
          member_id: string
          hairstylist_id: string
          is_primary: boolean
          assigned_at: string
          assigned_by: string
          notes: string | null
        }
        Insert: {
          id?: string
          member_id: string
          hairstylist_id: string
          is_primary?: boolean
          assigned_at?: string
          assigned_by: string
          notes?: string | null
        }
        Update: {
          id?: string
          member_id?: string
          hairstylist_id?: string
          is_primary?: boolean
          assigned_at?: string
          assigned_by?: string
          notes?: string | null
        }
      }
      personal_notes: {
        Row: {
          id: string
          hairstylist_id: string
          member_id: string
          note: string
          is_private: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hairstylist_id: string
          member_id: string
          note: string
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hairstylist_id?: string
          member_id?: string
          note?: string
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          visit_id: string
          member_id: string
          review_type: 'service' | 'hairstylist' | 'barbershop'
          target_id: string | null
          rating: number
          comment: string | null
          is_anonymous: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          visit_id: string
          member_id: string
          review_type: 'service' | 'hairstylist' | 'barbershop'
          target_id?: string | null
          rating: number
          comment?: string | null
          is_anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          visit_id?: string
          member_id?: string
          review_type?: 'service' | 'hairstylist' | 'barbershop'
          target_id?: string | null
          rating?: number
          comment?: string | null
          is_anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      membership_level_history: {
        Row: {
          id: string
          member_id: string
          previous_tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | null
          new_tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
          points_earned: number
          reason: string | null
          achieved_at: string
        }
        Insert: {
          id?: string
          member_id: string
          previous_tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | null
          new_tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
          points_earned?: number
          reason?: string | null
          achieved_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          previous_tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | null
          new_tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
          points_earned?: number
          reason?: string | null
          achieved_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_user_profile_role: {
        Args: {
          target_user_id: string
          new_role: 'admin' | 'hairstylist' | 'member'
          full_name: string
        }
        Returns: void
      }
    }
    Enums: {
      user_role: 'admin' | 'hairstylist' | 'member'
      appointment_status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
      membership_tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
      service_category: 'haircut' | 'styling' | 'treatment' | 'coloring' | 'beard' | 'wash' | 'combo'
      photo_type: 'before' | 'after' | 'profile'
      review_type: 'service' | 'hairstylist' | 'barbershop'
    }
  }
}