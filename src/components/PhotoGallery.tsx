import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { VisitPhoto, Visit } from "../types";
import { visitHelpers } from "../lib/supabase-helpers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Image,
  Calendar,
  User,
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface PhotoGalleryProps {
  memberId?: string;
  visitId?: string;
  hairstylistId?: string;
  showPrivatePhotos?: boolean;
  className?: string;
}

interface PhotoWithVisit extends VisitPhoto {
  visit?: Visit;
}

interface VisitPhotoGroup {
  visit: Visit;
  beforePhotos: VisitPhoto[];
  afterPhotos: VisitPhoto[];
  allPhotos: VisitPhoto[];
}

const PhotoGallery = ({
  memberId,
  visitId,
  hairstylistId,
  showPrivatePhotos = false,
  className = "",
}: PhotoGalleryProps) => {
  const [visitGroups, setVisitGroups] = useState<VisitPhotoGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithVisit | null>(
    null
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<"all" | "before" | "after">("all");
  const navigate = useNavigate();

  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true);

      // Build query based on props
      let visits: Visit[] = [];

      if (visitId) {
        // Get specific visit photos
        visits = await visitHelpers.getVisitsWithDetails({ limit: 1 });
        visits = visits.filter((v) => v.id === visitId);
      } else if (memberId) {
        // Get all photos for a member
        visits = await visitHelpers.getVisitsWithDetails({
          member_id: memberId,
        });
      } else if (hairstylistId) {
        // Get all photos for a hairstylist
        visits = await visitHelpers.getVisitsWithDetails({
          hairstylist_id: hairstylistId,
        });
      }

      // Group photos by visit
      const groups: VisitPhotoGroup[] = [];

      visits.forEach((visit) => {
        if (visit.photos && visit.photos.length > 0) {
          const beforePhotos = visit.photos.filter(
            (photo: VisitPhoto) =>
              photo.photo_type === "before" &&
              (showPrivatePhotos || photo.is_public)
          );

          const afterPhotos = visit.photos.filter(
            (photo: VisitPhoto) =>
              photo.photo_type === "after" &&
              (showPrivatePhotos || photo.is_public)
          );

          const allPhotos = visit.photos.filter(
            (photo: VisitPhoto) => showPrivatePhotos || photo.is_public
          );

          // Only include visits that have visible photos
          if (allPhotos.length > 0) {
            groups.push({
              visit,
              beforePhotos,
              afterPhotos,
              allPhotos: allPhotos.sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              ),
            });
          }
        }
      });

      // Sort groups by visit date (newest first)
      groups.sort(
        (a, b) =>
          new Date(b.visit.visit_date).getTime() -
          new Date(a.visit.visit_date).getTime()
      );

      setVisitGroups(groups);
    } catch (error) {
      console.error("❌ Error loading photos:", error);
      setError("Failed to load photos");
    } finally {
      setLoading(false);
    }
  }, [memberId, visitId, hairstylistId, showPrivatePhotos]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Calculate total photos count
  const totalPhotos = visitGroups.reduce(
    (total, group) => total + group.allPhotos.length,
    0
  );
  const totalBefore = visitGroups.reduce(
    (total, group) => total + group.beforePhotos.length,
    0
  );
  const totalAfter = visitGroups.reduce(
    (total, group) => total + group.afterPhotos.length,
    0
  );

  const openLightbox = (photo: VisitPhoto, visitGroup: VisitPhotoGroup) => {
    setSelectedPhoto({ ...photo, visit: visitGroup.visit });
    setCurrentIndex(0);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
    setCurrentIndex(0);
  };

  const navigatePhoto = (direction: "prev" | "next") => {
    const newIndex =
      direction === "prev"
        ? (currentIndex - 1 + filteredPhotos.length) % filteredPhotos.length
        : (currentIndex + 1) % filteredPhotos.length;

    setCurrentIndex(newIndex);
    setSelectedPhoto(filteredPhotos[newIndex]);
  };

  const downloadPhoto = async (photo: PhotoWithVisit) => {
    try {
      const response = await fetch(photo.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${photo.photo_type}_${format(
        new Date(photo.created_at),
        "yyyy-MM-dd"
      )}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Photo downloaded");
    } catch (error) {
      console.error("Failed to download photo:", error);
      toast.error("Failed to download photo");
    }
  };

  const getPhotoTypeColor = (type: string) => {
    switch (type) {
      case "before":
        return "bg-red-100 text-red-800";
      case "after":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const viewMemberDetail = (memberId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent photo lightbox from opening
    navigate(`/members/${memberId}/biodata`);
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (visitGroups.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Photos Yet
        </h3>
        <p className="text-gray-600">
          {visitId
            ? "No photos have been uploaded for this visit."
            : memberId
            ? "No photos found for this member."
            : "No photos found."}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          {visitGroups.length} Visit{visitGroups.length !== 1 ? "s" : ""}
        </span>
        <span>•</span>
        <span>{totalPhotos} Total Photos</span>
        <span>•</span>
        <span>{totalBefore} Before</span>
        <span>•</span>
        <span>{totalAfter} After</span>
      </div>

      {/* Visit Groups */}
      <div className="space-y-8">
        {visitGroups.map((group, groupIndex) => (
          <Card key={group.visit.id} className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Visit -{" "}
                      {format(new Date(group.visit.visit_date), "MMM d, yyyy")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {group.allPhotos.length} photo
                      {group.allPhotos.length !== 1 ? "s" : ""}
                      {group.beforePhotos.length > 0 &&
                        group.afterPhotos.length > 0 &&
                        ` (${group.beforePhotos.length} before, ${group.afterPhotos.length} after)`}
                    </p>
                  </div>
                </div>

                {/* Member Info */}
                {group.visit.member && (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {group.visit.member.user_profile?.full_name ||
                          "Unknown Member"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {group.visit.member.membership_tier
                          ?.charAt(0)
                          .toUpperCase() +
                          group.visit.member.membership_tier?.slice(1) ||
                          "Bronze"}{" "}
                        Member
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) =>
                        viewMemberDetail(group.visit.member!.id, e)
                      }
                      className="text-xs"
                    >
                      <UserCheck className="h-3 w-3 mr-1" />
                      Detail
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <CardContent className="p-6">
              {/* Before & After Section */}
              {group.beforePhotos.length > 0 &&
                group.afterPhotos.length > 0 && (
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Before Photos */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={getPhotoTypeColor("before")}>
                          Before ({group.beforePhotos.length})
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {group.beforePhotos
                          .slice(0, 4)
                          .map((photo, photoIndex) => (
                            <div
                              key={photo.id}
                              className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg border-2 border-red-100 hover:border-red-300 transition-colors"
                              onClick={() => openLightbox(photo, group)}
                            >
                              <img
                                src={photo.file_url}
                                alt={photo.description || "Before photo"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* After Photos */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={getPhotoTypeColor("after")}>
                          After ({group.afterPhotos.length})
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {group.afterPhotos
                          .slice(0, 4)
                          .map((photo, photoIndex) => (
                            <div
                              key={photo.id}
                              className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg border-2 border-green-100 hover:border-green-300 transition-colors"
                              onClick={() => openLightbox(photo, group)}
                            >
                              <img
                                src={photo.file_url}
                                alt={photo.description || "After photo"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* All Photos (when no before/after separation or additional photos) */}
              {(group.beforePhotos.length === 0 ||
                group.afterPhotos.length === 0) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">
                      All Photos ({group.allPhotos.length})
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {group.allPhotos.map((photo, photoIndex) => (
                      <div
                        key={photo.id}
                        className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg border hover:shadow-md transition-shadow"
                        onClick={() => openLightbox(photo, group)}
                      >
                        <img
                          src={photo.file_url}
                          alt={photo.description || `${photo.photo_type} photo`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge
                            className={getPhotoTypeColor(photo.photo_type)}
                          >
                            {photo.photo_type}
                          </Badge>
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          {selectedPhoto && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <DialogHeader className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      <Badge
                        className={getPhotoTypeColor(selectedPhoto.photo_type)}
                      >
                        {selectedPhoto.photo_type}
                      </Badge>
                      {selectedPhoto.visit?.member && (
                        <span>
                          {selectedPhoto.visit.member.user_profile?.full_name}
                        </span>
                      )}
                    </DialogTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {format(
                        new Date(selectedPhoto.created_at),
                        "MMMM d, yyyy at h:mm a"
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadPhoto(selectedPhoto)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>

                    {!selectedPhoto.is_public && (
                      <Badge variant="secondary">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* Image Container */}
              <div className="flex-1 relative bg-black">
                <img
                  src={selectedPhoto.file_url}
                  alt={
                    selectedPhoto.description ||
                    `${selectedPhoto.photo_type} photo`
                  }
                  className="w-full h-full object-contain"
                />

                {/* Photo Info */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {selectedPhoto.photo_type} photo
                </div>
              </div>

              {/* Download Button */}
              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = selectedPhoto.file_url;
                    link.download = `${selectedPhoto.photo_type}-photo-${format(
                      new Date(selectedPhoto.created_at),
                      "yyyy-MM-dd"
                    )}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Photo
                </Button>
              </div>

              {/* Footer with description */}
              {selectedPhoto.description && (
                <div className="p-4 border-t bg-gray-50">
                  <p className="text-sm text-gray-700">
                    {selectedPhoto.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhotoGallery;
