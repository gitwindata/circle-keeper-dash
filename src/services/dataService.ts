// Centralized Data Service for HMS
// This service provides a clean API for all data operations

import { v4 as uuidv4 } from 'uuid';
import {
  User,
  Service,
  Appointment,
  BusinessMetrics,
  MemberFormData,
  HairstylistFormData,
  AppointmentFormData,
  FilterOptions,
  PaginatedResponse,
  ApiResponse,
  LegacyMember,
  LegacyHairstylist,
  LegacyMemberVisit
} from '../types';

// =================== STORAGE KEYS ===================
const STORAGE_KEYS = {
  USERS: 'hms_users',
  SERVICES: 'hms_services',
  APPOINTMENTS: 'hms_appointments',
  BUSINESS_SETTINGS: 'hms_business_settings',
  // Legacy keys for compatibility
  MEMBERS: 'hms_members',
  ADMIN_TOKEN: 'hms_admin_token',
  HAIRSTYLIST_TOKEN: 'hms_hairstylist_token',
  HAIRSTYLIST_ID: 'hms_hairstylist_id',
  MEMBER_DATA: 'hms_member_data'
} as const;

// =================== BASE DATA SERVICE ===================
class DataService {
  // Generic storage operations
  private getFromStorage<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading from storage (${key}):`, error);
      return null;
    }
  }

  private saveToStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to storage (${key}):`, error);
    }
  }

  private removeFromStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from storage (${key}):`, error);
    }
  }

  // =================== USER MANAGEMENT ===================
  
  getUsers(): User[] {
    return this.getFromStorage<User[]>(STORAGE_KEYS.USERS) || [];
  }

  getUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.id === id) || null;
  }

  getUserByEmail(email: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.email === email) || null;
  }

  createUser(userData: Partial<User>): ApiResponse<User> {
    try {
      const users = this.getUsers();
      
      // Check if user already exists
      if (userData.email && this.getUserByEmail(userData.email)) {
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }

      const newUser: User = {
        id: uuidv4(),
        email: userData.email || '',
        role: userData.role || 'member',
        profile: userData.profile || {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        ...userData
      };

      users.push(newUser);
      this.saveToStorage(STORAGE_KEYS.USERS, users);

      return {
        success: true,
        data: newUser,
        message: 'User created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create user'
      };
    }
  }

  updateUser(id: string, updates: Partial<User>): ApiResponse<User> {
    try {
      const users = this.getUsers();
      const userIndex = users.findIndex(user => user.id === id);

      if (userIndex === -1) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      users[userIndex] = {
        ...users[userIndex],
        ...updates,
        updatedAt: new Date()
      };

      this.saveToStorage(STORAGE_KEYS.USERS, users);

      return {
        success: true,
        data: users[userIndex],
        message: 'User updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update user'
      };
    }
  }

  deleteUser(id: string): ApiResponse<boolean> {
    try {
      const users = this.getUsers();
      const filteredUsers = users.filter(user => user.id !== id);

      if (users.length === filteredUsers.length) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      this.saveToStorage(STORAGE_KEYS.USERS, filteredUsers);

      return {
        success: true,
        data: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete user'
      };
    }
  }

  // =================== SERVICE MANAGEMENT ===================

  getServices(): Service[] {
    return this.getFromStorage<Service[]>(STORAGE_KEYS.SERVICES) || this.getDefaultServices();
  }

  getServiceById(id: string): Service | null {
    const services = this.getServices();
    return services.find(service => service.id === id) || null;
  }

  createService(serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): ApiResponse<Service> {
    try {
      const services = this.getServices();
      
      const newService: Service = {
        ...serviceData,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      services.push(newService);
      this.saveToStorage(STORAGE_KEYS.SERVICES, services);

      return {
        success: true,
        data: newService,
        message: 'Service created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create service'
      };
    }
  }

  updateService(id: string, updates: Partial<Service>): ApiResponse<Service> {
    try {
      const services = this.getServices();
      const serviceIndex = services.findIndex(service => service.id === id);

      if (serviceIndex === -1) {
        return {
          success: false,
          message: 'Service not found'
        };
      }

      services[serviceIndex] = {
        ...services[serviceIndex],
        ...updates,
        updatedAt: new Date()
      };

      this.saveToStorage(STORAGE_KEYS.SERVICES, services);

      return {
        success: true,
        data: services[serviceIndex],
        message: 'Service updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update service'
      };
    }
  }

  // =================== APPOINTMENT MANAGEMENT ===================

  getAppointments(): Appointment[] {
    return this.getFromStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS) || [];
  }

  getAppointmentById(id: string): Appointment | null {
    const appointments = this.getAppointments();
    return appointments.find(appointment => appointment.id === id) || null;
  }

  getAppointmentsByMember(memberId: string): Appointment[] {
    const appointments = this.getAppointments();
    return appointments.filter(appointment => appointment.memberId === memberId);
  }

  getAppointmentsByHairstylist(hairstylistId: string): Appointment[] {
    const appointments = this.getAppointments();
    return appointments.filter(appointment => appointment.hairstylistId === hairstylistId);
  }

  createAppointment(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): ApiResponse<Appointment> {
    try {
      const appointments = this.getAppointments();
      
      const newAppointment: Appointment = {
        ...appointmentData,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      appointments.push(newAppointment);
      this.saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments);

      return {
        success: true,
        data: newAppointment,
        message: 'Appointment created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create appointment'
      };
    }
  }

  updateAppointment(id: string, updates: Partial<Appointment>): ApiResponse<Appointment> {
    try {
      const appointments = this.getAppointments();
      const appointmentIndex = appointments.findIndex(appointment => appointment.id === id);

      if (appointmentIndex === -1) {
        return {
          success: false,
          message: 'Appointment not found'
        };
      }

      appointments[appointmentIndex] = {
        ...appointments[appointmentIndex],
        ...updates,
        updatedAt: new Date()
      };

      this.saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments);

      return {
        success: true,
        data: appointments[appointmentIndex],
        message: 'Appointment updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update appointment'
      };
    }
  }

  // =================== LEGACY COMPATIBILITY ===================

  getLegacyMembers(): LegacyMember[] {
    return this.getFromStorage<LegacyMember[]>(STORAGE_KEYS.MEMBERS) || [];
  }

  getLegacyHairstylists(): LegacyHairstylist[] {
    // Convert new User structure to legacy format for backward compatibility
    const users = this.getUsers();
    const hairstylists = users.filter(user => user.role === 'hairstylist');
    
    return hairstylists.map(user => ({
      id: user.id,
      fullName: (user.profile as any).fullName || '',
      email: user.email,
      phone: (user.profile as any).phone || '',
      specialties: (user.profile as any).specialties || [],
      experience: (user.profile as any).experience || 0,
      joinDate: (user.profile as any).joinDate || user.createdAt.toISOString().split('T')[0],
      address: (user.profile as any).address || '',
      status: user.isActive ? 'active' : 'inactive',
      avatar: (user.profile as any).avatar || '/api/placeholder/40/40',
      totalClients: (user.profile as any).stats?.totalClients || 0,
      monthlyClients: (user.profile as any).stats?.monthlyClients || 0,
      rating: (user.profile as any).stats?.averageRating || 0,
      bio: (user.profile as any).bio || ''
    }));
  }

  // =================== DEFAULT DATA ===================

  private getDefaultServices(): Service[] {
    const defaultServices: Service[] = [
      {
        id: uuidv4(),
        name: 'Haircut',
        description: 'Professional haircut service',
        duration: 45,
        basePrice: 150000,
        category: 'haircut',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Beard Trim',
        description: 'Beard trimming and styling',
        duration: 30,
        basePrice: 100000,
        category: 'beard',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Hair Coloring',
        description: 'Professional hair coloring service',
        duration: 120,
        basePrice: 500000,
        category: 'coloring',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Hair Styling',
        description: 'Hair styling for special occasions',
        duration: 60,
        basePrice: 200000,
        category: 'styling',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Hair Treatment',
        description: 'Therapeutic hair treatment',
        duration: 90,
        basePrice: 300000,
        category: 'treatment',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.saveToStorage(STORAGE_KEYS.SERVICES, defaultServices);
    return defaultServices;
  }

  // =================== AUTHENTICATION ===================

  authenticateAdmin(email: string, password: string): boolean {
    // Simple authentication for demo purposes
    if (email === 'admin@hms.com' && password === 'admin123') {
      this.saveToStorage(STORAGE_KEYS.ADMIN_TOKEN, 'true');
      return true;
    }
    return false;
  }

  authenticateHairstylist(username: string, password: string): string | null {
    // Simple authentication for demo purposes
    if (username === 'hairstylist' && password === 'password') {
      const hairstylistId = 'hairstylist-1';
      this.saveToStorage(STORAGE_KEYS.HAIRSTYLIST_TOKEN, 'true');
      this.saveToStorage(STORAGE_KEYS.HAIRSTYLIST_ID, hairstylistId);
      return hairstylistId;
    }
    return null;
  }

  authenticateMember(name: string, whatsapp: string): boolean {
    const memberData = { name, whatsapp, joinDate: new Date().toISOString(), status: 'active' };
    this.saveToStorage(STORAGE_KEYS.MEMBER_DATA, memberData);
    return true;
  }

  logout(userType: 'admin' | 'hairstylist' | 'member'): void {
    switch (userType) {
      case 'admin':
        this.removeFromStorage(STORAGE_KEYS.ADMIN_TOKEN);
        break;
      case 'hairstylist':
        this.removeFromStorage(STORAGE_KEYS.HAIRSTYLIST_TOKEN);
        this.removeFromStorage(STORAGE_KEYS.HAIRSTYLIST_ID);
        break;
      case 'member':
        this.removeFromStorage(STORAGE_KEYS.MEMBER_DATA);
        break;
    }
  }

  // =================== UTILITY METHODS ===================

  initializeDefaultData(): void {
    // Initialize default services if not exist
    if (!this.getFromStorage(STORAGE_KEYS.SERVICES)) {
      this.getDefaultServices();
    }

    // Initialize default users if not exist
    if (!this.getFromStorage(STORAGE_KEYS.USERS)) {
      const defaultUsers: User[] = [];
      this.saveToStorage(STORAGE_KEYS.USERS, defaultUsers);
    }
  }

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.removeFromStorage(key);
    });
  }
}

// =================== SINGLETON INSTANCE ===================
export const dataService = new DataService();

// Initialize default data
dataService.initializeDefaultData();

export default dataService;