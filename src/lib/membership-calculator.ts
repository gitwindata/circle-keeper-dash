import { MembershipTier, MembershipLevel, MEMBERSHIP_LEVELS, Member } from '../types';

// Membership Calculator with progression logic
export class MembershipCalculator {
  // Calculate membership tier based on visits and spending
  static calculateLevel(totalVisits: number, totalSpent: number): MembershipTier {
    // Sort levels by requirements (highest first)
    const sortedLevels = [...MEMBERSHIP_LEVELS].sort((a, b) => b.minVisits - a.minVisits);
    
    for (const level of sortedLevels) {
      if (totalVisits >= level.minVisits && totalSpent >= level.minSpending) {
        return level.tier;
      }
    }
    
    return 'bronze'; // Default tier
  }

  // Get membership level info
  static getLevelInfo(tier: MembershipTier): MembershipLevel {
    return MEMBERSHIP_LEVELS.find(level => level.tier === tier) || MEMBERSHIP_LEVELS[0];
  }

  // Get next tier and requirements
  static getNextTierInfo(currentTier: MembershipTier): {
    nextTier: MembershipLevel | null;
    requirementsToNext: {
      visitsNeeded: number;
      spendingNeeded: number;
    } | null;
  } {
    const currentIndex = MEMBERSHIP_LEVELS.findIndex(level => level.tier === currentTier);
    
    if (currentIndex === -1 || currentIndex === MEMBERSHIP_LEVELS.length - 1) {
      return { nextTier: null, requirementsToNext: null };
    }
    
    const nextTier = MEMBERSHIP_LEVELS[currentIndex + 1];
    const currentLevel = MEMBERSHIP_LEVELS[currentIndex];
    
    return {
      nextTier,
      requirementsToNext: {
        visitsNeeded: Math.max(0, nextTier.minVisits - currentLevel.minVisits),
        spendingNeeded: Math.max(0, nextTier.minSpending - currentLevel.minSpending)
      }
    };
  }

  // Calculate progress to next tier
  static calculateProgress(
    currentVisits: number, 
    currentSpent: number, 
    currentTier: MembershipTier
  ): {
    visitProgress: number; // 0-100
    spendingProgress: number; // 0-100
    overallProgress: number; // 0-100
    isMaxTier: boolean;
  } {
    const { nextTier } = this.getNextTierInfo(currentTier);
    
    if (!nextTier) {
      return {
        visitProgress: 100,
        spendingProgress: 100,
        overallProgress: 100,
        isMaxTier: true
      };
    }
    
    const currentLevel = this.getLevelInfo(currentTier);
    
    // Calculate progress from current tier to next tier
    const visitProgress = Math.min(100, 
      ((currentVisits - currentLevel.minVisits) / 
       (nextTier.minVisits - currentLevel.minVisits)) * 100
    );
    
    const spendingProgress = Math.min(100,
      ((currentSpent - currentLevel.minSpending) / 
       (nextTier.minSpending - currentLevel.minSpending)) * 100
    );
    
    // Overall progress is the minimum of both requirements
    const overallProgress = Math.min(visitProgress, spendingProgress);
    
    return {
      visitProgress: Math.max(0, visitProgress),
      spendingProgress: Math.max(0, spendingProgress),
      overallProgress: Math.max(0, overallProgress),
      isMaxTier: false
    };
  }

  // Check if member should be upgraded
  static shouldUpgrade(member: Member): {
    shouldUpgrade: boolean;
    newTier?: MembershipTier;
    pointsEarned?: number;
  } {
    const newTier = this.calculateLevel(member.total_visits, member.total_spent);
    
    if (newTier !== member.membership_tier) {
      const newLevel = this.getLevelInfo(newTier);
      const oldLevel = this.getLevelInfo(member.membership_tier);
      
      // Calculate points earned for upgrade
      const tierValues = { bronze: 0, silver: 100, gold: 250, platinum: 500, diamond: 1000 };
      const pointsEarned = tierValues[newTier] - tierValues[member.membership_tier];
      
      return {
        shouldUpgrade: true,
        newTier,
        pointsEarned: Math.max(0, pointsEarned)
      };
    }
    
    return { shouldUpgrade: false };
  }

  // Get membership benefits for a tier
  static getBenefits(tier: MembershipTier): string[] {
    const level = this.getLevelInfo(tier);
    return level.benefits;
  }

  // Get discount percentage for a tier
  static getDiscount(tier: MembershipTier): number {
    const level = this.getLevelInfo(tier);
    return level.discountPercentage;
  }

  // Calculate points from visit
  static calculatePointsFromVisit(visitAmount: number, membershipTier: MembershipTier): number {
    const basePoints = Math.floor(visitAmount / 10000); // 1 point per 10k IDR
    const tierMultiplier = {
      bronze: 1,
      silver: 1.2,
      gold: 1.5,
      platinum: 1.8,
      diamond: 2.0
    };
    
    return Math.floor(basePoints * (tierMultiplier[membershipTier] || 1));
  }

  // Get tier color for UI
  static getTierColor(tier: MembershipTier): string {
    const level = this.getLevelInfo(tier);
    return level.color;
  }

  // Get tier icon for UI
  static getTierIcon(tier: MembershipTier): string {
    const level = this.getLevelInfo(tier);
    return level.icon;
  }

  // Format tier name
  static formatTierName(tier: MembershipTier): string {
    const level = this.getLevelInfo(tier);
    return level.name;
  }

  // Get all tiers in order
  static getAllTiers(): MembershipLevel[] {
    return MEMBERSHIP_LEVELS;
  }

  // Get tier rank (0-4, where 0 is bronze and 4 is diamond)
  static getTierRank(tier: MembershipTier): number {
    const index = MEMBERSHIP_LEVELS.findIndex(level => level.tier === tier);
    return index === -1 ? 0 : index;
  }

  // Check if tier A is higher than tier B
  static isHigherTier(tierA: MembershipTier, tierB: MembershipTier): boolean {
    return this.getTierRank(tierA) > this.getTierRank(tierB);
  }

  // Get estimated time to next tier based on current activity
  static estimateTimeToNextTier(
    currentVisits: number,
    currentSpent: number,
    currentTier: MembershipTier,
    monthlyVisits: number = 2,
    averageSpendPerVisit: number = 300000
  ): {
    estimatedMonths: number;
    basedOnVisits: boolean;
    basedOnSpending: boolean;
  } {
    const { nextTier } = this.getNextTierInfo(currentTier);
    
    if (!nextTier) {
      return { estimatedMonths: 0, basedOnVisits: false, basedOnSpending: false };
    }
    
    const visitsNeeded = Math.max(0, nextTier.minVisits - currentVisits);
    const spendingNeeded = Math.max(0, nextTier.minSpending - currentSpent);
    
    const monthsForVisits = monthlyVisits > 0 ? visitsNeeded / monthlyVisits : Infinity;
    const monthsForSpending = averageSpendPerVisit > 0 
      ? spendingNeeded / (monthlyVisits * averageSpendPerVisit) 
      : Infinity;
    
    // Take the longer requirement
    const estimatedMonths = Math.max(monthsForVisits, monthsForSpending);
    
    return {
      estimatedMonths: Math.ceil(estimatedMonths),
      basedOnVisits: monthsForVisits >= monthsForSpending,
      basedOnSpending: monthsForSpending > monthsForVisits
    };
  }

  // Get membership stats for analytics
  static getMembershipStats(members: Member[]): {
    totalMembers: number;
    tierDistribution: Record<MembershipTier, number>;
    averageVisitsPerTier: Record<MembershipTier, number>;
    averageSpendingPerTier: Record<MembershipTier, number>;
    topTierPercentage: number;
  } {
    const stats = {
      totalMembers: members.length,
      tierDistribution: {} as Record<MembershipTier, number>,
      averageVisitsPerTier: {} as Record<MembershipTier, number>,
      averageSpendingPerTier: {} as Record<MembershipTier, number>,
      topTierPercentage: 0
    };

    // Initialize counts
    MEMBERSHIP_LEVELS.forEach(level => {
      stats.tierDistribution[level.tier] = 0;
      stats.averageVisitsPerTier[level.tier] = 0;
      stats.averageSpendingPerTier[level.tier] = 0;
    });

    // Count members by tier and calculate averages
    const tierStats: Record<MembershipTier, { totalVisits: number; totalSpent: number; count: number }> = 
      {} as any;

    MEMBERSHIP_LEVELS.forEach(level => {
      tierStats[level.tier] = { totalVisits: 0, totalSpent: 0, count: 0 };
    });

    members.forEach(member => {
      const tier = member.membership_tier;
      stats.tierDistribution[tier]++;
      tierStats[tier].totalVisits += member.total_visits;
      tierStats[tier].totalSpent += member.total_spent;
      tierStats[tier].count++;
    });

    // Calculate averages
    MEMBERSHIP_LEVELS.forEach(level => {
      const data = tierStats[level.tier];
      if (data.count > 0) {
        stats.averageVisitsPerTier[level.tier] = data.totalVisits / data.count;
        stats.averageSpendingPerTier[level.tier] = data.totalSpent / data.count;
      }
    });

    // Calculate top tier percentage (Gold, Platinum, Diamond)
    const topTierCount = stats.tierDistribution.gold + 
                       stats.tierDistribution.platinum + 
                       stats.tierDistribution.diamond;
    stats.topTierPercentage = members.length > 0 ? (topTierCount / members.length) * 100 : 0;

    return stats;
  }
}

// Export utility functions
export const membershipUtils = {
  calculateLevel: MembershipCalculator.calculateLevel,
  getLevelInfo: MembershipCalculator.getLevelInfo,
  getProgress: MembershipCalculator.calculateProgress,
  getDiscount: MembershipCalculator.getDiscount,
  formatTierName: MembershipCalculator.formatTierName,
  getTierColor: MembershipCalculator.getTierColor,
  getTierIcon: MembershipCalculator.getTierIcon
};