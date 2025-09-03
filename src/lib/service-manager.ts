import { Service, ServiceCategory, AVAILABLE_SERVICES, MembershipTier } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Service Manager with business logic and validation
export class ServiceManager {
  private static services: Service[] = AVAILABLE_SERVICES.map(service => ({
    ...service,
    id: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  // Get all available services
  static getAllServices(): Service[] {
    return this.services.filter(service => service.is_active);
  }

  // Get service by ID
  static getServiceById(id: string): Service | undefined {
    return this.services.find(service => service.id === id);
  }

  // Get service by name
  static getServiceByName(name: string): Service | undefined {
    return this.services.find(service => service.name === name);
  }

  // Get services by category
  static getServicesByCategory(category: ServiceCategory): Service[] {
    return this.services.filter(service => 
      service.category === category && service.is_active
    );
  }

  // Get services by IDs
  static getServicesByIds(ids: string[]): Service[] {
    return this.services.filter(service => 
      ids.includes(service.id) && service.is_active
    );
  }

  // Calculate total price for multiple services
  static calculateTotalPrice(
    serviceIds: string[], 
    discountPercentage: number = 0,
    membershipTier?: MembershipTier
  ): number {
    const services = this.getServicesByIds(serviceIds);
    const baseTotal = services.reduce((total, service) => total + service.base_price, 0);
    
    // Apply regular discount
    let finalTotal = baseTotal * (1 - discountPercentage / 100);
    
    // Apply membership discount
    if (membershipTier) {
      const membershipDiscount = this.getMembershipDiscount(membershipTier);
      finalTotal = finalTotal * (1 - membershipDiscount / 100);
    }
    
    return Math.round(finalTotal);
  }

  // Calculate total duration for multiple services
  static calculateTotalDuration(serviceIds: string[]): number {
    const services = this.getServicesByIds(serviceIds);
    return services.reduce((total, service) => total + service.duration_minutes, 0);
  }

  // Validate service combination
  static validateServiceCombination(serviceIds: string[]): {
    isValid: boolean;
    conflicts: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const services = this.getServicesByIds(serviceIds);
    const conflicts: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for conflicting services
    const hasTreatment = services.some(s => s.category === 'treatment');
    const hasCombo = services.some(s => s.category === 'combo');
    const hasBasicHaircut = services.some(s => s.name === 'Haircut');

    // Rule 1: Can't combine combo services with individual services that are already included
    if (hasCombo) {
      services.forEach(service => {
        if (service.category === 'combo') {
          // Check if any individual services are redundant
          const comboIncludes = this.getComboIncludes(service.name);
          const redundantServices = services.filter(s => 
            s.category !== 'combo' && comboIncludes.includes(s.name)
          );
          
          if (redundantServices.length > 0) {
            conflicts.push(
              `${service.name} already includes: ${redundantServices.map(s => s.name).join(', ')}`
            );
          }
        }
      });
    }

    // Rule 2: Some treatments require haircut
    const treatmentsThatNeedHaircut = ['Root Lift', 'Down Perm', 'Design Perm'];
    const needsHaircut = services.some(s => treatmentsThatNeedHaircut.includes(s.name));
    
    if (needsHaircut && !hasBasicHaircut && !hasCombo) {
      warnings.push('Some treatments work best with a fresh haircut. Consider adding a haircut.');
      suggestions.push('Add \"Haircut\" service for best results');
    }

    // Rule 3: Multiple treatments in one session warning
    const treatments = services.filter(s => s.category === 'treatment');
    if (treatments.length > 2) {
      warnings.push('Multiple chemical treatments in one session may be intensive for hair.');
    }

    // Rule 4: Total duration warning
    const totalDuration = this.calculateTotalDuration(serviceIds);
    if (totalDuration > 240) { // 4 hours
      warnings.push(`Total session time: ${Math.round(totalDuration / 60)} hours. Consider splitting into multiple visits.`);
    }

    // Rule 5: Suggest combos for common combinations
    if (hasBasicHaircut && !hasCombo) {
      const otherServices = services.filter(s => s.name !== 'Haircut');
      if (otherServices.length === 1) {
        const comboName = `Haircut + ${otherServices[0].name}`;
        const comboExists = this.getServiceByName(comboName);
        if (comboExists) {
          suggestions.push(`Consider \"${comboName}\" combo for better value`);
        }
      }
    }

    return {
      isValid: conflicts.length === 0,
      conflicts,
      warnings,
      suggestions
    };
  }

  // Get membership discount percentage
  static getMembershipDiscount(tier: MembershipTier): number {
    const discounts = {
      bronze: 0,
      silver: 5,
      gold: 10,
      platinum: 15,
      diamond: 20
    };
    return discounts[tier] || 0;
  }

  // Get what services are included in a combo
  private static getComboIncludes(comboName: string): string[] {
    const comboMapping: Record<string, string[]> = {
      'Haircut + Root Lift': ['Haircut', 'Root Lift'],
      'Haircut + Down Perm': ['Haircut', 'Down Perm'],
      'Haircut + Down Perm + Root Lift': ['Haircut', 'Down Perm', 'Root Lift'],
      'Haircut + Design Perm': ['Haircut', 'Design Perm'],
      'Haircut + Keratin Smooth': ['Haircut', 'Keratin Smooth'],
      'Haircut + Hair Repair': ['Haircut', 'Hair Repair']
    };
    return comboMapping[comboName] || [];
  }

  // Search services
  static searchServices(query: string): Service[] {
    const lowerQuery = query.toLowerCase();
    return this.services.filter(service => 
      service.is_active && (
        service.name.toLowerCase().includes(lowerQuery) ||
        service.description?.toLowerCase().includes(lowerQuery) ||
        service.category.toLowerCase().includes(lowerQuery)
      )
    );
  }

  // Get popular services (based on categories)
  static getPopularServices(): Service[] {
    const popularNames = [
      'Haircut',
      'Haircut + Root Lift', 
      'Root Lift',
      'Haircut + Down Perm',
      'Design Perm'
    ];
    
    return popularNames
      .map(name => this.getServiceByName(name))
      .filter((service): service is Service => service !== undefined);
  }

  // Get service recommendations based on previous services
  static getRecommendations(previousServiceIds: string[]): Service[] {
    const previousServices = this.getServicesByIds(previousServiceIds);
    const recommendations: Service[] = [];

    // If they've had treatments, recommend maintenance
    const hadTreatments = previousServices.some(s => s.category === 'treatment');
    if (hadTreatments) {
      const hairRepair = this.getServiceByName('Hair Repair');
      if (hairRepair) recommendations.push(hairRepair);
    }

    // If they only had basic haircut, suggest upgrades
    const onlyBasicServices = previousServices.every(s => 
      s.category === 'haircut' && s.name === 'Haircut'
    );
    if (onlyBasicServices) {
      const rootLift = this.getServiceByName('Root Lift');
      const haircutCombo = this.getServiceByName('Haircut + Root Lift');
      if (rootLift) recommendations.push(rootLift);
      if (haircutCombo) recommendations.push(haircutCombo);
    }

    return recommendations.slice(0, 3); // Limit to 3 recommendations
  }

  // Format price to Indonesian Rupiah
  static formatPrice(price: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  // Format duration
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }

  // Get service statistics
  static getServiceStats(visitData: any[]): {
    mostPopular: Service[];
    highestRevenue: Service[];
    averageRatings: Record<string, number>;
  } {
    // This would typically analyze actual visit data
    // For now, return mock data structure
    return {
      mostPopular: this.getPopularServices(),
      highestRevenue: this.getPopularServices(),
      averageRatings: {}
    };
  }
}

// Export service utilities
export const serviceUtils = {
  formatPrice: ServiceManager.formatPrice,
  formatDuration: ServiceManager.formatDuration,
  calculateTotal: ServiceManager.calculateTotalPrice,
  validateCombination: ServiceManager.validateServiceCombination,
  getRecommendations: ServiceManager.getRecommendations
};