import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, 
  Heart, 
  Share2, 
  Eye,
  ShoppingCart,
  Plus,
  Minus
} from "lucide-react";
import bookCoverDefault from "@/assets/book-cover-default.jpg";
import { Book3D } from "./Book3D";
import { ReviewList } from "./ReviewList";
import { ReviewForm } from "./ReviewForm";

interface BookVersion {
  type: "ebook" | "paperback" | "hardcover";
  price: number;
  available: boolean;
}

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  rating: number;
  reviewCount: number;
  category: string;
  isbn: string;
  publishedDate: string;
  pages: number;
  language: string;
  versions: BookVersion[];
}

interface BookDisplayProps {
  book?: Book & { cover?: string };
  onAddToCart?: (item: any) => void;
}

export const BookDisplay = ({ book, onAddToCart }: BookDisplayProps) => {
  const [selectedVersion, setSelectedVersion] = useState<BookVersion["type"]>("paperback");
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [reviewsKey, setReviewsKey] = useState(0);
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const fetchRatingData = async () => {
      if (!book?.id) return;
      
      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("book_id", book.id);

      if (!error && data) {
        const avgRating = data.length > 0 
          ? data.reduce((sum, review) => sum + review.rating, 0) / data.length 
          : 0;
        setRating(avgRating);
        setReviewCount(data.length);
      }
    };

    fetchRatingData();
  }, [book?.id, reviewsKey]);

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="max-w-md">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold mb-2">No Books Available</h2>
          <p className="text-muted-foreground">
            There are currently no books in our collection. Please check back later or contact us for more information.
          </p>
        </div>
      </div>
    );
  }

  const selectedPrice = book.versions.find(v => v.type === selectedVersion)?.price || 0;
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? "fill-accent text-accent" 
            : i < rating 
            ? "fill-accent/50 text-accent" 
            : "text-muted-foreground"
        }`}
      />
    ));
  };

  const formatVersionName = (type: BookVersion["type"]) => {
    return type === "ebook" ? "E-book" : type.charAt(0).toUpperCase() + type.slice(1);
  };

  const handleAddToCart = () => {
    const selectedVersionData = book.versions.find(v => v.type === selectedVersion);
    if (selectedVersionData && onAddToCart) {
      onAddToCart({
        id: book.id,
        title: book.title,
        author: book.author,
        price: selectedVersionData.price,
        quantity: quantity,
        version: selectedVersion,
        cover: book.cover || bookCoverDefault
      });
    }
  };

  const handleReviewSubmitted = () => {
    setReviewsKey(prev => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:p-6 space-y-6 md:space-y-8">
      {/* Book Display Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
      {/* Book Cover */}
      <div className="flex justify-center lg:justify-end">
        <div className="relative group">
          <img
            src={book.cover || bookCoverDefault}
            alt={book.title}
            className="w-48 md:w-64 h-auto book-shadow transition-book book-hover cursor-pointer"
            onClick={() => setShowPreview(true)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              className="bg-background/90 backdrop-blur"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Book Information */}
      <div className="space-y-4 md:space-y-6">
        {/* Title and Author */}
        <div>
          <Badge variant="secondary" className="mb-2 text-xs md:text-sm">
            {book.category}
          </Badge>
          <h1 className="text-2xl md:text-4xl font-playfair font-bold text-primary mb-2">
            {book.title}
          </h1>
          <p className="text-base md:text-xl text-muted-foreground">
            by <span className="text-accent font-medium">{book.author}</span>
          </p>
        </div>

        {/* Rating and Reviews */}
        <div className="flex items-center space-x-2 md:space-x-4 flex-wrap">
          <div className="flex items-center space-x-1">
            {renderStars(rating)}
          </div>
          <span className="text-base md:text-lg font-medium">{rating.toFixed(1)}</span>
          <span className="text-sm md:text-base text-muted-foreground">
            ({reviewCount.toLocaleString()} {reviewCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-base md:text-lg font-semibold mb-2">Description</h3>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {book.description}
          </p>
        </div>

        <Separator />

        {/* Version Selection */}
        <div>
          <h3 className="text-base md:text-lg font-semibold mb-3">Choose Format</h3>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {book.versions.map((version) => (
              <Card
                key={version.type}
                className={`p-2 md:p-4 cursor-pointer transition-all hover:border-accent ${
                  selectedVersion === version.type
                    ? "border-accent bg-accent/5"
                    : "border-border"
                } ${!version.available ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => version.available && setSelectedVersion(version.type)}
              >
                <div className="text-center relative">
                  <p className={`text-xs md:text-sm font-medium ${!version.available ? "line-through" : ""}`}>
                    {formatVersionName(version.type)}
                  </p>
                  <p className={`text-base md:text-lg font-bold text-accent ${!version.available ? "line-through" : ""}`}>
                    ${version.price.toFixed(2)}
                  </p>
                  {!version.available && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Badge variant="destructive" className="text-xs">Unavailable</Badge>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quantity and Actions */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="flex items-center border rounded">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:h-10 md:w-10"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <span className="w-10 md:w-12 text-center font-medium text-sm md:text-base">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:h-10 md:w-10"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
          
          <div className="text-xl md:text-2xl font-bold text-accent">
            ${(selectedPrice * quantity).toFixed(2)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 md:space-x-3">
          <Button 
            className="flex-1 btn-professional text-sm md:text-base h-9 md:h-10"
            disabled={!book.versions.find(v => v.type === selectedVersion)?.available}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 mr-2" />
            <span className="hidden sm:inline">Add to Cart</span>
            <span className="sm:hidden">Add</span>
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className={`h-9 w-9 md:h-10 md:w-10 ${isFavorite ? "text-destructive border-destructive" : ""}`}
            onClick={() => setIsFavorite(!isFavorite)}
          >
            <Heart className={`h-4 w-4 md:h-5 md:w-5 ${isFavorite ? "fill-current" : ""}`} />
          </Button>
          
          <Button variant="outline" size="icon" className="h-9 w-9 md:h-10 md:w-10">
            <Share2 className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>

        {/* Book Details */}
        <Card className="p-3 md:p-4">
          <h3 className="text-sm md:text-base font-semibold mb-2 md:mb-3">Book Details</h3>
          <div className="grid grid-cols-2 gap-y-2 text-xs md:text-sm">
            <div>
              <span className="text-muted-foreground">ISBN:</span>
              <span className="ml-2">{book.isbn}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Pages:</span>
              <span className="ml-2">{book.pages}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Published:</span>
              <span className="ml-2">{new Date(book.publishedDate).getFullYear()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Language:</span>
              <span className="ml-2">{book.language}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>

      {/* Reviews Section */}
      <div className="max-w-5xl mx-auto">
        <Tabs defaultValue="reviews" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="write">Write a Review</TabsTrigger>
          </TabsList>
          <TabsContent value="reviews" className="mt-6">
            <ReviewList key={reviewsKey} bookId={book.id} />
          </TabsContent>
          <TabsContent value="write" className="mt-6">
            <ReviewForm bookId={book.id} onReviewSubmitted={handleReviewSubmitted} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Book Preview Modal */}
      {showPreview && (
        <Book3D 
          book={book} 
          onClose={() => setShowPreview(false)} 
        />
      )}
    </div>
  );
};