import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  bookId: string;
  variant?: "icon" | "full";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const WishlistButton = ({
  bookId,
  variant = "icon",
  size = "default",
  className,
}: WishlistButtonProps) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(bookId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(bookId);
  };

  if (variant === "full") {
    return (
      <Button
        variant={inWishlist ? "default" : "outline"}
        size={size}
        onClick={handleClick}
        className={cn("gap-2", className)}
      >
        <Heart
          className={cn("h-4 w-4", inWishlist && "fill-current")}
        />
        {inWishlist ? "In Wishlist" : "Add to Wishlist"}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        "h-8 w-8 rounded-full",
        inWishlist
          ? "bg-primary/10 text-primary hover:bg-primary/20"
          : "hover:bg-muted",
        className
      )}
      title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-all",
          inWishlist && "fill-primary text-primary"
        )}
      />
    </Button>
  );
};
