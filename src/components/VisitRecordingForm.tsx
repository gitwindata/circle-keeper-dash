import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  X,
  FileText,
  Eye,
  EyeOff,
} from "lucide-react";
import { ServiceManager } from "../lib/service-manager";
import { serviceHelpers, notesHelpers } from "../lib/supabase-helpers";
import { MembershipCalculator } from "../lib/membership-calculator";
import {
  memberHelpers,
  visitHelpers,
  photoHelpers,
} from "../lib/supabase-helpers";
import { Member, Service, MembershipTier } from "../types";
import { toast } from "sonner";

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
  type: "before" | "after";
}

interface MemberNote {
  id: string;
  hairstylist_id: string;
  member_id: string;
  note: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  hairstylist: {
    id: string;
    user_profile: {
      full_name: string;
    } | null;
  } | null;
}

interface MemberVisitHistory {
  id: string;
  visit_date: string;
  total_price: number;
  final_price: number;
  hairstylist_notes?: string;
  hairstylist: {
    user_profile: {
      full_name: string;
    } | null;
  } | null;
  visit_services: Array<{
    service: {
      name: string;
      category: string;
      base_price: number;
    };
  }>;
}

const VisitRecordingForm: React.FC<VisitRecordingFormProps> = ({
  hairstylistId,
  assignedMembers,
  onVisitRecorded,
  onCancel,
  preSelectedMemberId,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState(
    preSelectedMemberId || ""
  );
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    []
  );
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [customDiscount, setCustomDiscount] = useState(0);
  const [hairstylistNotes, setHairstylistNotes] = useState("");
  const [personalNotes, setPersonalNotes] = useState("");
  const [beforePhotos, setBeforePhotos] = useState<PhotoUpload[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<PhotoUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Member & Services, 2: Photos & Notes, 3: Review
  const [memberNotesHistory, setMemberNotesHistory] = useState<MemberNote[]>([]);
  const [loadingNotesHistory, setLoadingNotesHistory] = useState(false);
  const [showNotesHistory, setShowNotesHistory] = useState(false);
  const [memberVisitHistory, setMemberVisitHistory] = useState<any[]>([]);
  const [loadingVisitHistory, setLoadingVisitHistory] = useState(false);
  const [showVisitHistory, setShowVisitHistory] = useState(false);

  // Load services from Supabase
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoadingServices(true);
        const services = await serviceHelpers.getAllServices();
        setAvailableServices(services);
      } catch (error) {
        console.error("Failed to load services:", error);
        toast.error("Failed to load services");
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, []);

  const loadNotesHistory = useCallback(async (memberId: string) => {
    try {
      setLoadingNotesHistory(true);
      const notes = await notesHelpers.getNotesForMember(memberId, hairstylistId);
      setMemberNotesHistory(notes);
    } catch (error) {
      console.error('Error loading notes history:', error);
      // Don't show error toast for notes loading failure
    } finally {
      setLoadingNotesHistory(false);
    }
  }, [hairstylistId]);

  const loadVisitHistory = useCallback(async (memberId: string) => {
    try {
      setLoadingVisitHistory(true);
      const client = await import("../lib/supabase").then(m => m.supabase);
      const { data, error } = await client
        .from('visits')
        .select(`
          id,
          visit_date,
          total_price,
          final_price,
          hairstylist_notes,
          hairstylist:hairstylists(
            user_profile:user_profiles(full_name)
          ),
          visit_services(
            service:services(
              name,
              category,
              base_price
            )
          )
        `)
        .eq('member_id', memberId)
        .order('visit_date', { ascending: false })
        .limit(10); // Batasi 10 visit terakhir

      if (error) {
        console.error('Error loading visit history:', error);
      } else {
      setMemberVisitHistory(data || []);
      }
    } catch (error) {
      console.error('Error loading visit history:', error);
    } finally {
      setLoadingVisitHistory(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMemberId) {
      const member = assignedMembers.find((m) => m.id === selectedMemberId);
      setSelectedMember(member || null);
      
      // Load notes and visit history for the selected member
      loadNotesHistory(selectedMemberId);
      loadVisitHistory(selectedMemberId);
    }
  }, [selectedMemberId, assignedMembers, loadNotesHistory, loadVisitHistory]);

  const addService = async (serviceId: string) => {
    const service = availableServices.find((s) => s.id === serviceId);
    if (!service) return;

    // Check if service already added
    if (selectedServices.some((s) => s.serviceId === serviceId)) {
      toast.error("Service already added");
      return;
    }

    setSelectedServices((prev) => [
      ...prev,
      {
        serviceId,
        service,
      },
    ]);
  };

  const removeService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.filter((s) => s.serviceId !== serviceId)
    );
  };

  const updateServicePrice = (serviceId: string, price: number) => {
    setSelectedServices((prev) =>
      prev.map((s) =>
        s.serviceId === serviceId ? { ...s, customPrice: price } : s
      )
    );
  };

  const updateServiceNotes = (serviceId: string, notes: string) => {
    setSelectedServices((prev) =>
      prev.map((s) => (s.serviceId === serviceId ? { ...s, notes } : s))
    );
  };

  const calculateTotals = () => {
    const baseTotal = selectedServices.reduce(
      (sum, s) => sum + (s.customPrice || s.service.base_price),
      0
    );
    const membershipDiscount = selectedMember
      ? ServiceManager.getMembershipDiscount(selectedMember.membership_tier)
      : 0;
    const totalDiscount = Math.max(customDiscount, membershipDiscount);
    const finalPrice = baseTotal * (1 - totalDiscount / 100);
    const totalDuration = selectedServices.reduce(
      (sum, s) => sum + s.service.duration_minutes,
      0
    );

    return {
      baseTotal,
      membershipDiscount,
      customDiscount,
      totalDiscount,
      finalPrice: Math.round(finalPrice),
      totalDuration,
      pointsEarned: selectedMember
        ? MembershipCalculator.calculatePointsFromVisit(
            finalPrice,
            selectedMember.membership_tier
          )
        : 0,
    };
  };

  const validateServices = () => {
    if (selectedServices.length === 0) {
      return { isValid: false, message: "Please select at least one service" };
    }

    const serviceIds = selectedServices.map((s) => s.serviceId);
    const validation = ServiceManager.validateServiceCombination(serviceIds);

    return {
      isValid: validation.isValid,
      message: validation.conflicts[0] || "",
      warnings: validation.warnings,
      suggestions: validation.suggestions,
    };
  };

  const handlePhotoUpload = (
    files: FileList | null,
    type: "before" | "after"
  ) => {
    if (!files) return;

    const newPhotos: PhotoUpload[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file);
        newPhotos.push({ file, preview, type });
      }
    });

    if (type === "before") {
      setBeforePhotos((prev) => [...prev, ...newPhotos]);
    } else {
      setAfterPhotos((prev) => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (index: number, type: "before" | "after") => {
    if (type === "before") {
      setBeforePhotos((prev) => {
        URL.revokeObjectURL(prev[index].preview);
        return prev.filter((_, i) => i !== index);
      });
    } else {
      setAfterPhotos((prev) => {
        URL.revokeObjectURL(prev[index].preview);
        return prev.filter((_, i) => i !== index);
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedMember) {
      toast.error("Please select a member");
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
        service_ids: selectedServices.map((s) => s.serviceId),
        total_price: totals.finalPrice,
        discount_percentage: totals.totalDiscount,
        final_price: totals.finalPrice,
        hairstylist_notes: hairstylistNotes || undefined,
        visit_date: new Date().toISOString(),
      };

      console.log("🚀 Creating visit with data:", visitData);
      console.log("💰 Visit totals:", {
        services: selectedServices.length,
        baseTotal: totals.baseTotal,
        totalDiscount: totals.totalDiscount,
        finalPrice: totals.finalPrice,
        pointsEarned: totals.pointsEarned,
      });
      
      const newVisit = await visitHelpers.createVisit(visitData);
      const visitId = newVisit.id;

      console.log("✅ Visit created successfully:", {
        visitId,
        memberId: visitData.member_id,
        finalPrice: visitData.final_price,
        visit: newVisit
      });

      // Upload photos if any
      const photoUploadPromises: Promise<void>[] = [];

      // Upload before photos
      beforePhotos.forEach((photo, index) => {
        if (photo.file) {
          console.log(`📤 Uploading before photo ${index + 1}...`);
          photoUploadPromises.push(
            photoHelpers.uploadAndSavePhoto(
              photo.file,
              visitId,
              "before",
              hairstylistId,
              `Before photo ${index + 1}`
            )
          );
        }
      });

      // Upload after photos
      afterPhotos.forEach((photo, index) => {
        if (photo.file) {
          console.log(`📤 Uploading after photo ${index + 1}...`);
          photoUploadPromises.push(
            photoHelpers.uploadAndSavePhoto(
              photo.file,
              visitId,
              "after",
              hairstylistId,
              `After photo ${index + 1}`
            )
          );
        }
      });

      // Wait for all photo uploads to complete
      if (photoUploadPromises.length > 0) {
        console.log(`📸 Uploading ${photoUploadPromises.length} photos...`);
        await Promise.all(photoUploadPromises);
        console.log("✅ All photos uploaded successfully!");
      }

      // Save personal notes if any
      if (personalNotes.trim()) {
        try {
          console.log("💾 Saving personal notes...");
          await notesHelpers.createNote({
            hairstylist_id: hairstylistId,
            member_id: selectedMember.id,
            note: personalNotes.trim(),
            is_private: true
          });
          console.log("✅ Personal notes saved successfully!");
        } catch (notesError) {
          console.error("⚠️ Failed to save personal notes:", notesError);
          // Don't fail the entire visit if notes saving fails
        }
      }

      // Verify member points were updated
      console.log("🔍 Verifying member points update...");
      try {
        // Direct query to members table instead of using getMemberWithProfile
        const { supabase } = await import("../lib/supabase");
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('id, membership_points, total_visits, total_spent, last_visit_date, membership_tier')
          .eq('id', visitData.member_id)
          .single();
          
        if (memberError) {
          console.error("⚠️ Failed to verify member points:", memberError);
        } else {
          console.log("📊 Member data after visit:", {
            memberId: visitData.member_id,
            membership_points: memberData?.membership_points,
            total_visits: memberData?.total_visits,
            total_spent: memberData?.total_spent,
            last_visit_date: memberData?.last_visit_date,
            membership_tier: memberData?.membership_tier
          });
        }
      } catch (verificationError) {
        console.error("⚠️ Failed to verify member points:", verificationError);
      }

      toast.success(
        `Visit recorded successfully! ${
          photoUploadPromises.length > 0
            ? `${photoUploadPromises.length} photos uploaded.`
            : ""
        }`
      );
      onVisitRecorded();
    } catch (error) {
      console.error("💥 Failed to record visit:", error);
      toast.error("Failed to record visit: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = calculateTotals();
  const validation = validateServices();
  const canProceedToStep2 =
    selectedMember && selectedServices.length > 0 && validation.isValid;
  const canSubmit = canProceedToStep2 && currentStep === 3;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
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
            <div
              className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${
                currentStep >= step
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }
            `}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                className={`
                w-16 h-1 mx-2
                ${currentStep > step ? "bg-blue-600" : "bg-gray-200"}
              `}
              />
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
              <CardDescription>
                Choose which member is visiting today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedMemberId}
                onValueChange={setSelectedMemberId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a member..." />
                </SelectTrigger>
                <SelectContent>
                  {assignedMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-3">
                        <span>{member.user_profile?.full_name}</span>
                        <Badge
                          className={`${MembershipCalculator.getTierColor(
                            member.membership_tier
                          )} text-white`}
                        >
                          {MembershipCalculator.formatTierName(
                            member.membership_tier
                          )}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedMember && (
                <div className="mt-4 space-y-4">
                  {/* Basic Member Info */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Visits:</span>
                        <p className="font-medium">
                          {selectedMember.total_visits}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Spent:</span>
                        <p className="font-medium">
                          {formatCurrency(selectedMember.total_spent)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Discount:</span>
                        <p className="font-medium text-green-600">
                          {ServiceManager.getMembershipDiscount(
                            selectedMember.membership_tier
                          )}
                          %
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* History Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Notes History */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">Previous Notes</span>
                        </div>
                        {memberNotesHistory.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowNotesHistory(!showNotesHistory)}
                          >
                            {showNotesHistory ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>

                      {loadingNotesHistory ? (
                        <div className="flex items-center justify-center py-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
                        </div>
                      ) : memberNotesHistory.length === 0 ? (
                        <p className="text-sm text-gray-500">No previous notes</p>
                      ) : showNotesHistory ? (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {memberNotesHistory.slice(0, 3).map((note) => (
                            <div key={note.id} className="text-xs border-b pb-2 last:border-b-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-700">
                                  {note.hairstylist?.user_profile?.full_name || 'Unknown'}
                                </span>
                                <span className="text-gray-400">
                                  {new Date(note.created_at).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                              <p className="text-gray-600 line-clamp-2">{note.note}</p>
                            </div>
                          ))}
                          {memberNotesHistory.length > 3 && (
                            <p className="text-xs text-blue-600">+{memberNotesHistory.length - 3} more notes</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-blue-600 cursor-pointer" onClick={() => setShowNotesHistory(true)}>
                          {memberNotesHistory.length} notes available - click to view
                        </p>
                      )}
                    </div>

                    {/* Visit History */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Recent Visits</span>
                        </div>
                        {memberVisitHistory.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowVisitHistory(!showVisitHistory)}
                          >
                            {showVisitHistory ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>

                      {loadingVisitHistory ? (
                        <div className="flex items-center justify-center py-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
                        </div>
                      ) : memberVisitHistory.length === 0 ? (
                        <p className="text-sm text-gray-500">No previous visits</p>
                      ) : showVisitHistory ? (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {memberVisitHistory.slice(0, 3).map((visit) => (
                            <div key={visit.id} className="text-xs border-b pb-2 last:border-b-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-gray-400 text-xs">
                                  {new Date(visit.visit_date).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                                <span className="text-gray-500 text-xs">
                                  {formatCurrency(visit.final_price)}
                                </span>
                              </div>
                              <div className="space-y-1">
                                {visit.visit_services?.map((vs: {service: {name: string, category: string}}, idx: number) => (
                                  <span key={idx} className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1 mb-1">
                                    {vs.service?.name}
                                  </span>
                                ))}
                              </div>
                              {visit.hairstylist_notes && (
                                <p className="text-gray-600 text-xs mt-1 italic line-clamp-1">
                                  "{visit.hairstylist_notes}"
                                </p>
                              )}
                            </div>
                          ))}
                          {memberVisitHistory.length > 3 && (
                            <p className="text-xs text-blue-600">+{memberVisitHistory.length - 3} more visits</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm">
                          <p className="text-gray-600 mb-1">{memberVisitHistory.length} visits available</p>
                          {memberVisitHistory.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500">Recent services:</p>
                              <div className="flex flex-wrap gap-1">
                                {memberVisitHistory[0]?.visit_services?.slice(0, 3).map((vs: {service: {name: string}}, idx: number) => (
                                  <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                    {vs.service?.name}
                                  </span>
                                ))}
                                {memberVisitHistory[0]?.visit_services?.length > 3 && (
                                  <span className="text-xs text-gray-500">...</span>
                                )}
                              </div>
                              <p className="text-xs text-blue-600 cursor-pointer mt-1" onClick={() => setShowVisitHistory(true)}>
                                Click to view all visits
                              </p>
                            </div>
                          )}
                        </div>
                      )}
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
              <CardDescription>
                Choose the services performed during this visit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Service Categories */}
              {loadingServices ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">
                      Loading services...
                    </p>
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
                      disabled={selectedServices.some(
                        (s) => s.serviceId === service.id
                      )}
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(service.base_price)} •{" "}
                          {formatDuration(service.duration_minutes)}
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
                    <div
                      key={selected.serviceId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {selected.service.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDuration(selected.service.duration_minutes)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={
                            selected.customPrice || selected.service.base_price
                          }
                          onChange={(e) =>
                            updateServicePrice(
                              selected.serviceId,
                              parseInt(e.target.value)
                            )
                          }
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
                  onChange={(e) =>
                    setCustomDiscount(parseInt(e.target.value) || 0)
                  }
                  className="w-32"
                />
                <p className="text-sm text-gray-600">
                  Member discount:{" "}
                  {selectedMember
                    ? ServiceManager.getMembershipDiscount(
                        selectedMember.membership_tier
                      )
                    : 0}
                  %
                  {totals.totalDiscount >
                    (selectedMember
                      ? ServiceManager.getMembershipDiscount(
                          selectedMember.membership_tier
                        )
                      : 0) && ` (Using custom: ${totals.totalDiscount}%)`}
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
                    <span>
                      -{formatCurrency(totals.baseTotal - totals.finalPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Final Total:</span>
                    <span>{formatCurrency(totals.finalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      Duration: {formatDuration(totals.totalDuration)}
                    </span>
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
              <CardDescription>
                Add before and after photos (optional)
              </CardDescription>
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
                    onChange={(e) =>
                      handlePhotoUpload(e.target.files, "before")
                    }
                    className="hidden"
                    id="before-photos"
                  />
                  <label htmlFor="before-photos" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Click to upload before photos
                    </p>
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
                          onClick={() => removePhoto(index, "before")}
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
                    onChange={(e) => handlePhotoUpload(e.target.files, "after")}
                    className="hidden"
                    id="after-photos"
                  />
                  <label htmlFor="after-photos" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Click to upload after photos
                    </p>
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
                          onClick={() => removePhoto(index, "after")}
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
              <CardTitle className="flex items-center justify-between">
                <span>Notes</span>
                {selectedMember && memberNotesHistory.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNotesHistory(!showNotesHistory)}
                  >
                    {showNotesHistory ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide History
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        View History ({memberNotesHistory.length})
                      </>
                    )}
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                Add any notes about this visit
                {selectedMember && memberNotesHistory.length > 0 && showNotesHistory && (
                  <span> and view previous notes</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Notes History */}
              {selectedMember && showNotesHistory && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Previous Notes for {selectedMember.user_profile?.full_name}</span>
                  </div>
                  
                  {loadingNotesHistory ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Loading notes...</span>
                    </div>
                  ) : memberNotesHistory.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                      <div className="space-y-3 p-4">
                        {memberNotesHistory.map((note) => (
                          <div key={note.id} className="border-b pb-3 last:border-b-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {note.hairstylist?.user_profile?.full_name || 'Unknown Hairstylist'}
                                </span>
                                {note.hairstylist_id === hairstylistId ? (
                                  <Badge variant="default" className="text-xs">Your Note</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    {note.is_private ? 'Private' : 'Shared'}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(note.created_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {note.note}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg">
                      No previous notes found for this member
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <span className="text-sm font-medium">Add New Notes:</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="hairstylist-notes">
                  Hairstylist Notes (Visible to member)
                </Label>
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
            <Button onClick={() => setCurrentStep(3)}>Next: Review</Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 3 && selectedMember && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Visit Details</CardTitle>
              <CardDescription>
                Please review all details before recording the visit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Member Info */}
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">Member</h4>
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    {selectedMember.user_profile?.full_name}
                  </span>
                  <Badge
                    className={`${MembershipCalculator.getTierColor(
                      selectedMember.membership_tier
                    )} text-white`}
                  >
                    {MembershipCalculator.formatTierName(
                      selectedMember.membership_tier
                    )}
                  </Badge>
                </div>
              </div>

              {/* Services */}
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">Services</h4>
                <div className="space-y-2">
                  {selectedServices.map((selected) => (
                    <div
                      key={selected.serviceId}
                      className="flex justify-between"
                    >
                      <span>{selected.service.name}</span>
                      <span>
                        {formatCurrency(
                          selected.customPrice || selected.service.base_price
                        )}
                      </span>
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
                    <span>
                      -{formatCurrency(totals.baseTotal - totals.finalPrice)}
                    </span>
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
                    {beforePhotos.length > 0 && (
                      <span>Before: {beforePhotos.length} photos</span>
                    )}
                    {beforePhotos.length > 0 && afterPhotos.length > 0 && (
                      <span> • </span>
                    )}
                    {afterPhotos.length > 0 && (
                      <span>After: {afterPhotos.length} photos</span>
                    )}
                  </div>
                </div>
              )}

              {/* Notes Summary */}
              {(hairstylistNotes || personalNotes) && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  {hairstylistNotes && (
                    <div className="mb-2">
                      <span className="text-sm font-medium">
                        Hairstylist Notes:
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        {hairstylistNotes}
                      </p>
                    </div>
                  )}
                  {personalNotes && (
                    <div>
                      <span className="text-sm font-medium">
                        Personal Notes:
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        {personalNotes}
                      </p>
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
              {isSubmitting ? "Recording..." : "Record Visit"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitRecordingForm;
