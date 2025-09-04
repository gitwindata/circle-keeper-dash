import { Crown, Star, Calendar, Phone, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Member, MembershipTier } from '@/types'
import { cn } from '@/lib/utils'

const membershipColors = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-200',
  silver: 'bg-gray-100 text-gray-800 border-gray-200', 
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  platinum: 'bg-blue-100 text-blue-800 border-blue-200',
  diamond: 'bg-purple-100 text-purple-800 border-purple-200'
}

const membershipIcons = {
  bronze: Star,
  silver: Star,
  gold: Crown,
  platinum: Crown,
  diamond: Crown
}

interface MemberCardProps {
  member: Member
  onViewDetails?: () => void
  onAddVisit?: () => void
}

export function MemberCard({ member, onViewDetails, onAddVisit }: MemberCardProps) {
  const MembershipIcon = membershipIcons[member.membership_tier as keyof typeof membershipIcons]
  const displayName = member.user_profile?.full_name || `Member ${member.id.slice(0, 8)}`
  const displayEmail = member.user_profile?.email
  const displayPhone = member.user_profile?.phone
  const avatarUrl = member.user_profile?.avatar_url
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-orange-100 text-orange-600 font-semibold">
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                {displayName}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs",
                    membershipColors[member.membership_tier as keyof typeof membershipColors]
                  )}
                >
                  <MembershipIcon className="w-3 h-3 mr-1" />
                  {member.membership_tier.charAt(0).toUpperCase() + member.membership_tier.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Info */}
        <div className="space-y-2">
          {displayPhone && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{displayPhone}</span>
            </div>
          )}
          {displayEmail && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="truncate">{displayEmail}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{member.total_visits}</div>
            <div className="text-xs text-gray-500">Total Visits</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              Rp {member.total_spent?.toLocaleString('id-ID') || '0'}
            </div>
            <div className="text-xs text-gray-500">Total Spent</div>
          </div>
        </div>

        {/* Last Visit */}
        {member.last_visit_date && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>Last visit: {new Date(member.last_visit_date).toLocaleDateString('id-ID')}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewDetails}
            className="flex-1 h-9 border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            View Details
          </Button>
          <Button 
            size="sm" 
            onClick={onAddVisit}
            className="flex-1 h-9 bg-orange-500 hover:bg-orange-600 text-white"
          >
            Add Visit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
