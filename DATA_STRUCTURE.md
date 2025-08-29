# HMS Data Structure Documentation

## Overview

The Hair Management System (HMS) has been upgraded with a centralized, normalized data structure that provides better organization, type safety, and scalability. This document explains the new architecture and how to use it.

## 🏗️ Architecture Overview

### Core Components

1. **Types System** (`src/types/index.ts`)
   - Centralized type definitions
   - Full TypeScript support
   - Normalized data relationships

2. **Data Service** (`src/services/dataService.ts`)
   - API-like interface for data operations
   - Singleton pattern for consistency
   - Backward compatibility with legacy data

3. **Validation Schemas** (`src/schemas/validation.ts`)
   - Zod-based validation
   - Type-safe form validation
   - Comprehensive error handling

4. **Data Utilities** (`src/utils/dataUtils.ts`)
   - Common data manipulation functions
   - Formatting utilities
   - Business logic calculations

## 📊 Data Entities

### User Management

```typescript
interface User {
  id: string;
  email: string;
  role: 'admin' | 'hairstylist' | 'member';
  profile: AdminProfile | HairstylistProfile | MemberProfile;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}
```

**Profiles:**
- `AdminProfile`: Basic admin information and permissions
- `HairstylistProfile`: Professional details, specialties, schedule, stats
- `MemberProfile`: Personal info, preferences, photos

### Service Management

```typescript
interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number; // minutes
  basePrice: number;
  category: ServiceCategory;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Categories:** `haircut`, `styling`, `treatment`, `coloring`, `beard`, `wash`

### Appointment System

```typescript
interface Appointment {
  id: string;
  memberId: string;
  hairstylistId: string;
  serviceIds: string[];
  scheduledDate: Date;
  status: AppointmentStatus;
  duration: number;
  totalPrice: number;
  notes?: string;
  rating?: number;
  beforePhotos?: string[];
  afterPhotos?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Statuses:** `scheduled`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show`

## 🛠️ Using the Data Service

### Basic Operations

```typescript
import { dataService } from '@/services/dataService';

// Create a new user
const result = dataService.createUser({
  email: 'user@example.com',
  role: 'member',
  profile: {
    fullName: 'John Doe',
    whatsappNumber: '+6281234567890',
    // ... other profile fields
  }
});

// Get all users
const users = dataService.getUsers();

// Update a user
dataService.updateUser(userId, {
  profile: { ...updatedProfile }
});

// Create an appointment
dataService.createAppointment({
  memberId: 'member-id',
  hairstylistId: 'hairstylist-id',
  serviceIds: ['service-1', 'service-2'],
  scheduledDate: new Date(),
  status: 'scheduled',
  duration: 90,
  totalPrice: 300000
});
```

### Service Management

```typescript
// Create a service
dataService.createService({
  name: 'Premium Haircut',
  description: 'Professional haircut with styling',
  duration: 60,
  basePrice: 200000,
  category: 'haircut',
  isActive: true
});

// Get all services
const services = dataService.getServices();

// Update service
dataService.updateService(serviceId, {
  basePrice: 250000,
  isActive: false
});
```

### Query Operations

```typescript
// Get appointments by member
const memberAppointments = dataService.getAppointmentsByMember(memberId);

// Get appointments by hairstylist
const hairstylistAppointments = dataService.getAppointmentsByHairstylist(hairstylistId);

// Find user by email
const user = dataService.getUserByEmail('user@example.com');
```

## ✅ Form Validation

### Using Validation Schemas

```typescript
import { memberFormSchema, validateFormData } from '@/schemas/validation';

const formData = {
  fullName: 'John Doe',
  whatsappNumber: '+6281234567890',
  instagramHandle: '@johndoe'
};

const validation = validateFormData(memberFormSchema, formData);

if (validation.success) {
  // Form data is valid
  const validData = validation.data;
} else {
  // Handle validation errors
  const errors = validation.errors;
}
```

### Available Schemas

- `adminLoginSchema`
- `hairstylistLoginSchema`
- `memberLoginSchema`
- `memberFormSchema`
- `memberVisitSchema`
- `hairstylistFormSchema`
- `serviceFormSchema`
- `appointmentFormSchema`

## 🔧 Utility Functions

### Data Formatting

```typescript
import { 
  formatCurrency, 
  formatDate, 
  formatPhoneNumber,
  calculateAppointmentDuration,
  calculateHairstylistStats
} from '@/utils/dataUtils';

// Format currency
const price = formatCurrency(150000); // "Rp 150.000"

// Format dates
const date = formatDate(new Date()); // "27 Agu 2024"

// Calculate appointment duration
const duration = calculateAppointmentDuration(serviceIds, services);

// Get hairstylist statistics
const stats = calculateHairstylistStats(hairstylistId, appointments, users);
```

### Search and Filtering

```typescript
import { searchItems, filterByDateRange } from '@/utils/dataUtils';

// Search across multiple fields
const searchResults = searchItems(appointments, 'john', ['memberName', 'notes']);

// Filter by date range
const recentAppointments = filterByDateRange(
  appointments,
  'scheduledDate',
  { start: startDate, end: endDate }
);
```

## 📈 Business Analytics

### Calculate Business Metrics

```typescript
import { calculateBusinessMetrics } from '@/utils/dataUtils';

const metrics = calculateBusinessMetrics(
  appointments,
  users,
  services,
  { start: monthStart, end: monthEnd }
);

// Access metrics
console.log(metrics.revenue.total);
console.log(metrics.appointments.completionRate);
console.log(metrics.members.retentionRate);
```

## 🔄 Legacy Compatibility

The system maintains backward compatibility with existing data:

```typescript
// Get legacy format data
const legacyMembers = dataService.getLegacyMembers();
const legacyHairstylists = dataService.getLegacyHairstylists();

// Existing member-storage functions still work
import { getMembers, addMemberVisit } from '@/lib/member-storage';
```

## 🎯 Best Practices

### 1. Always Use Validation

```typescript
// ✅ Good - Use schema validation
const validation = validateFormData(schema, data);
if (!validation.success) {
  handleErrors(validation.errors);
  return;
}

// ❌ Bad - Direct data usage without validation
dataService.createUser(untrustedData);
```

### 2. Handle API Responses

```typescript
// ✅ Good - Check response status
const result = dataService.createUser(userData);
if (result.success) {
  showSuccess(result.message);
} else {
  showError(result.message);
}

// ❌ Bad - Assume success
dataService.createUser(userData);
showSuccess('User created');
```

### 3. Use Utility Functions

```typescript
// ✅ Good - Use utilities for calculations
const stats = calculateHairstylistStats(id, appointments, users);

// ❌ Bad - Manual calculations
let totalRevenue = 0;
appointments.forEach(a => {
  if (a.hairstylistId === id) totalRevenue += a.totalPrice;
});
```

### 4. Proper Error Handling

```typescript
// ✅ Good - Comprehensive error handling
try {
  const result = dataService.createAppointment(appointmentData);
  if (result.success) {
    toast.success(result.message);
    refreshData();
  } else {
    toast.error(result.message);
  }
} catch (error) {
  toast.error('An unexpected error occurred');
  console.error(error);
}
```

## 🚀 Migration Guide

### For Existing Code

1. **Import new types:**
   ```typescript
   import { User, Service, Appointment } from '@/types';
   ```

2. **Use dataService instead of direct localStorage:**
   ```typescript
   // Old
   const data = JSON.parse(localStorage.getItem('hms_data'));
   
   // New
   const data = dataService.getUsers();
   ```

3. **Add validation to forms:**
   ```typescript
   // Old
   if (formData.name && formData.email) { /* ... */ }
   
   // New
   const validation = validateFormData(schema, formData);
   if (validation.success) { /* ... */ }
   ```

4. **Use utility functions:**
   ```typescript
   // Old
   const formatted = new Intl.NumberFormat('id-ID', {
     style: 'currency',
     currency: 'IDR'
   }).format(amount);
   
   // New
   const formatted = formatCurrency(amount);
   ```

## 📝 Example Implementation

See `src/pages/Settings.tsx` for a complete example of:
- Service management with CRUD operations
- Form validation with Zod schemas
- Data service integration
- Error handling and user feedback
- Legacy data migration

## 🔧 Troubleshooting

### Common Issues

1. **Validation Errors**
   - Check schema definitions in `src/schemas/validation.ts`
   - Use `validateFormData` helper function
   - Handle validation errors properly

2. **Data Not Persisting**
   - Ensure you're using dataService methods
   - Check browser localStorage limits
   - Verify error handling in API responses

3. **Type Errors**
   - Import types from `src/types/index.ts`
   - Use proper TypeScript strict mode
   - Check interface compatibility

### Debug Mode

Enable debug logging:

```typescript
// In development, add to dataService
if (process.env.NODE_ENV === 'development') {
  console.log('DataService operation:', operation, data);
}
```

## 📊 Data Export/Import

The system supports data export and import through the Settings page:

- **Export**: Download all data as JSON
- **Import**: Upload and restore data (planned feature)
- **Migration**: Convert legacy data to new format
- **Backup**: Regular data backups recommended

---

This documentation will be updated as the system evolves. For questions or issues, please refer to the codebase or create an issue.