// Validation Schemas for HMS
// Using Zod for type-safe validation across all forms

import { z } from 'zod';

// =================== AUTHENTICATION SCHEMAS ===================

export const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
});

export const hairstylistLoginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
});

export const memberLoginSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  whatsapp: z
    .string()
    .min(1, 'WhatsApp number is required')
    .regex(/^\+?[\d\s-()]+$/, 'Please enter a valid WhatsApp number')
    .min(10, 'WhatsApp number must be at least 10 digits')
});

// =================== MEMBER SCHEMAS ===================

export const memberFormSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces'),
  
  whatsappNumber: z
    .string()
    .min(1, 'WhatsApp number is required')
    .regex(/^\+?[\d\s-()]+$/, 'Please enter a valid WhatsApp number')
    .min(10, 'WhatsApp number must be at least 10 digits')
    .max(20, 'WhatsApp number must not exceed 20 characters'),
  
  instagramHandle: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.startsWith('@') || val === '',
      'Instagram handle must start with @'
    )
    .refine(
      (val) => !val || /^@[a-zA-Z0-9._]+$/.test(val),
      'Instagram handle can only contain letters, numbers, dots, and underscores'
    ),
  
  preferredHairstylist: z.string().optional(),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional()
});

export const memberVisitSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters'),
  
  whatsappNumber: z
    .string()
    .min(1, 'WhatsApp number is required')
    .regex(/^\d+$/, 'WhatsApp number must contain only numbers')
    .min(10, 'WhatsApp number must be at least 10 digits'),
  
  instagramHandle: z.string().optional(),
  
  visitDate: z
    .date({
      required_error: 'Visit date is required'
    })
    .refine(
      (date) => date <= new Date(),
      'Visit date cannot be in the future'
    ),
  
  serviceType: z
    .string({
      required_error: 'Service type is required'
    })
    .min(1, 'Please select a service type'),
  
  hairstylistComment: z
    .string()
    .max(500, 'Comment must not exceed 500 characters')
    .optional()
});

// =================== HAIRSTYLIST SCHEMAS ===================

export const hairstylistFormSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces'),
  
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email must not exceed 100 characters'),
  
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must not exceed 20 characters'),
  
  specialties: z
    .string()
    .min(1, 'At least one specialty is required')
    .refine(
      (val) => val.split(',').filter(s => s.trim()).length > 0,
      'Please enter at least one specialty'
    ),
  
  experience: z
    .number({
      required_error: 'Experience is required',
      invalid_type_error: 'Experience must be a number'
    })
    .min(0, 'Experience cannot be negative')
    .max(50, 'Experience cannot exceed 50 years')
    .int('Experience must be a whole number'),
  
  address: z
    .string()
    .min(1, 'Address is required')
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must not exceed 200 characters'),
  
  bio: z
    .string()
    .max(500, 'Bio must not exceed 500 characters')
    .optional()
});

// =================== SERVICE SCHEMAS ===================

export const serviceFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Service name is required')
    .min(2, 'Service name must be at least 2 characters')
    .max(100, 'Service name must not exceed 100 characters'),
  
  description: z
    .string()
    .max(300, 'Description must not exceed 300 characters')
    .optional(),
  
  duration: z
    .number({
      required_error: 'Duration is required',
      invalid_type_error: 'Duration must be a number'
    })
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration cannot exceed 8 hours')
    .int('Duration must be a whole number'),
  
  basePrice: z
    .number({
      required_error: 'Base price is required',
      invalid_type_error: 'Base price must be a number'
    })
    .min(0, 'Base price cannot be negative')
    .max(10000000, 'Base price cannot exceed 10,000,000'),
  
  category: z.enum(['haircut', 'styling', 'treatment', 'coloring', 'beard', 'wash'], {
    required_error: 'Please select a service category'
  })
});

// =================== APPOINTMENT SCHEMAS ===================

export const appointmentFormSchema = z.object({
  memberId: z
    .string()
    .min(1, 'Please select a member'),
  
  hairstylistId: z
    .string()
    .min(1, 'Please select a hairstylist'),
  
  serviceIds: z
    .array(z.string())
    .min(1, 'Please select at least one service'),
  
  scheduledDate: z
    .date({
      required_error: 'Scheduled date is required'
    })
    .refine(
      (date) => date >= new Date(),
      'Scheduled date cannot be in the past'
    ),
  
  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional()
});

// =================== SEARCH AND FILTER SCHEMAS ===================

export const searchFilterSchema = z.object({
  search: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  hairstylistIds: z.array(z.string()).optional(),
  serviceIds: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// =================== PHOTO UPLOAD SCHEMAS ===================

export const photoUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024, // 5MB
      'File size must not exceed 5MB'
    )
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Only JPEG, PNG, and WebP images are allowed'
    ),
  
  type: z.enum(['before', 'after', 'avatar'], {
    required_error: 'Please specify the photo type'
  }),
  
  description: z
    .string()
    .max(200, 'Description must not exceed 200 characters')
    .optional()
});

// =================== SETTINGS SCHEMAS ===================

export const businessSettingsSchema = z.object({
  businessName: z
    .string()
    .min(1, 'Business name is required')
    .max(100, 'Business name must not exceed 100 characters'),
  
  address: z
    .string()
    .min(1, 'Business address is required')
    .max(200, 'Address must not exceed 200 characters'),
  
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'),
  
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  
  workingHours: z.object({
    monday: z.object({
      isOpen: z.boolean(),
      start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
      end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format')
    }),
    tuesday: z.object({
      isOpen: z.boolean(),
      start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
      end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format')
    }),
    wednesday: z.object({
      isOpen: z.boolean(),
      start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
      end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format')
    }),
    thursday: z.object({
      isOpen: z.boolean(),
      start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
      end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format')
    }),
    friday: z.object({
      isOpen: z.boolean(),
      start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
      end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format')
    }),
    saturday: z.object({
      isOpen: z.boolean(),
      start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
      end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format')
    }),
    sunday: z.object({
      isOpen: z.boolean(),
      start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
      end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format')
    })
  })
});

// =================== TYPE EXPORTS ===================

export type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
export type HairstylistLoginFormData = z.infer<typeof hairstylistLoginSchema>;
export type MemberLoginFormData = z.infer<typeof memberLoginSchema>;
export type MemberFormData = z.infer<typeof memberFormSchema>;
export type MemberVisitFormData = z.infer<typeof memberVisitSchema>;
export type HairstylistFormData = z.infer<typeof hairstylistFormSchema>;
export type ServiceFormData = z.infer<typeof serviceFormSchema>;
export type AppointmentFormData = z.infer<typeof appointmentFormSchema>;
export type SearchFilterFormData = z.infer<typeof searchFilterSchema>;
export type PhotoUploadFormData = z.infer<typeof photoUploadSchema>;
export type BusinessSettingsFormData = z.infer<typeof businessSettingsSchema>;

// =================== VALIDATION HELPERS ===================

export const validateFormData = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} => {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path.join('.')] = err.message;
        }
      });
      return {
        success: false,
        errors
      };
    }
    return {
      success: false,
      errors: { general: 'Validation failed' }
    };
  }
};

export const getFieldError = (errors: Record<string, string> | undefined, fieldName: string): string | undefined => {
  return errors?.[fieldName];
};