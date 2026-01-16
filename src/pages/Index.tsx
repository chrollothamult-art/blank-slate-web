import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookDisplay } from "@/components/BookDisplay";
import { BookGallery } from "@/components/BookGallery";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import bookCollection from "@/assets/book-collection.jpg";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";

const Index = () => {
  const navigate = useNavigate();
  const [selectedBook, setSelectedBook] = useState<any>(undefined);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchMostRecentBook();
  }, []);

  const fetchMostRecentBook = async () => {
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
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      const versions = data.book_versions?.map((v: any) => ({
        type: v.version_type as "ebook" | "paperback" | "hardcover",
        price: parseFloat(v.price),
        available: v.available
      })) || [];

      const transformedBook = {
        id: data.id,
        title: data.title,
        author: data.author,
        cover: data.cover_image_url || bookCollection,
        description: data.description || `A captivating ${data.category.toLowerCase()} that will keep you engaged from start to finish.`,
        rating: data.rating || 4.0,
        reviewCount: Math.floor(Math.random() * 2000) + 500,
        category: data.category,
        isbn: data.isbn || `978-${Math.floor(Math.random() * 1000000000)}`,
        publishedDate: data.published_date || "2023-01-01",
        pages: data.pages || 288,
        language: data.language || "English",
        versions: versions.length > 0 ? versions : [
          { type: "ebook" as const, price: 9.99, available: true },
          { type: "paperback" as const, price: 12.99, available: true },
          { type: "hardcover" as const, price: 19.99, available: true }
        ]
      };
      
      setSelectedBook(transformedBook);
    }
  };

  const handleAddToCart = (item: { id: string; title: string; author: string; price: number; version: "ebook" | "paperback" | "hardcover"; cover?: string }) => {
    addToCart(item);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Chronology Button - Left Side */}
      <div className="fixed top-20 md:top-24 left-2 md:left-4 z-50">
        <Button 
          onClick={() => navigate('/chronology')}
          variant="default"
          className="bg-primary/90 backdrop-blur hover:bg-primary shadow-lg px-3 py-2 md:px-6 md:py-3 h-auto text-sm md:text-base font-semibold"
        >
          <span className="hidden sm:inline">Explore the Realms</span>
          <span className="sm:hidden">Realms</span>
        </Button>
      </div>

      {/* Featured Book Section */}
      <section className="pt-4 pb-6 md:pt-6 md:pb-8 px-4 md:px-0">
        <div className="container mx-auto">
          <BookDisplay book={selectedBook} onAddToCart={handleAddToCart} />
        </div>
      </section>

      {/* Book Gallery Section */}
      <BookGallery onBookSelect={setSelectedBook} selectedBookId={selectedBook?.id} />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
