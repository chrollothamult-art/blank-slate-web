import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, ShoppingCart, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WishlistButton } from "@/components/WishlistButton";
import { BookSearchBar } from "@/components/BookSearchBar";
import { BookFilters, ActiveFilters, FilterState } from "@/components/BookFilters";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import bookCollection from "@/assets/book-collection.jpg";

type SortOption = "newest" | "price-asc" | "price-desc" | "rating" | "title";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "title", label: "Title A-Z" },
];

const defaultFilters: FilterState = {
  categories: [],
  minRating: 0,
  priceRange: [0, 50],
  formats: [],
};

export const Books = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  // Fetch books from database
  useEffect(() => {
    fetchBooks();
  }, []);

  // Update URL when search changes
  useEffect(() => {
    if (searchQuery) {
      searchParams.set("search", searchQuery);
    } else {
      searchParams.delete("search");
    }
    setSearchParams(searchParams, { replace: true });
  }, [searchQuery]);

  const fetchBooks = async () => {
    setLoading(true);
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
      .gt("stock", 0);

    if (data) {
      setBooks(data);
    }
    setLoading(false);
  };

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categories.length > 0) count += filters.categories.length;
    if (filters.minRating > 0) count += 1;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 50) count += 1;
    if (filters.formats.length > 0) count += filters.formats.length;
    return count;
  }, [filters]);

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.category?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      result = result.filter((book) =>
        filters.categories.includes(book.category)
      );
    }

    // Rating filter
    if (filters.minRating > 0) {
      result = result.filter((book) => (book.rating || 0) >= filters.minRating);
    }

    // Price filter
    result = result.filter((book) => {
      if (!book.book_versions || book.book_versions.length === 0) return true;
      const minPrice = Math.min(
        ...book.book_versions.map((v: any) => parseFloat(v.price))
      );
      return minPrice >= filters.priceRange[0] && minPrice <= filters.priceRange[1];
    });

    // Format filter
    if (filters.formats.length > 0) {
      result = result.filter((book) => {
        if (!book.book_versions) return false;
        return book.book_versions.some(
          (v: any) => filters.formats.includes(v.version_type) && v.available
        );
      });
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "price-asc":
        result.sort((a, b) => {
          const aMin = a.book_versions?.length
            ? Math.min(...a.book_versions.map((v: any) => parseFloat(v.price)))
            : 0;
          const bMin = b.book_versions?.length
            ? Math.min(...b.book_versions.map((v: any) => parseFloat(v.price)))
            : 0;
          return aMin - bMin;
        });
        break;
      case "price-desc":
        result.sort((a, b) => {
          const aMax = a.book_versions?.length
            ? Math.max(...a.book_versions.map((v: any) => parseFloat(v.price)))
            : 0;
          const bMax = b.book_versions?.length
            ? Math.max(...b.book_versions.map((v: any) => parseFloat(v.price)))
            : 0;
          return bMax - aMax;
        });
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [books, searchQuery, filters, sortBy]);

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    setSearchQuery("");
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

  const handleQuickAdd = (e: React.MouseEvent, book: any) => {
    e.stopPropagation();
    
    // Get the cheapest available version
    const availableVersions = book.book_versions?.filter((v: any) => v.available) || [];
    if (availableVersions.length === 0) {
      toast({
        title: "Not available",
        description: "This book is currently out of stock",
        variant: "destructive",
      });
      return;
    }

    const cheapestVersion = availableVersions.reduce((min: any, v: any) => 
      parseFloat(v.price) < parseFloat(min.price) ? v : min
    );

    addItem({
      id: book.id,
      title: book.title,
      cover: book.cover_image_url || bookCollection,
      version: cheapestVersion.version_type,
      price: parseFloat(cheapestVersion.price),
      quantity: 1,
    });

    toast({
      title: "Added to cart",
      description: `${book.title} (${cheapestVersion.version_type}) added to your cart`,
    });
  };

  const handleBookClick = (book: any) => {
    navigate(`/?book=${book.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-subtle border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-playfair font-bold text-primary mb-2">
              Browse Books
            </h1>
            <p className="text-muted-foreground">
              Discover our collection of historical fiction and fantasy novels
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-6 max-w-xl">
            <BookSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by title, author, or category..."
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <BookFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearAll={handleClearFilters}
            activeFilterCount={activeFilterCount}
          />

          {/* Books Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                {/* Mobile filter trigger is inside BookFilters */}
                <div className="lg:hidden">
                  <BookFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClearAll={handleClearFilters}
                    activeFilterCount={activeFilterCount}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {filteredBooks.length} book{filteredBooks.length !== 1 ? "s" : ""} found
                </span>
              </div>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters */}
            <div className="mb-6">
              <ActiveFilters
                filters={filters}
                onFiltersChange={setFilters}
                onClearAll={handleClearFilters}
              />
            </div>

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="w-full aspect-[2/3] bg-muted mb-4" />
                    <div className="h-4 bg-muted w-1/3 mb-2" />
                    <div className="h-5 bg-muted w-full mb-2" />
                    <div className="h-4 bg-muted w-2/3" />
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredBooks.length === 0 && (
              <div className="text-center py-16">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-playfair font-semibold mb-2">
                  No books found
                </h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear all filters
                </Button>
              </div>
            )}

            {/* Books Grid */}
            {!loading && filteredBooks.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBooks.map((book) => (
                  <Card
                    key={book.id}
                    className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-2 bg-card overflow-hidden"
                    onClick={() => handleBookClick(book)}
                  >
                    <div className="p-4">
                      {/* Book Cover */}
                      <div className="relative mb-4 group">
                        <div className="w-full aspect-[2/3] bg-muted overflow-hidden book-shadow">
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
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-background/90 backdrop-blur"
                            onClick={(e) => handleQuickAdd(e, book)}
                          >
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
                          <div className="flex space-x-0.5">
                            {renderStars(book.rating || 4.0)}
                          </div>
                          <span className="text-sm font-medium">
                            {(book.rating || 4.0).toFixed(1)}
                          </span>
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between pt-2">
                          {book.book_versions && book.book_versions.length > 0 && (
                            <>
                              <span className="text-lg font-bold text-accent">
                                $
                                {Math.min(
                                  ...book.book_versions.map((v: any) =>
                                    parseFloat(v.price)
                                  )
                                ).toFixed(2)}
                              </span>
                              {book.book_versions.length > 1 && (
                                <span className="text-xs text-muted-foreground">
                                  {book.book_versions.length} formats
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Books;
