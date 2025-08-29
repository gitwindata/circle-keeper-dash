// Data Utility Functions for HMS
// Common utility functions for data formatting, manipulation, and calculations

import { format, parseISO, isValid, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  User,
  Service,
  Appointment,
  BusinessMetrics,
  AppointmentStatus,
  ServiceCategory,
  HairstylistProfile,
  MemberProfile
} from '../types';

// =================== DATE UTILITIES ===================

export const formatDate = (date: Date | string, formatString: string = 'dd MMM yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid Date';
    return format(dateObj, formatString, { locale: localeId });
  } catch (error) {
    return 'Invalid Date';
  }
};

export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, 'dd MMM yyyy, HH:mm');
};

export const formatTime = (date: Date | string): string => {
  return formatDate(date, 'HH:mm');
};

export const formatDateForInput = (date: Date | string): string => {
  return formatDate(date, 'yyyy-MM-dd');
};

export const isToday = (date: Date | string): boolean => {
  const today = new Date();
  const checkDate = typeof date === 'string' ? parseISO(date) : date;
  return formatDate(today, 'yyyy-MM-dd') === formatDate(checkDate, 'yyyy-MM-dd');
};

export const daysBetween = (startDate: Date | string, endDate: Date | string): number => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  return differenceInDays(end, start);
};

export const getMonthRange = (date: Date = new Date()) => {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date)
  };
};

// =================== CURRENCY UTILITIES ===================

export const formatCurrency = (amount: number, options?: {
  showSymbol?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string => {
  const {
    showSymbol = true,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
  } = options || {};

  const formatter = new Intl.NumberFormat('id-ID', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'IDR',
    minimumFractionDigits,
    maximumFractionDigits
  });

  return formatter.format(amount);
};

export const parseCurrency = (currencyString: string): number => {
  // Remove all non-numeric characters except decimal point
  const numericString = currencyString.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(numericString);
  return isNaN(parsed) ? 0 : parsed;
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100; // Round to 2 decimal places
};

export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(1)}%`;
};

// =================== STRING UTILITIES ===================

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str: string): string => {
  return str.split(' ').map(capitalizeFirst).join(' ');
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format Indonesian phone number
  if (cleaned.startsWith('62')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+62${cleaned.substring(1)}`;
  } else {
    return `+62${cleaned}`;
  }
};

export const validateInstagramHandle = (handle: string): boolean => {
  if (!handle) return true; // Optional field
  return /^@[a-zA-Z0-9._]+$/.test(handle);
};

// =================== ARRAY UTILITIES ===================

export const groupBy = <T, K extends keyof any>(
  array: T[],
  getKey: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const key = getKey(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

export const sortBy = <T>(
  array: T[],
  getKey: (item: T) => string | number | Date,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aKey = getKey(a);
    const bKey = getKey(b);
    
    if (aKey < bKey) return order === 'asc' ? -1 : 1;
    if (aKey > bKey) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const uniqueBy = <T, K>(array: T[], getKey: (item: T) => K): T[] => {
  const seen = new Set<K>();
  return array.filter(item => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// =================== DATA CALCULATION UTILITIES ===================

export const calculateAppointmentDuration = (serviceIds: string[], services: Service[]): number => {
  return serviceIds.reduce((total, serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return total + (service?.duration || 0);
  }, 0);
};

export const calculateAppointmentPrice = (serviceIds: string[], services: Service[]): number => {
  return serviceIds.reduce((total, serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return total + (service?.basePrice || 0);
  }, 0);
};

export const calculateHairstylistStats = (
  hairstylistId: string,
  appointments: Appointment[],
  users: User[]
): {
  totalAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  averageRating: number;
  uniqueClients: number;
  thisMonthAppointments: number;
} => {
  const hairstylistAppointments = appointments.filter(a => a.hairstylistId === hairstylistId);
  const completedAppointments = hairstylistAppointments.filter(a => a.status === 'completed');
  
  const thisMonth = getMonthRange();
  const thisMonthAppointments = hairstylistAppointments.filter(a => {
    const appointmentDate = new Date(a.scheduledDate);
    return appointmentDate >= thisMonth.start && appointmentDate <= thisMonth.end;
  });

  const totalRevenue = completedAppointments.reduce((sum, a) => sum + a.totalPrice, 0);
  const ratingsSum = completedAppointments.reduce((sum, a) => sum + (a.rating || 0), 0);
  const ratedAppointments = completedAppointments.filter(a => a.rating).length;
  const averageRating = ratedAppointments > 0 ? ratingsSum / ratedAppointments : 0;
  
  const uniqueClients = new Set(hairstylistAppointments.map(a => a.memberId)).size;

  return {
    totalAppointments: hairstylistAppointments.length,
    completedAppointments: completedAppointments.length,
    totalRevenue,
    averageRating: Math.round(averageRating * 10) / 10,
    uniqueClients,
    thisMonthAppointments: thisMonthAppointments.length
  };
};

export const calculateMemberStats = (
  memberId: string,
  appointments: Appointment[]
): {
  totalAppointments: number;
  completedAppointments: number;
  totalSpent: number;
  averageRating: number;
  lastAppointmentDate: Date | null;
  favoriteServices: string[];
} => {
  const memberAppointments = appointments.filter(a => a.memberId === memberId);
  const completedAppointments = memberAppointments.filter(a => a.status === 'completed');
  
  const totalSpent = completedAppointments.reduce((sum, a) => sum + a.totalPrice, 0);
  const ratingsSum = completedAppointments.reduce((sum, a) => sum + (a.rating || 0), 0);
  const ratedAppointments = completedAppointments.filter(a => a.rating).length;
  const averageRating = ratedAppointments > 0 ? ratingsSum / ratedAppointments : 0;
  
  const lastAppointment = memberAppointments
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())[0];
  
  // Calculate favorite services
  const serviceCount: Record<string, number> = {};
  completedAppointments.forEach(a => {
    a.serviceIds.forEach(serviceId => {
      serviceCount[serviceId] = (serviceCount[serviceId] || 0) + 1;
    });
  });
  
  const favoriteServices = Object.entries(serviceCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([serviceId]) => serviceId);

  return {
    totalAppointments: memberAppointments.length,
    completedAppointments: completedAppointments.length,
    totalSpent,
    averageRating: Math.round(averageRating * 10) / 10,
    lastAppointmentDate: lastAppointment ? new Date(lastAppointment.scheduledDate) : null,
    favoriteServices
  };
};

export const calculateBusinessMetrics = (
  appointments: Appointment[],
  users: User[],
  services: Service[],
  dateRange?: { start: Date; end: Date }
): BusinessMetrics => {
  let filteredAppointments = appointments;
  
  if (dateRange) {
    filteredAppointments = appointments.filter(a => {
      const appointmentDate = new Date(a.scheduledDate);
      return appointmentDate >= dateRange.start && appointmentDate <= dateRange.end;
    });
  }

  const completedAppointments = filteredAppointments.filter(a => a.status === 'completed');
  const totalRevenue = completedAppointments.reduce((sum, a) => sum + a.totalPrice, 0);
  
  const members = users.filter(u => u.role === 'member');
  const hairstylists = users.filter(u => u.role === 'hairstylist');
  
  const activeMembers = members.filter(m => {
    return filteredAppointments.some(a => a.memberId === m.id);
  });

  return {
    revenue: {
      total: totalRevenue,
      byService: {},
      byHairstylist: {},
      byMonth: {},
      growth: 0
    },
    appointments: {
      total: filteredAppointments.length,
      completed: completedAppointments.length,
      cancelled: filteredAppointments.filter(a => a.status === 'cancelled').length,
      noShow: filteredAppointments.filter(a => a.status === 'no_show').length,
      averageDuration: 0,
      completionRate: filteredAppointments.length > 0 ? 
        (completedAppointments.length / filteredAppointments.length) * 100 : 0
    },
    members: {
      total: members.length,
      active: activeMembers.length,
      new: 0,
      returning: 0,
      retentionRate: 0
    },
    hairstylists: {
      total: hairstylists.length,
      active: hairstylists.filter(h => h.isActive).length,
      averageRating: 0,
      topPerformer: '',
      efficiency: {}
    },
    services: {
      total: services.length,
      popular: [],
      revenue: {},
      bookingFrequency: {}
    },
    period: dateRange || { start: new Date(), end: new Date() }
  };
};

// =================== STATUS UTILITIES ===================

export const getStatusColor = (status: AppointmentStatus): string => {
  const colors: Record<AppointmentStatus, string> = {
    scheduled: 'text-blue-600 bg-blue-50',
    confirmed: 'text-green-600 bg-green-50',
    in_progress: 'text-orange-600 bg-orange-50',
    completed: 'text-green-600 bg-green-50',
    cancelled: 'text-red-600 bg-red-50',
    no_show: 'text-gray-600 bg-gray-50'
  };
  return colors[status] || 'text-gray-600 bg-gray-50';
};

export const getStatusLabel = (status: AppointmentStatus): string => {
  const labels: Record<AppointmentStatus, string> = {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show'
  };
  return labels[status] || status;
};

export const getCategoryColor = (category: ServiceCategory): string => {
  const colors: Record<ServiceCategory, string> = {
    haircut: 'text-blue-600 bg-blue-50',
    styling: 'text-purple-600 bg-purple-50',
    treatment: 'text-green-600 bg-green-50',
    coloring: 'text-pink-600 bg-pink-50',
    beard: 'text-orange-600 bg-orange-50',
    wash: 'text-cyan-600 bg-cyan-50'
  };
  return colors[category] || 'text-gray-600 bg-gray-50';
};

// =================== SEARCH AND FILTER UTILITIES ===================

export const searchItems = <T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
): T[] => {
  if (!searchTerm.trim()) return items;
  
  const lowercaseSearch = searchTerm.toLowerCase();
  
  return items.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowercaseSearch);
      }
      if (Array.isArray(value)) {
        return value.some(v => 
          typeof v === 'string' && v.toLowerCase().includes(lowercaseSearch)
        );
      }
      return false;
    });
  });
};

export const filterByDateRange = <T>(
  items: T[],
  dateField: keyof T,
  dateRange: { start: Date; end: Date }
): T[] => {
  return items.filter(item => {
    const itemDate = new Date(item[dateField] as any);
    return itemDate >= dateRange.start && itemDate <= dateRange.end;
  });
};

// =================== EXPORT UTILITIES ===================

export const exportToCSV = (data: any[], filename: string): void => {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// =================== INITIALIZATION UTILITIES ===================

export const initializeUserProfile = (role: User['role']): User['profile'] => {
  switch (role) {
    case 'admin':
      return {
        fullName: '',
        permissions: []
      };
    case 'hairstylist':
      return {
        fullName: '',
        phone: '',
        specialties: [],
        experience: 0,
        joinDate: formatDateForInput(new Date()),
        address: '',
        schedule: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: []
        },
        stats: {
          totalClients: 0,
          monthlyClients: 0,
          totalRevenue: 0,
          averageRating: 0,
          totalAppointments: 0
        }
      };
    case 'member':
      return {
        fullName: '',
        whatsappNumber: '',
        joinDate: formatDateForInput(new Date()),
        preferences: {
          preferredServices: [],
          notes: ''
        },
        photos: {
          beforePhotos: [],
          afterPhotos: []
        }
      };
    default:
      return {} as any;
  }
};