import { useState, useEffect } from "react";
import {
  Review,
  ReviewFormData,
  ReviewType,
  Visit,
  Service,
  Hairstylist,
} from "../types";
import { supabase } from "../lib/supabase";
import { ServiceManager } from "../lib/service-manager";
import { useAuth } from "../hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Calendar,
  User,
  Scissors,
  Building2,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ReviewSystemProps {
  visitId?: string;
  memberId?: string;
  showSubmitForm?: boolean;
  className?: string;
  onReviewSubmitted?: () => void;
}

interface VisitForReview extends Visit {
  visit_services?: Array<{ service: Service }>;
  hairstylist?: Hairstylist;
  reviews?: Review[];
}

const ReviewSystem = ({
  visitId,
  memberId,
  showSubmitForm = false,
  className = "",
  onReviewSubmitted,
}: ReviewSystemProps) => {
  const { userProfile } = useAuth();
  const [visit, setVisit] = useState<VisitForReview | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeReviewType, setActiveReviewType] =
    useState<ReviewType>("service");
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    visit_id: visitId || "",
    review_type: "service",
    rating: 5,
    comment: "",
    is_anonymous: false,
  });

  useEffect(() => {
    if (visitId) {
      loadVisitAndReviews();
    } else if (memberId) {
      loadMemberReviews();
    }
  }, [visitId, memberId]);

  const loadVisitAndReviews = async () => {
    if (!visitId) return;

    try {
      setLoading(true);

      // Load visit with related data
      const { data: visitData, error: visitError } = await supabase
        .from("visits")
        .select(
          `
          *,
          visit_services(
            *,
            service:services(*)
          ),
          hairstylist:hairstylists(
            *,
            user_profile:user_profiles(*)
          ),
          reviews(*)
        `
        )
        .eq("id", visitId)
        .single();

      if (visitError) throw visitError;

      setVisit(visitData);
      setReviews(visitData.reviews || []);

      // Update form with visit ID
      setReviewForm((prev) => ({ ...prev, visit_id: visitId }));
    } catch (error: any) {
      console.error("Failed to load visit:", error);
      toast.error("Failed to load visit details");
    } finally {
      setLoading(false);
    }
  };

  const loadMemberReviews = async () => {
    if (!memberId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          *,
          visit:visits(
            *,
            visit_services(
              *,
              service:services(*)
            ),
            hairstylist:hairstylists(
              *,
              user_profile:user_profiles(*)
            )
          )
        `
        )
        .eq("member_id", memberId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      console.error("Failed to load reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!userProfile?.id) {
      toast.error("Please log in to submit a review");
      return;
    }

    // For visit-specific reviews, visit_id is required
    // For general reviews, visit_id can be null
    if (visitId && !reviewForm.visit_id) {
      toast.error("Missing visit information");
      return;
    }

    if (reviewForm.rating < 1 || reviewForm.rating > 5) {
      toast.error("Please select a rating between 1 and 5 stars");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("reviews").insert({
        visit_id: reviewForm.visit_id || null,
        member_id: userProfile.id,
        review_type: reviewForm.review_type,
        target_id: reviewForm.target_id || null,
        rating: reviewForm.rating,
        comment: reviewForm.comment || null,
        is_anonymous: reviewForm.is_anonymous,
      });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      setIsDialogOpen(false);

      // Reset form
      setReviewForm({
        visit_id: visitId || "",
        review_type: "service",
        rating: 5,
        comment: "",
        is_anonymous: false,
      });

      // Reload reviews
      if (visitId) {
        await loadVisitAndReviews();
      } else if (memberId) {
        await loadMemberReviews();
      }

      // Call the callback if provided
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error: any) {
      console.error("Failed to submit review:", error);
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewForm = (type: ReviewType, targetId?: string) => {
    setActiveReviewType(type);
    setReviewForm((prev) => ({
      ...prev,
      review_type: type,
      target_id: targetId,
      rating: 5,
      comment: "",
      is_anonymous: false,
    }));
    setIsDialogOpen(true);
  };

  const renderStars = (
    rating: number,
    interactive = false,
    onRatingChange?: (rating: number) => void
  ) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={() => interactive && onRatingChange?.(star)}
          />
        ))}
      </div>
    );
  };

  const getReviewTypeIcon = (type: ReviewType) => {
    switch (type) {
      case "service":
        return <Scissors className="h-4 w-4" />;
      case "hairstylist":
        return <User className="h-4 w-4" />;
      case "barbershop":
        return <Building2 className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getReviewTypeColor = (type: ReviewType) => {
    switch (type) {
      case "service":
        return "bg-blue-100 text-blue-800";
      case "hairstylist":
        return "bg-green-100 text-green-800";
      case "barbershop":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const hasExistingReview = (type: ReviewType, targetId?: string) => {
    return reviews.some(
      (review) =>
        review.review_type === type &&
        (targetId ? review.target_id === targetId : !review.target_id)
    );
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Visit Review Options (if visiting specific visit) */}
      {visit && showSubmitForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5" />
              Rate Your Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Service Reviews */}
              {visit.visit_services?.map((visitService, index) => {
                const service = visitService.service;
                const hasReview = hasExistingReview("service", service.id);

                return (
                  <Card
                    key={index}
                    className={`cursor-pointer transition-colors ${
                      hasReview
                        ? "bg-green-50 border-green-200"
                        : "hover:border-primary"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{service.name}</h4>
                        {hasReview ? (
                          <Badge className="bg-green-100 text-green-800">
                            Reviewed
                          </Badge>
                        ) : (
                          <Badge variant="outline">Rate</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-3">
                        {service.description}
                      </p>
                      <Button
                        size="sm"
                        variant={hasReview ? "outline" : "default"}
                        onClick={() => openReviewForm("service", service.id)}
                        disabled={hasReview}
                        className="w-full"
                      >
                        <Scissors className="h-4 w-4 mr-2" />
                        {hasReview ? "Already Reviewed" : "Rate Service"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Hairstylist Review */}
              {visit.hairstylist && (
                <Card
                  className={`cursor-pointer transition-colors ${
                    hasExistingReview("hairstylist", visit.hairstylist.id)
                      ? "bg-green-50 border-green-200"
                      : "hover:border-primary"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={visit.hairstylist.user_profile?.avatar_url}
                        />
                        <AvatarFallback>
                          {visit.hairstylist.user_profile?.full_name?.[0] ||
                            "H"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {visit.hairstylist.user_profile?.full_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Your Hairstylist
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={
                        hasExistingReview("hairstylist", visit.hairstylist.id)
                          ? "outline"
                          : "default"
                      }
                      onClick={() =>
                        openReviewForm("hairstylist", visit.hairstylist.id)
                      }
                      disabled={hasExistingReview(
                        "hairstylist",
                        visit.hairstylist.id
                      )}
                      className="w-full"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {hasExistingReview("hairstylist", visit.hairstylist.id)
                        ? "Already Reviewed"
                        : "Rate Hairstylist"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Barbershop Review */}
              <Card
                className={`cursor-pointer transition-colors ${
                  hasExistingReview("barbershop")
                    ? "bg-green-50 border-green-200"
                    : "hover:border-primary"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-8 w-8 text-purple-600 bg-purple-100 rounded-full p-2" />
                    <div>
                      <p className="font-medium text-sm">Haijoel Men's Salon</p>
                      <p className="text-xs text-gray-600">
                        Overall Experience
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={
                      hasExistingReview("barbershop") ? "outline" : "default"
                    }
                    onClick={() => openReviewForm("barbershop")}
                    disabled={hasExistingReview("barbershop")}
                    className="w-full"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    {hasExistingReview("barbershop")
                      ? "Already Reviewed"
                      : "Rate Barbershop"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews Display */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {visitId ? "Your Reviews for This Visit" : "Your Reviews"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={getReviewTypeColor(review.review_type)}
                          >
                            {getReviewTypeIcon(review.review_type)}
                            {review.review_type.charAt(0).toUpperCase() +
                              review.review_type.slice(1)}
                          </Badge>

                          {renderStars(review.rating)}

                          {review.is_anonymous && (
                            <Badge variant="outline" className="text-xs">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Anonymous
                            </Badge>
                          )}
                        </div>

                        {review.comment && (
                          <p className="text-sm text-gray-700 mb-2">
                            {review.comment}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(review.created_at), "MMM d, yyyy")}
                          </span>

                          {review.visit && (
                            <span>
                              Visit on{" "}
                              {format(
                                new Date(review.visit.visit_date),
                                "MMM d, yyyy"
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Review Options (if no specific visit) */}
      {!visit && showSubmitForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5" />
              Share Your Experience
            </CardTitle>
            <CardDescription>
              Leave a general review about our services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Barbershop Review */}
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-4">
                  <div className="text-center">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h4 className="font-medium text-gray-900">Salon Overall</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Rate the salon experience
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => {
                        setActiveReviewType("barbershop");
                        setReviewForm((prev) => ({
                          ...prev,
                          review_type: "barbershop",
                          target_id: undefined,
                        }));
                        setIsDialogOpen(true);
                      }}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Service Review */}
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-4">
                  <div className="text-center">
                    <Scissors className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h4 className="font-medium text-gray-900">Services</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Rate our services in general
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => {
                        setActiveReviewType("service");
                        setReviewForm((prev) => ({
                          ...prev,
                          review_type: "service",
                          target_id: undefined,
                        }));
                        setIsDialogOpen(true);
                      }}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Staff Review */}
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-4">
                  <div className="text-center">
                    <User className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <h4 className="font-medium text-gray-900">Staff</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Rate our staff service
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => {
                        setActiveReviewType("hairstylist");
                        setReviewForm((prev) => ({
                          ...prev,
                          review_type: "hairstylist",
                          target_id: undefined,
                        }));
                        setIsDialogOpen(true);
                      }}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {reviews.length === 0 && !showSubmitForm && (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Reviews Yet
            </h3>
            <p className="text-gray-600">
              {visitId
                ? "You haven submitted any reviews for this visit yet."
                : "You haven submitted any reviews yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review Submission Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getReviewTypeIcon(activeReviewType)}
              Rate{" "}
              {activeReviewType.charAt(0).toUpperCase() +
                activeReviewType.slice(1)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Rating */}
            <div className="space-y-2">
              <Label>Rating *</Label>
              <div className="flex items-center gap-2">
                {renderStars(reviewForm.rating, true, (rating) =>
                  setReviewForm((prev) => ({ ...prev, rating }))
                )}
                <span className="text-sm text-gray-600">
                  ({reviewForm.rating}/5)
                </span>
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">Comment (Optional)</Label>
              <Textarea
                id="comment"
                value={reviewForm.comment}
                onChange={(e) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                }
                placeholder={`Share your thoughts about the ${activeReviewType}...`}
                rows={3}
              />
            </div>

            {/* Anonymous Option */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-gray-600" />
                <div>
                  <Label htmlFor="anonymous" className="text-sm font-medium">
                    Submit Anonymously
                  </Label>
                  <p className="text-xs text-gray-600">
                    Your name won't be shown with this review
                  </p>
                </div>
              </div>

              <Switch
                id="anonymous"
                checked={reviewForm.is_anonymous}
                onCheckedChange={(checked) =>
                  setReviewForm((prev) => ({ ...prev, is_anonymous: checked }))
                }
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitReview} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewSystem;
