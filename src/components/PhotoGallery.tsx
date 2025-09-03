import { useState, useEffect } from 'react';
import { VisitPhoto, Visit } from '../types';
import { visitHelpers } from '../lib/supabase-helpers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Calendar, User, Camera, ChevronLeft, ChevronRight, Download, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

const PhotoGallery = ({ 
  memberId, 
  visitId, 
  hairstylistId, 
  showPrivatePhotos = false,
  className = '' 
}: PhotoGalleryProps) => {
  const [photos, setPhotos] = useState<PhotoWithVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithVisit | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<'all' | 'before' | 'after'>('all');

  useEffect(() => {
    loadPhotos();
  }, [memberId, visitId, hairstylistId, showPrivatePhotos]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      
      // Build query based on props
      let visits: any[] = [];
      
      if (visitId) {
        // Get specific visit photos
        visits = await visitHelpers.getVisitsWithDetails({ limit: 1 });
        visits = visits.filter(v => v.id === visitId);
      } else if (memberId) {
        // Get all photos for a member
        visits = await visitHelpers.getVisitsWithDetails({ member_id: memberId });
      } else if (hairstylistId) {
        // Get all photos for a hairstylist
        visits = await visitHelpers.getVisitsWithDetails({ hairstylist_id: hairstylistId });
      }

      // Extract photos from visits
      const allPhotos: PhotoWithVisit[] = [];
      visits.forEach(visit => {
        if (visit.visit_photos) {
          visit.visit_photos.forEach((photo: VisitPhoto) => {
            // Filter private photos based on permissions
            if (!showPrivatePhotos && !photo.is_public) {
              return;
            }
            
            allPhotos.push({
              ...photo,
              visit: {
                id: visit.id,
                visit_date: visit.visit_date,
                member: visit.member,
                hairstylist: visit.hairstylist
              } as Visit
            });
          });
        }
      });

      // Sort by date (newest first)
      allPhotos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setPhotos(allPhotos);
    } catch (error) {
      console.error('Failed to load photos:', error);
      toast.error('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const filteredPhotos = photos.filter(photo => {
    if (filter === 'all') return true;
    return photo.photo_type === filter;
  });

  const openLightbox = (photo: PhotoWithVisit, index: number) => {
    setSelectedPhoto(photo);
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
    setCurrentIndex(0);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
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
      const link = document.createElement('a');
      link.href = url;
      link.download = `${photo.photo_type}_${format(new Date(photo.created_at), 'yyyy-MM-dd')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Photo downloaded');
    } catch (error) {
      console.error('Failed to download photo:', error);
      toast.error('Failed to download photo');
    }
  };

  const getPhotoTypeColor = (type: string) => {
    switch (type) {
      case 'before': return 'bg-red-100 text-red-800';
      case 'after': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Photos Yet</h3>
        <p className="text-gray-600">
          {visitId ? 'No photos have been uploaded for this visit.' : 
           memberId ? 'No photos found for this member.' :
           'No photos found.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
        <TabsList>
          <TabsTrigger value="all">All Photos ({photos.length})</TabsTrigger>
          <TabsTrigger value="before">
            Before ({photos.filter(p => p.photo_type === 'before').length})
          </TabsTrigger>
          <TabsTrigger value="after">
            After ({photos.filter(p => p.photo_type === 'after').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPhotos.map((photo, index) => (
          <Card 
            key={photo.id} 
            className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
            onClick={() => openLightbox(photo, index)}
          >
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <img
                  src={photo.file_url}
                  alt={photo.description || `${photo.photo_type} photo`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Overlay with info */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-end">
                  <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity w-full">
                    <div className="flex items-center justify-between">
                      <Badge className={getPhotoTypeColor(photo.photo_type)}>
                        {photo.photo_type}
                      </Badge>
                      {!photo.is_public && (
                        <EyeOff className="h-4 w-4" title="Private photo" />
                      )}
                    </div>
                    
                    <div className="mt-2 text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(photo.created_at), 'MMM d, yyyy')}
                      </div>
                      {photo.visit?.member && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {photo.visit.member.user_profile?.full_name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
                      <Badge className={getPhotoTypeColor(selectedPhoto.photo_type)}>
                        {selectedPhoto.photo_type}
                      </Badge>
                      {selectedPhoto.visit?.member && (
                        <span>{selectedPhoto.visit.member.user_profile?.full_name}</span>
                      )}
                    </DialogTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {format(new Date(selectedPhoto.created_at), 'MMMM d, yyyy at h:mm a')}
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
                  alt={selectedPhoto.description || `${selectedPhoto.photo_type} photo`}
                  className="w-full h-full object-contain"
                />
                
                {/* Navigation */}
                {filteredPhotos.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                      onClick={() => navigatePhoto('prev')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                      onClick={() => navigatePhoto('next')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
                
                {/* Photo counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentIndex + 1} of {filteredPhotos.length}
                </div>
              </div>

              {/* Footer with description */}
              {selectedPhoto.description && (
                <div className="p-4 border-t bg-gray-50">
                  <p className="text-sm text-gray-700">{selectedPhoto.description}</p>
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