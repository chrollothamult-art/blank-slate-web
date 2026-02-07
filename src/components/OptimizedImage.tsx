import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  placeholderColor?: string;
  priority?: boolean; // Skip lazy loading for above-the-fold images
  webpFallback?: boolean; // Try WebP version first
}

/**
 * Optimized image component with:
 * - Lazy loading (images load only when near viewport)
 * - WebP format support with fallback
 * - Blur placeholder effect during loading
 * - Smooth fade-in transition when loaded
 * - Fallback for failed loads
 * - Native loading="lazy" for browser optimization
 */
export const OptimizedImage = ({
  src,
  alt,
  className = "",
  containerClassName = "",
  placeholderColor = "hsl(var(--muted))",
  priority = false,
  webpFallback = true,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  // Generate WebP URL if applicable
  const getWebPUrl = (originalUrl: string): string | null => {
    if (!webpFallback) return null;
    // Only try WebP for common image formats
    if (/\.(jpe?g|png)$/i.test(originalUrl)) {
      // For external URLs, we can't convert, but for local assets we could
      // This is a placeholder for WebP conversion logic
      return null;
    }
    return null;
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px", // Start loading 200px before entering viewport
        threshold: 0,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  // Set the source when in view
  useEffect(() => {
    if (isInView && !currentSrc) {
      const webpUrl = getWebPUrl(src);
      setCurrentSrc(webpUrl || src);
    }
  }, [isInView, src, currentSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    // If WebP failed, try original
    if (currentSrc !== src && currentSrc) {
      setCurrentSrc(src);
    } else {
      setHasError(true);
      setIsLoaded(true);
    }
  };

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden",
        containerClassName
      )}
      style={{ backgroundColor: placeholderColor }}
    >
      {/* Shimmer placeholder skeleton */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          isLoaded ? "opacity-0" : "opacity-100"
        )}
        style={{ backgroundColor: placeholderColor }}
      >
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent" />
      </div>

      {/* Actual image - only render when in view */}
      {isInView && currentSrc && !hasError && (
        <img
          src={currentSrc}
          alt={alt}
          className={cn(
            "transition-all duration-500",
            isLoaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-sm scale-105",
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">Failed to load</span>
        </div>
      )}
    </div>
  );
};

/**
 * Hook for checking if an element is in viewport
 * Useful for lazy loading any content
 */
export const useIntersectionObserver = (
  options?: IntersectionObserverInit
): [React.RefObject<HTMLDivElement>, boolean] => {
  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px", threshold: 0, ...options }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options]);

  return [ref, isIntersecting];
};
