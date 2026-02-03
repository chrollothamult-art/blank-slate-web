import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  placeholderColor?: string;
  priority?: boolean; // Skip lazy loading for above-the-fold images
}

/**
 * Optimized image component with:
 * - Lazy loading (images load only when near viewport)
 * - Blur placeholder effect during loading
 * - Smooth fade-in transition when loaded
 * - Fallback for failed loads
 */
export const OptimizedImage = ({
  src,
  alt,
  className = "",
  containerClassName = "",
  placeholderColor = "hsl(var(--muted))",
  priority = false,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

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

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
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
      {isInView && !hasError && (
        <img
          src={src}
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
