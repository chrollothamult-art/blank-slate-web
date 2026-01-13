import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WishlistButton } from "@/components/WishlistButton";
import bookCollection from "@/assets/book-collection.jpg";

interface BookGalleryProps {
  onBookSelect: (book: any) => void;
  selectedBookId?: string;
}

export const BookGallery = ({ onBookSelect, selectedBookId }: BookGalleryProps) => {
  const [activeBooks, setActiveBooks] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, [selectedBookId]);

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from("books")
      .select(`
        *,
        book_versions (
          id,
          version_type,
          price,
          available
        )
      `)
      .eq("status", "active")
      .gt("stock", 0)
      .order("updated_at", { ascending: false });

    if (data) {
      // Filter out the currently selected book
      const filteredBooks = selectedBookId 
        ? data.filter(book => book.id !== selectedBookId)
        : data;
      setActiveBooks(filteredBooks);
    }
  };
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating) 
            ? "fill-accent text-accent" 
            : i < rating 
            ? "fill-accent/50 text-accent" 
            : "text-muted-foreground"
        }`}
      />
    ));
  };

  const handleBookClick = (book: any) => {
    // Transform the book data to match the BookDisplay interface
    const versions = book.book_versions?.map((v: any) => ({
      type: v.version_type as "ebook" | "paperback" | "hardcover",
      price: parseFloat(v.price),
      available: v.available
    })) || [];

    const transformedBook = {
      id: book.id,
      title: book.title,
      author: book.author,
      cover: book.cover_image_url || bookCollection,
      description: book.description || `A captivating ${book.category.toLowerCase()} that will keep you engaged from start to finish. This highly-rated book has garnered critical acclaim and reader praise alike.`,
      rating: book.rating || 4.0,
      reviewCount: Math.floor(Math.random() * 2000) + 500,
      category: book.category,
      isbn: book.isbn || `978-${Math.floor(Math.random() * 1000000000)}`,
      publishedDate: book.published_date || "2023-01-01",
      pages: book.pages || 288,
      language: book.language || "English",
      versions: versions.length > 0 ? versions : [
        { type: "ebook" as const, price: 9.99, available: true },
        { type: "paperback" as const, price: 12.99, available: true },
        { type: "hardcover" as const, price: 19.99, available: true }
      ]
    };
    
    onBookSelect(transformedBook);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-8 md:py-12 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary mb-2">
            More Books You'll Love
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Discover our curated selection of bestsellers and hidden gems
          </p>
        </div>

        {/* Horizontal Scrolling Gallery */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex space-x-4 md:space-x-6 w-max">
            {activeBooks.map((book) => (
              <Card
                key={book.id}
                className="flex-shrink-0 w-56 md:w-72 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-2 bg-card"
                onClick={() => handleBookClick(book)}
              >
                <div className="p-4 md:p-6">
                  {/* Book Cover */}
                  <div className="relative mb-4 group">
                    <div className="w-full aspect-[2/3] bg-muted rounded-md overflow-hidden book-shadow">
                      <img
                        src={book.cover_image_url || bookCollection}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Wishlist Button */}
                    <div className="absolute top-2 right-2 z-10">
                      <WishlistButton bookId={book.id} />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button size="sm" variant="secondary" className="bg-background/90 backdrop-blur">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Quick Add
                      </Button>
                    </div>
                  </div>

                  {/* Book Info */}
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-xs">
                      {book.category}
                    </Badge>
                    
                    <h3 className="font-playfair font-semibold text-lg leading-tight line-clamp-2">
                      {book.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground">
                      by {book.author}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {renderStars(book.rating || 4.0)}
                      </div>
                      <span className="text-sm font-medium">{book.rating || 4.0}</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-2">
                      {book.book_versions && book.book_versions.length > 0 && (
                        <>
                          <span className="text-lg font-bold text-accent">
                            ${Math.max(...book.book_versions.map((v: any) => parseFloat(v.price))).toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            from ${Math.min(...book.book_versions.map((v: any) => parseFloat(v.price))).toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-8">
          <Button 
            variant="outline" 
            className="btn-outline-professional"
            onClick={() => navigate("/books")}
          >
            View All Books
          </Button>
        </div>
      </div>
    </section>
  );
};