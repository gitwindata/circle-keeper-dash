import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Award, 
  Star, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Trophy,
  Gift,
  Crown
} from "lucide-react";
import { MembershipCalculator } from '../lib/membership-calculator';
import { Member, MembershipTier } from '../types';

interface MembershipLevelCardProps {
  member: Member;
  className?: string;
}

const MembershipLevelCard: React.FC<MembershipLevelCardProps> = ({ member, className = '' }) => {
  const currentLevel = MembershipCalculator.getLevelInfo(member.membership_tier);
  const progress = MembershipCalculator.calculateProgress(
    member.total_visits,
    member.total_spent,
    member.membership_tier
  );
  const nextTierInfo = MembershipCalculator.getNextTierInfo(member.membership_tier);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTierIcon = (tier: MembershipTier) => {
    switch (tier) {
      case 'bronze': return <Award className="h-6 w-6" />;
      case 'silver': return <Star className="h-6 w-6" />;
      case 'gold': return <Trophy className="h-6 w-6" />;
      case 'platinum': return <Crown className="h-6 w-6" />;
      case 'diamond': return <Gift className="h-6 w-6" />;
      default: return <Award className="h-6 w-6" />;
    }
  };

  const getProgressColor = (tier: MembershipTier) => {
    switch (tier) {
      case 'bronze': return 'from-amber-600 to-amber-400';
      case 'silver': return 'from-gray-600 to-gray-400';
      case 'gold': return 'from-yellow-600 to-yellow-400';
      case 'platinum': return 'from-purple-600 to-purple-400';
      case 'diamond': return 'from-blue-600 to-blue-400';
      default: return 'from-gray-600 to-gray-400';
    }
  };

  return (
    <Card className={`${className} overflow-hidden`}>
      {/* Header with Current Tier */}
      <CardHeader className={`bg-gradient-to-r ${currentLevel.color} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getTierIcon(member.membership_tier)}
            <div>
              <CardTitle className="text-white">{currentLevel.name} Member</CardTitle>
              <CardDescription className="text-white/80">
                Since {new Date(member.created_at).getFullYear()}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {currentLevel.discountPercentage}% Discount
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Current Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{member.total_visits}</div>
            <div className="text-sm text-gray-600">Total Visits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(member.total_spent)}
            </div>
            <div className="text-sm text-gray-600">Total Spent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{member.loyalty_points || 0}</div>
            <div className="text-sm text-gray-600">Points</div>
          </div>
        </div>

        {/* Benefits */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Your Benefits
          </h4>
          <div className="space-y-2">
            {currentLevel.benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress to Next Tier */}
        {!progress.isMaxTier && nextTierInfo.nextTier && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Progress to {nextTierInfo.nextTier.name}
              </h4>
              <Badge variant="outline" className="text-xs">
                {Math.round(progress.overallProgress)}% Complete
              </Badge>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span className="font-medium">{Math.round(progress.overallProgress)}%</span>
              </div>
              <div className="relative">
                <Progress value={progress.overallProgress} className="h-3" />
                <div 
                  className={`absolute inset-0 bg-gradient-to-r ${getProgressColor(nextTierInfo.nextTier.tier)} opacity-80 rounded-full`}
                  style={{ width: `${progress.overallProgress}%` }}
                />
              </div>
            </div>

            {/* Detailed Requirements */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>Visits Progress</span>
                </div>
                <Progress value={progress.visitProgress} className="h-2" />
                <div className="text-xs text-gray-600">
                  {member.total_visits} / {nextTierInfo.nextTier.minVisits} visits
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span>Spending Progress</span>
                </div>
                <Progress value={progress.spendingProgress} className="h-2" />
                <div className="text-xs text-gray-600">
                  {formatCurrency(member.total_spent)} / {formatCurrency(nextTierInfo.nextTier.minSpending)}
                </div>
              </div>
            </div>

            {/* Requirements Remaining */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">To reach {nextTierInfo.nextTier.name}:</h5>
              <div className="space-y-1 text-sm text-blue-800">
                {nextTierInfo.requirementsToNext && (
                  <>
                    {nextTierInfo.requirementsToNext.visitsNeeded > 0 && (
                      <div>• {nextTierInfo.requirementsToNext.visitsNeeded} more visits needed</div>
                    )}
                    {nextTierInfo.requirementsToNext.spendingNeeded > 0 && (
                      <div>• {formatCurrency(nextTierInfo.requirementsToNext.spendingNeeded)} more spending needed</div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Next Tier Benefits Preview */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h5 className="font-medium text-gray-900 mb-2">
                Unlock {nextTierInfo.nextTier.name} Benefits:
              </h5>
              <div className="space-y-1">
                {nextTierInfo.nextTier.benefits.slice(0, 3).map((benefit, index) => (
                  <div key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
                {nextTierInfo.nextTier.benefits.length > 3 && (
                  <div className="text-sm text-blue-600 font-medium">
                    +{nextTierInfo.nextTier.benefits.length - 3} more benefits
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Max Tier Achievement */}
        {progress.isMaxTier && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg text-center">
            <Trophy className="h-12 w-12 mx-auto mb-2 text-purple-600" />
            <h4 className="font-bold text-purple-900 mb-1">Maximum Tier Achieved!</h4>
            <p className="text-sm text-purple-700">
              Congratulations! You've reached the highest membership level.
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            Book Visit
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Star className="h-4 w-4 mr-2" />
            Leave Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MembershipLevelCard;