// Centralized Type Definitions for HMS
// This file contains all core data structures for better organization and type safety

// =================== USER MANAGEMENT ===================

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'hairstylist' | 'member';
  profile: AdminProfile | HairstylistProfile | MemberProfile;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

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
  duration: number; // minutes
  basePrice: number;
  category: ServiceCategory;
  isActive: boolean;
  requirements?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceCategory = 'haircut' | 'styling' | 'treatment' | 'coloring' | 'beard' | 'wash';

export interface ServicePricing {
  serviceId: string;
  hairstylistId?: string; // Optional: different pricing per hairstylist
  price: number;
  discountPercentage?: number;
  validFrom: Date;
  validTo?: Date;
}

// =================== APPOINTMENT MANAGEMENT ===================

export interface Appointment {
  id: string;
  memberId: string;
  hairstylistId: string;
  serviceIds: string[];
  scheduledDate: Date;
  status: AppointmentStatus;
  duration: number; // calculated from services
  totalPrice: number;
  notes?: string;
  rating?: number;
  beforePhotos?: string[];
  afterPhotos?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface AppointmentHistory {
  appointmentId: string;
  status: AppointmentStatus;
  changedAt: Date;
  changedBy: string;
  reason?: string;
}

// =================== BUSINESS ANALYTICS ===================

export interface BusinessMetrics {
  revenue: RevenueMetrics;
  appointments: AppointmentMetrics;
  members: MemberMetrics;
  hairstylists: HairstylistMetrics;
  services: ServiceMetrics;
  period: DateRange;
}

export interface RevenueMetrics {
  total: number;
  byService: Record<string, number>;
  byHairstylist: Record<string, number>;
  byMonth: Record<string, number>;
  growth: number; // percentage
}

export interface AppointmentMetrics {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  averageDuration: number;
  completionRate: number;
}

export interface MemberMetrics {
  total: number;
  active: number;
  new: number;
  returning: number;
  retentionRate: number;
}

export interface HairstylistMetrics {
  total: number;
  active: number;
  averageRating: number;
  topPerformer: string;
  efficiency: Record<string, number>;
}

export interface ServiceMetrics {
  total: number;
  popular: string[];
  revenue: Record<string, number>;
  bookingFrequency: Record<string, number>;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// =================== FORM DATA TYPES ===================

export interface MemberFormData {
  fullName: string;
  whatsappNumber: string;
  instagramHandle?: string;
  preferredHairstylist?: string;
  notes?: string;
}

export interface HairstylistFormData {
  fullName: string;
  email: string;
  phone: string;
  specialties: string;
  experience: number;
  address: string;
  bio?: string;
}

export interface AppointmentFormData {
  memberId: string;
  hairstylistId: string;
  serviceIds: string[];
  scheduledDate: Date;
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