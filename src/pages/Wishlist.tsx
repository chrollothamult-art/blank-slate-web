import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Heart, ShoppingCart, Trash2, BookOpen } from "lucide-react";
import { WishlistButton } from "@/components/WishlistButton";
import defaultCover from "@/assets/book-cover-default.jpg";

interface Book {
  id: string;
  title: string;
  author: string;
  cover_image_url: string | null;
  description: string | null;
}

interface WishlistItemWithBook {
  id: string;
  book_id: string;
  created_at: string;
  book: Book;
}

const Wishlist = () => {
  const { user } = useAuth();
  const { wishlist, loading: wishlistLoading, removeFromWishlist } = useWishlist();
  const [wishlistWithBooks, setWishlistWithBooks] = useState<WishlistItemWithBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      if (!wishlist.length) {
        setWishlistWithBooks([]);
        setLoading(false);
        return;
      }

      try {
        const bookIds = wishlist.map((item) => item.book_id);
        const { data: books, error } = await supabase
          .from("books")
          .select("id, title, author, cover_image_url, description")
          .in("id", bookIds);

        if (error) throw error;

        const itemsWithBooks = wishlist
          .map((item) => {
            const book = books?.find((b) => b.id === item.book_id);
            if (!book) return null;
            return { ...item, book };
          })
          .filter(Boolean) as WishlistItemWithBook[];

        setWishlistWithBooks(itemsWithBooks);
      } catch (error) {
        console.error("Error fetching wishlist books:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!wishlistLoading) {
      fetchBooks();
    }
  }, [wishlist, wishlistLoading]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-semibold">Sign in to view your wishlist</h2>
              <p className="text-muted-foreground">
                Save books you're interested in and access them anytime.
              </p>
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const isLoading = loading || wishlistLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
          <p className="text-muted-foreground">
            {wishlistWithBooks.length} {wishlistWithBooks.length === 1 ? "book" : "books"} saved
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-24 h-36 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : wishlistWithBooks.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center space-y-4">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold">Your wishlist is empty</h2>
              <p className="text-muted-foreground">
                Browse our collection and save books you'd like to read later.
              </p>
              <Button asChild>
                <Link to="/">Browse Books</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistWithBooks.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Link to={`/book/${item.book_id}`} className="shrink-0">
                      <img
                        src={item.book.cover_image_url || defaultCover}
                        alt={item.book.title}
                        className="w-24 h-36 object-cover rounded shadow-sm group-hover:shadow-md transition-shadow"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/book/${item.book_id}`}>
                        <h3 className="font-semibold text-lg truncate hover:text-primary transition-colors">
                          {item.book.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground mb-2">
                        by {item.book.author}
                      </p>
                      {item.book.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.book.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/book/${item.book_id}`}>
                            <BookOpen className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeFromWishlist(item.book_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Wishlist;
