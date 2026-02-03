import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface GalleryImage {
  id: string;
  image_url: string;
  caption?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  mainImage?: string | null;
  altText?: string;
}

export const ImageGallery = ({ images, mainImage, altText = "Gallery image" }: ImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const isMobile = useIsMobile();

  // Combine main image with gallery images
  const allImages: GalleryImage[] = [
    ...(mainImage ? [{ id: "main", image_url: mainImage, caption: "Main image" }] : []),
    ...images,
  ];

  // Handle keyboard navigation for desktop lightbox
  useEffect(() => {
    if (!isLightboxOpen || isMobile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "Escape") setIsLightboxOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, isMobile]);

  if (allImages.length === 0) {
    return null;
  }

  const currentImage = allImages[selectedIndex];

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  // Desktop lightbox using portal
  const desktopLightbox = isLightboxOpen && !isMobile ? createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
      onClick={() => setIsLightboxOpen(false)}
    >
      <button
        onClick={() => setIsLightboxOpen(false)}
        className="absolute top-4 right-4 z-[10000] text-white hover:text-white/80 p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <X className="h-8 w-8" />
      </button>

      {allImages.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            className="absolute left-4 z-[10000] text-white hover:text-white/80 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-4 z-[10000] text-white hover:text-white/80 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="h-10 w-10" />
          </button>
        </>
      )}

      <div 
        className="flex items-center justify-center p-8 box-border"
        style={{ width: '100vw', height: '100vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.image_url}
          alt={currentImage.caption || altText}
          style={{
            maxWidth: 'calc(100vw - 120px)',
            maxHeight: 'calc(100vh - 100px)',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
          }}
        />
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center z-[10000]">
        {currentImage.caption && (
          <p className="text-white text-base mb-1">{currentImage.caption}</p>
        )}
        {allImages.length > 1 && (
          <p className="text-white/70 text-sm">
            {selectedIndex + 1} / {allImages.length}
          </p>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="space-y-4">
      {/* Main Display Image */}
      <div 
        className="relative group cursor-pointer overflow-hidden rounded-lg"
        onClick={() => setIsLightboxOpen(true)}
      >
        <img
          src={currentImage.image_url}
          alt={currentImage.caption || altText}
          className="w-full h-96 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ZoomIn className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
        {currentImage.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="text-white text-sm">{currentImage.caption}</p>
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                selectedIndex === index
                  ? "border-[#d4af37] shadow-lg scale-105"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <img
                src={image.image_url}
                alt={image.caption || `Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Arrow Navigation */}
      {allImages.length > 1 && (
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            className="rounded-full"
            style={{ borderColor: '#d4af37', color: '#3d2817' }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="flex items-center text-sm" style={{ color: '#5a4a3a' }}>
            {selectedIndex + 1} / {allImages.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            className="rounded-full"
            style={{ borderColor: '#d4af37', color: '#3d2817' }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Desktop Lightbox Portal */}
      {desktopLightbox}

      {/* Mobile Dialog */}
      {isMobile && (
        <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <DialogContent 
            className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-2 bg-black/95 border-none"
          >
            <div className="relative flex items-center justify-center">
              {allImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToPrevious}
                    className="absolute left-0 z-50 text-white hover:bg-white/20 h-8 w-8"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToNext}
                    className="absolute right-0 z-50 text-white hover:bg-white/20 h-8 w-8"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}

              <img
                src={currentImage.image_url}
                alt={currentImage.caption || altText}
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>

            <div className="text-center mt-2">
              {currentImage.caption && (
                <p className="text-white text-sm mb-1">{currentImage.caption}</p>
              )}
              {allImages.length > 1 && (
                <p className="text-white/70 text-xs">
                  {selectedIndex + 1} / {allImages.length}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
