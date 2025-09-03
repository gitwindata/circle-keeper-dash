// Centralized Type Definitions for Circle Keeper Dashboard
// Enhanced for Supabase integration and comprehensive feature set

// =================== DATABASE TYPES ===================

export type UserRole = 'admin' | 'hairstylist' | 'member';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type MembershipTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type ServiceCategory = 'haircut' | 'styling' | 'treatment' | 'coloring' | 'beard' | 'wash' | 'combo';
export type PhotoType = 'before' | 'after' | 'profile';
export type ReviewType = 'service' | 'hairstylist' | 'barbershop';

// =================== USER MANAGEMENT ===================

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  whatsapp_number?: string;
  instagram_handle?: string;
  address?: string;
  avatar_url?: string;
  bio?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Hairstylist {
  id: string;
  user_profile?: UserProfile;
  specialties: string[];
  experience_years: number;
  join_date: string;
  total_clients: number;
  monthly_clients: number;
  total_revenue: number;
  average_rating: number;
  schedule_notes?: string;
  commission_rate: number;
}

export interface Member {
  id: string;
  user_profile?: UserProfile;
  membership_tier: MembershipTier;
  membership_points: number;
  total_visits: number;
  total_spent: number;
  join_date: string;
  last_visit_date?: string;
  preferred_services: string[];
  notes?: string;
  referral_code?: string;
  referred_by?: string;
  birthday?: string;
  // Computed fields
  assignedHairstylists?: Hairstylist[];
  recentVisits?: Visit[];
}

// Legacy compatibility types
export interface AdminProfile {
  fullName: string;
  permissions: Permission[];
}

export interface HairstylistProfile {
  fullName: string;
  phone: string;
  specialties: string[];
  experience: number;
  joinDate: string;
  address: string;
  avatar?: string;
  bio?: string;
  schedule: WorkingSchedule;
  stats: HairstylistStats;
}

export interface MemberProfile {
  fullName: string;
  whatsappNumber: string;
  instagramHandle?: string;
  joinDate: string;
  preferences: MemberPreferences;
  photos: MemberPhotos;
  // New fields for membership system
  membershipTier?: MembershipTier;
  membershipPoints?: number;
  totalVisits?: number;
  totalSpent?: number;
  assignedHairstylists?: string[];
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface WorkingSchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  start: string; // "09:00"
  end: string;   // "17:00"
  isAvailable: boolean;
}

export interface HairstylistStats {
  totalClients: number;
  monthlyClients: number;
  totalRevenue: number;
  averageRating: number;
  totalAppointments: number;
}

export interface MemberPreferences {
  preferredHairstylist?: string;
  preferredServices: string[];
  notes?: string;
}

export interface MemberPhotos {
  beforePhotos: string[];
  afterPhotos: string[];
}

// =================== SERVICE MANAGEMENT ===================

export interface Service {
  id: string;
  name: string;
  description?: string;
  category: ServiceCategory;
  base_price: number;
  duration_minutes: number;
  is_active: boolean;
  requires_consultation: boolean;
  created_at: string;
  updated_at: string;
}

// Hardcoded services array for the application
export const AVAILABLE_SERVICES: Omit<Service, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Haircut',
    category: 'haircut',
    base_price: 150000,
    duration_minutes: 45,
    description: 'Classic men\'s haircut with styling',
    is_active: true,
    requires_consultation: false
  },
  {
    name: 'Root Lift',
    category: 'styling',
    base_price: 200000,
    duration_minutes: 60,
    description: 'Root lifting treatment for volume',
    is_active: true,
    requires_consultation: false
  },
  {
    name: 'Down Perm',
    category: 'treatment',
    base_price: 350000,
    duration_minutes: 120,
    description: 'Permanent wave treatment - downward style',
    is_active: true,
    requires_consultation: true
  },
  {
    name: 'Design Perm',
    category: 'treatment',
    base_price: 400000,
    duration_minutes: 150,
    description: 'Custom design permanent wave treatment',
    is_active: true,
    requires_consultation: true
  },
  {
    name: 'Keratin Smooth',
    category: 'treatment',
    base_price: 500000,
    duration_minutes: 180,
    description: 'Keratin smoothing treatment',
    is_active: true,
    requires_consultation: true
  },
  {
    name: 'Hair Repair',
    category: 'treatment',
    base_price: 300000,
    duration_minutes: 90,
    description: 'Deep hair repair and conditioning treatment',
    is_active: true,
    requires_consultation: false
  },
  {
    name: 'Home Service (JABODETABEK)',
    category: 'haircut',
    base_price: 250000,
    duration_minutes: 60,
    description: 'Haircut service at your location in JABODETABEK area',
    is_active: true,
    requires_consultation: false
  },
  {
    name: 'Haircut + Root Lift',
    category: 'combo',
    base_price: 320000,
    duration_minutes: 105,
    description: 'Combination of haircut and root lift',
    is_active: true,
    requires_consultation: false
  },
  {
    name: 'Haircut + Down Perm',
    category: 'combo',
    base_price: 450000,
    duration_minutes: 165,
    description: 'Combination of haircut and down perm',
    is_active: true,
    requires_consultation: true
  },
  {
    name: 'Haircut + Down Perm + Root Lift',
    category: 'combo',
    base_price: 600000,
    duration_minutes: 225,
    description: 'Complete styling package with haircut, down perm, and root lift',
    is_active: true,
    requires_consultation: true
  },
  {
    name: 'Haircut + Design Perm',
    category: 'combo',
    base_price: 500000,
    duration_minutes: 195,
    description: 'Combination of haircut and design perm',
    is_active: true,
    requires_consultation: true
  },
  {
    name: 'Haircut + Keratin Smooth',
    category: 'combo',
    base_price: 600000,
    duration_minutes: 225,
    description: 'Combination of haircut and keratin smooth treatment',
    is_active: true,
    requires_consultation: true
  },
  {
    name: 'Haircut + Hair Repair',
    category: 'combo',
    base_price: 420000,
    duration_minutes: 135,
    description: 'Combination of haircut and hair repair treatment',
    is_active: true,
    requires_consultation: false
  }
];

// =================== MEMBERSHIP SYSTEM ===================

export interface MembershipLevel {
  tier: MembershipTier;
  name: string;
  color: string;
  icon: string;
  minVisits: number;
  minSpending: number;
  benefits: string[];
  discountPercentage: number;
}

export const MEMBERSHIP_LEVELS: MembershipLevel[] = [
  {
    tier: 'bronze',
    name: 'Bronze Member',
    color: '#CD7F32',
    icon: '🥉',
    minVisits: 0,
    minSpending: 0,
    benefits: ['Basic membership', 'Visit tracking'],
    discountPercentage: 0
  },
  {
    tier: 'silver',
    name: 'Silver Member',
    color: '#C0C0C0',
    icon: '🥈',
    minVisits: 10,
    minSpending: 1000000,
    benefits: ['5% discount', 'Priority booking', 'Birthday special'],
    discountPercentage: 5
  },
  {
    tier: 'gold',
    name: 'Gold Member',
    color: '#FFD700',
    icon: '🥇',
    minVisits: 20,
    minSpending: 2500000,
    benefits: ['10% discount', 'Complimentary consultation', 'Exclusive events'],
    discountPercentage: 10
  },
  {
    tier: 'platinum',
    name: 'Platinum Member',
    color: '#E5E4E2',
    icon: '💎',
    minVisits: 30,
    minSpending: 5000000,
    benefits: ['15% discount', 'Personal hairstylist', 'Free home service'],
    discountPercentage: 15
  },
  {
    tier: 'diamond',
    name: 'Diamond Member',
    color: '#B9F2FF',
    icon: '💍',
    minVisits: 50,
    minSpending: 10000000,
    benefits: ['20% discount', 'VIP treatment', 'Unlimited consultations', 'Referral rewards'],
    discountPercentage: 20
  }
];

export interface ServicePricing {
  serviceId: string;
  hairstylistId?: string; // Optional: different pricing per hairstylist
  price: number;
  discountPercentage?: number;
  validFrom: Date;
  validTo?: Date;
}

// =================== VISIT/APPOINTMENT MANAGEMENT ===================

export interface Visit {
  id: string;
  member_id: string;
  hairstylist_id: string;
  visit_date: string;
  status: AppointmentStatus;
  total_duration?: number;
  total_price: number;
  discount_percentage: number;
  final_price: number;
  hairstylist_notes?: string;
  created_at: string;
  updated_at: string;
  // Related data
  member?: Member;
  hairstylist?: Hairstylist;
  services?: VisitService[];
  photos?: VisitPhoto[];
  reviews?: Review[];
}

export interface VisitService {
  id: string;
  visit_id: string;
  service_id: string;
  price: number;
  duration_minutes: number;
  notes?: string;
  service?: Service;
}

export interface VisitPhoto {
  id: string;
  visit_id: string;
  photo_type: PhotoType;
  file_path: string;
  file_url: string;
  description?: string;
  uploaded_by: string;
  is_public: boolean;
  created_at: string;
}

export interface MemberHairstylistAssignment {
  id: string;
  member_id: string;
  hairstylist_id: string;
  is_primary: boolean;
  assigned_at: string;
  assigned_by: string;
  notes?: string;
  member?: Member;
  hairstylist?: Hairstylist;
}

export interface PersonalNote {
  id: string;
  hairstylist_id: string;
  member_id: string;
  note: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  member?: Member;
}

export interface Review {
  id: string;
  visit_id: string;
  member_id: string;
  review_type: ReviewType;
  target_id?: string; // service_id, hairstylist_id, or null for barbershop
  rating: number; // 1-5
  comment?: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  member?: Member;
  visit?: Visit;
  target_service?: Service;
  target_hairstylist?: Hairstylist;
}

export interface MembershipLevelHistory {
  id: string;
  member_id: string;
  previous_tier?: MembershipTier;
  new_tier: MembershipTier;
  points_earned: number;
  reason?: string;
  achieved_at: string;
}

// =================== BUSINESS ANALYTICS ===================

export interface BusinessMetrics {
  revenue: RevenueMetrics;
  visits: VisitMetrics;
  members: MemberMetrics;
  hairstylists: HairstylistMetrics;
  services: ServiceMetrics;
  membership: MembershipMetrics;
  period: DateRange;
}

export interface RevenueMetrics {
  total: number;
  byService: Record<string, number>;
  byHairstylist: Record<string, number>;
  byMonth: Record<string, number>;
  byMembershipTier: Record<MembershipTier, number>;
  growth: number; // percentage
  averageVisitValue: number;
}

export interface VisitMetrics {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  averageDuration: number;
  completionRate: number;
  repeatCustomerRate: number;
}

export interface MemberMetrics {
  total: number;
  active: number;
  new: number;
  returning: number;
  retentionRate: number;
  byTier: Record<MembershipTier, number>;
  averageLifetimeValue: number;
}

export interface HairstylistMetrics {
  total: number;
  active: number;
  averageRating: number;
  topPerformer: string;
  efficiency: Record<string, number>;
  clientRetention: Record<string, number>;
}

export interface ServiceMetrics {
  total: number;
  popular: string[];
  revenue: Record<string, number>;
  bookingFrequency: Record<string, number>;
  averageRating: Record<string, number>;
}

export interface MembershipMetrics {
  totalMembers: number;
  tierDistribution: Record<MembershipTier, number>;
  tierProgression: Record<string, MembershipTier>;
  pointsDistributed: number;
  upgradeRate: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// =================== FORM DATA TYPES ===================

export interface VisitFormData {
  member_id: string;
  hairstylist_id: string;
  service_ids: string[];
  visit_date: string;
  hairstylist_notes?: string;
  discount_percentage?: number;
  before_photos?: File[];
  after_photos?: File[];
}

export interface MemberFormData {
  full_name: string;
  whatsapp_number: string;
  instagram_handle?: string;
  birthday?: string;
  preferred_services?: string[];
  notes?: string;
  assigned_hairstylists?: string[];
}

export interface HairstylistFormData {
  full_name: string;
  email: string;
  phone: string;
  whatsapp_number?: string;
  specialties: string[];
  experience_years: number;
  address: string;
  bio?: string;
  commission_rate?: number;
}

export interface PersonalNoteFormData {
  member_id: string;
  note: string;
  is_private: boolean;
}

export interface ReviewFormData {
  visit_id: string;
  review_type: ReviewType;
  target_id?: string;
  rating: number;
  comment?: string;
  is_anonymous: boolean;
}

export interface MemberAssignmentFormData {
  member_id: string;
  hairstylist_ids: string[];
  primary_hairstylist_id?: string;
  notes?: string;
}

// =================== API RESPONSE TYPES ===================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterOptions {
  search?: string;
  dateRange?: DateRange;
  status?: string[];
  hairstylistIds?: string[];
  serviceIds?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// =================== UTILITY TYPES ===================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

// =================== LEGACY COMPATIBILITY ===================
// These types maintain compatibility with existing code

export interface LegacyMember {
  id: string;
  fullName: string;
  whatsapp: string;
  instagram: string;
  lastVisit: string;
  stylist: string;
  service: string;
  stylistComment: string;
  memberComment: string;
  status: "active" | "inactive";
}

export interface LegacyHairstylist {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  specialties: string[];
  experience: number;
  joinDate: string;
  address: string;
  status: "active" | "inactive";
  avatar: string;
  totalClients: number;
  monthlyClients: number;
  rating: number;
  bio: string;
}

export interface LegacyMemberVisit {
  id: string;
  memberName: string;
  memberPhone: string;
  memberInstagram: string;
  hairstylist: string;
  service: string;
  visitDate: string;
  duration: number;
  price: number;
  rating: number;
  notes: string;
  totalVisits: number;
}