import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Scissors, 
  Clock, 
  DollarSign, 
  Camera, 
  Plus, 
  Minus, 
  AlertTriangle,
  CheckCircle,
  Upload,
  X
} from "lucide-react";
import { ServiceManager } from '../lib/service-manager';
import { serviceHelpers } from '../lib/supabase-helpers';
import { MembershipCalculator } from '../lib/membership-calculator';
import { memberHelpers, visitHelpers } from '../lib/supabase-helpers';
import { Member, Service, MembershipTier } from '../types';
import { toast } from 'sonner';

interface VisitRecordingFormProps {
  hairstylistId: string;
  assignedMembers: Member[];
  onVisitRecorded: () => void;
  onCancel: () => void;
  preSelectedMemberId?: string;
}

interface SelectedService {
  serviceId: string;
  service: Service;
  customPrice?: number;
  notes?: string;
}

interface PhotoUpload {
  file: File;
  preview: string;
  type: 'before' | 'after';
}

const VisitRecordingForm: React.FC<VisitRecordingFormProps> = ({
  hairstylistId,
  assignedMembers,
  onVisitRecorded,
  onCancel,
  preSelectedMemberId
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState(preSelectedMemberId || '');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [customDiscount, setCustomDiscount] = useState(0);
  const [hairstylistNotes, setHairstylistNotes] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');
  const [beforePhotos, setBeforePhotos] = useState<PhotoUpload[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<PhotoUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Member & Services, 2: Photos & Notes, 3: Review

  // Load services from Supabase
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoadingServices(true);
        const services = await serviceHelpers.getAllServices();
        setAvailableServices(services);
      } catch (error) {
        console.error('Failed to load services:', error);
        toast.error('Failed to load services');
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, []);

  useEffect(() => {
    if (selectedMemberId) {
      const member = assignedMembers.find(m => m.id === selectedMemberId);
      setSelectedMember(member || null);
    }
  }, [selectedMemberId, assignedMembers]);

    const addService = async (serviceId: string) => {
    const service = availableServices.find(s => s.id === serviceId);
    if (!service) return;

    // Check if service already added
    if (selectedServices.some(s => s.serviceId === serviceId)) {
      toast.error('Service already added');
      return;
    }

    setSelectedServices(prev => [...prev, {
      serviceId,
      service,
    }]);
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.serviceId !== serviceId));
  };

  const updateServicePrice = (serviceId: string, price: number) => {
    setSelectedServices(prev => prev.map(s => 
      s.serviceId === serviceId ? { ...s, customPrice: price } : s
    ));
  };

  const updateServiceNotes = (serviceId: string, notes: string) => {
    setSelectedServices(prev => prev.map(s => 
      s.serviceId === serviceId ? { ...s, notes } : s
    ));
  };

  const calculateTotals = () => {
    const baseTotal = selectedServices.reduce((sum, s) => sum + (s.customPrice || s.service.base_price), 0);
    const membershipDiscount = selectedMember ? ServiceManager.getMembershipDiscount(selectedMember.membership_tier) : 0;
    const totalDiscount = Math.max(customDiscount, membershipDiscount);
    const finalPrice = baseTotal * (1 - totalDiscount / 100);
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.service.duration_minutes, 0);

    return {
      baseTotal,
      membershipDiscount,
      customDiscount,
      totalDiscount,
      finalPrice: Math.round(finalPrice),
      totalDuration,
      pointsEarned: selectedMember ? MembershipCalculator.calculatePointsFromVisit(finalPrice, selectedMember.membership_tier) : 0
    };
  };

  const validateServices = () => {
    if (selectedServices.length === 0) {
      return { isValid: false, message: 'Please select at least one service' };
    }

    const serviceIds = selectedServices.map(s => s.serviceId);
    const validation = ServiceManager.validateServiceCombination(serviceIds);
    
    return {
      isValid: validation.isValid,
      message: validation.conflicts[0] || '',
      warnings: validation.warnings,
      suggestions: validation.suggestions
    };
  };

  const handlePhotoUpload = (files: FileList | null, type: 'before' | 'after') => {
    if (!files) return;

    const newPhotos: PhotoUpload[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        newPhotos.push({ file, preview, type });
      }
    });

    if (type === 'before') {
      setBeforePhotos(prev => [...prev, ...newPhotos]);
    } else {
      setAfterPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (index: number, type: 'before' | 'after') => {
    if (type === 'before') {
      setBeforePhotos(prev => {
        URL.revokeObjectURL(prev[index].preview);
        return prev.filter((_, i) => i !== index);
      });
    } else {
      setAfterPhotos(prev => {
        URL.revokeObjectURL(prev[index].preview);
        return prev.filter((_, i) => i !== index);
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedMember) {
      toast.error('Please select a member');
      return;
    }

    const validation = validateServices();
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    setIsSubmitting(true);

    try {
      const totals = calculateTotals();
      
      // Create visit record
      const visitData = {
        member_id: selectedMember.id,
        hairstylist_id: hairstylistId,
        service_ids: selectedServices.map(s => s.serviceId),
        total_price: totals.finalPrice,
        discount_percentage: totals.totalDiscount,
        final_price: totals.finalPrice,
        hairstylist_notes: hairstylistNotes || undefined,
        visit_date: new Date().toISOString()
      };

      await visitHelpers.createVisit(visitData);
      
      toast.success('Visit recorded successfully!');
      onVisitRecorded();

    } catch (error: any) {
      console.error('Failed to record visit:', error);
      toast.error('Failed to record visit: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = calculateTotals();
  const validation = validateServices();
  const canProceedToStep2 = selectedMember && selectedServices.length > 0 && validation.isValid;
  const canSubmit = canProceedToStep2 && currentStep === 3;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${currentStep >= step 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
              }
            `}>
              {step}
            </div>
            {step < 3 && (
              <div className={`
                w-16 h-1 mx-2
                ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}
              `} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Member & Services Selection */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Member Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Member</CardTitle>
              <CardDescription>Choose which member is visiting today</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member..." />
                </SelectTrigger>
                <SelectContent>
                  {assignedMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-3">
                        <span>{member.user_profile?.full_name}</span>
                        <Badge className={`${MembershipCalculator.getTierColor(member.membership_tier)} text-white`}>
                          {MembershipCalculator.formatTierName(member.membership_tier)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedMember && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Visits:</span>
                      <p className="font-medium">{selectedMember.total_visits}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Spent:</span>
                      <p className="font-medium">{formatCurrency(selectedMember.total_spent)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Discount:</span>
                      <p className="font-medium text-green-600">
                        {ServiceManager.getMembershipDiscount(selectedMember.membership_tier)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Services</CardTitle>
              <CardDescription>Choose the services performed during this visit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Service Categories */}
              {loadingServices ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading services...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {availableServices.map((service) => (
                    <Button
                      key={service.id}
                      variant="outline"
                      className="h-auto p-4 text-left justify-start"
                      onClick={() => addService(service.id)}
                      disabled={selectedServices.some(s => s.serviceId === service.id)}
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(service.base_price)} • {formatDuration(service.duration_minutes)}
                        </div>
                        <Badge variant="secondary">{service.category}</Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              )}

              {/* Selected Services */}
              {selectedServices.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Selected Services</h4>
                  {selectedServices.map((selected) => (
                    <div key={selected.serviceId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{selected.service.name}</div>
                        <div className="text-sm text-gray-600">
                          {formatDuration(selected.service.duration_minutes)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={selected.customPrice || selected.service.base_price}
                          onChange={(e) => updateServicePrice(selected.serviceId, parseInt(e.target.value))}
                          className="w-24"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(selected.serviceId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Service Validation */}
              {selectedServices.length > 0 && (
                <div className="space-y-2">
                  {validation.warnings?.map((warning, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ))}
                  
                  {validation.suggestions?.map((suggestion, index) => (
                    <Alert key={index}>
                      <AlertDescription className="text-blue-600">
                        💡 {suggestion}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Custom Discount */}
              <div className="space-y-2">
                <Label htmlFor="discount">Custom Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="50"
                  value={customDiscount}
                  onChange={(e) => setCustomDiscount(parseInt(e.target.value) || 0)}
                  className="w-32"
                />
                <p className="text-sm text-gray-600">
                  Member discount: {selectedMember ? ServiceManager.getMembershipDiscount(selectedMember.membership_tier) : 0}%
                  {totals.totalDiscount > (selectedMember ? ServiceManager.getMembershipDiscount(selectedMember.membership_tier) : 0) && 
                    ` (Using custom: ${totals.totalDiscount}%)`
                  }
                </p>
              </div>

              {/* Totals Summary */}
              {selectedServices.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(totals.baseTotal)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({totals.totalDiscount}%):</span>
                    <span>-{formatCurrency(totals.baseTotal - totals.finalPrice)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Final Total:</span>
                    <span>{formatCurrency(totals.finalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Duration: {formatDuration(totals.totalDuration)}</span>
                    <span>Points Earned: {totals.pointsEarned}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedToStep2}
            >
              Next: Photos & Notes
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Photos & Notes */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Photo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Photos</CardTitle>
              <CardDescription>Add before and after photos (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Before Photos */}
              <div className="space-y-3">
                <Label>Before Photos</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e.target.files, 'before')}
                    className="hidden"
                    id="before-photos"
                  />
                  <label htmlFor="before-photos" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Click to upload before photos</p>
                  </label>
                </div>
                
                {beforePhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {beforePhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo.preview}
                          alt={`Before ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 p-1 h-6 w-6"
                          onClick={() => removePhoto(index, 'before')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* After Photos */}
              <div className="space-y-3">
                <Label>After Photos</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e.target.files, 'after')}
                    className="hidden"
                    id="after-photos"
                  />
                  <label htmlFor="after-photos" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Click to upload after photos</p>
                  </label>
                </div>
                
                {afterPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {afterPhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo.preview}
                          alt={`After ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 p-1 h-6 w-6"
                          onClick={() => removePhoto(index, 'after')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Add any notes about this visit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hairstylist-notes">Hairstylist Notes (Visible to member)</Label>
                <Textarea
                  id="hairstylist-notes"
                  placeholder="Notes about the service, results, or recommendations..."
                  value={hairstylistNotes}
                  onChange={(e) => setHairstylistNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personal-notes">Personal Notes (Private)</Label>
                <Textarea
                  id="personal-notes"
                  placeholder="Private notes about member preferences, hair condition, etc..."
                  value={personalNotes}
                  onChange={(e) => setPersonalNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button onClick={() => setCurrentStep(3)}>
              Next: Review
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 3 && selectedMember && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Visit Details</CardTitle>
              <CardDescription>Please review all details before recording the visit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Member Info */}
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">Member</h4>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{selectedMember.user_profile?.full_name}</span>
                  <Badge className={`${MembershipCalculator.getTierColor(selectedMember.membership_tier)} text-white`}>
                    {MembershipCalculator.formatTierName(selectedMember.membership_tier)}
                  </Badge>
                </div>
              </div>

              {/* Services */}
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">Services</h4>
                <div className="space-y-2">
                  {selectedServices.map((selected) => (
                    <div key={selected.serviceId} className="flex justify-between">
                      <span>{selected.service.name}</span>
                      <span>{formatCurrency(selected.customPrice || selected.service.base_price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">Totals</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(totals.baseTotal)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({totals.totalDiscount}%):</span>
                    <span>-{formatCurrency(totals.baseTotal - totals.finalPrice)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Final Total:</span>
                    <span>{formatCurrency(totals.finalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Points Earned:</span>
                    <span>{totals.pointsEarned}</span>
                  </div>
                </div>
              </div>

              {/* Photos Summary */}
              {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
                <div className="border-b pb-4">
                  <h4 className="font-medium mb-2">Photos</h4>
                  <div className="text-sm text-gray-600">
                    {beforePhotos.length > 0 && <span>Before: {beforePhotos.length} photos</span>}
                    {beforePhotos.length > 0 && afterPhotos.length > 0 && <span> • </span>}
                    {afterPhotos.length > 0 && <span>After: {afterPhotos.length} photos</span>}
                  </div>
                </div>
              )}

              {/* Notes Summary */}
              {(hairstylistNotes || personalNotes) && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  {hairstylistNotes && (
                    <div className="mb-2">
                      <span className="text-sm font-medium">Hairstylist Notes:</span>
                      <p className="text-sm text-gray-600 mt-1">{hairstylistNotes}</p>
                    </div>
                  )}
                  {personalNotes && (
                    <div>
                      <span className="text-sm font-medium">Personal Notes:</span>
                      <p className="text-sm text-gray-600 mt-1">{personalNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Back
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? 'Recording...' : 'Record Visit'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitRecordingForm;