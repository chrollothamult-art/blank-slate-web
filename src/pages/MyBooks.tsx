import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { EbookReader } from "@/components/EbookReader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReadingStats } from "@/components/ReadingStats";
import { BookProgressCard } from "@/components/BookProgressCard";
import { useReadingProgress } from "@/hooks/useReadingProgress";

interface Purchase {
  id: string;
  book_id: string;
  book_title: string;
  book_author: string;
  book_cover_url: string | null;
  book_version: string;
  price: number;
  purchased_at: string;
  ebook_pdf_url?: string | null;
  pages?: number;
}

export const MyBooks = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [selectedBook, setSelectedBook] = useState<{
    url: string; 
    title: string; 
    bookId: string;
  } | null>(null);

  const { allProgress, stats, getProgressForBook, refetch } = useReadingProgress();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!user) return;

      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", user.id)
        .order("purchased_at", { ascending: false });

      if (!purchaseError && purchaseData) {
        // Fetch book PDF URLs and pages
        const bookIds = [...new Set(purchaseData.map(p => p.book_id))];
        const { data: booksData } = await supabase
          .from("books")
          .select("id, ebook_pdf_url, pages")
          .in("id", bookIds);

        const booksMap = new Map(booksData?.map(b => [b.id, { 
          ebook_pdf_url: b.ebook_pdf_url, 
          pages: b.pages 
        }]) || []);
        
        const enrichedPurchases = purchaseData.map(p => ({
          ...p,
          ebook_pdf_url: booksMap.get(p.book_id)?.ebook_pdf_url,
          pages: booksMap.get(p.book_id)?.pages || 100
        }));

        setPurchases(enrichedPurchases);
      }
      setLoadingPurchases(false);
    };

    if (user) {
      fetchPurchases();
    }
  }, [user]);

  const handleCloseViewer = () => {
    setSelectedBook(null);
    refetch(); // Refresh progress after reading
  };

  if (loading || loadingPurchases) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your books...</p>
      </div>
    );
  }

  const ebooks = purchases.filter(p => p.book_version === "ebook");
  const paperbacks = purchases.filter(p => p.book_version === "paperback");
  const hardcovers = purchases.filter(p => p.book_version === "hardcover");

  // Get recently read books (sorted by last_read_at)
  const recentlyRead = ebooks
    .filter(p => getProgressForBook(p.book_id))
    .sort((a, b) => {
      const progressA = getProgressForBook(a.book_id);
      const progressB = getProgressForBook(b.book_id);
      if (!progressA || !progressB) return 0;
      return new Date(progressB.last_read_at).getTime() - new Date(progressA.last_read_at).getTime();
    })
    .slice(0, 3);

  const renderBookCard = (purchase: Purchase) => {
    const progress = getProgressForBook(purchase.book_id);
    
    return (
      <BookProgressCard
        key={purchase.id}
        purchase={purchase}
        progress={progress}
        onRead={() => {
          if (purchase.ebook_pdf_url) {
            setSelectedBook({
              url: purchase.ebook_pdf_url,
              title: purchase.book_title,
              bookId: purchase.book_id,
            });
          }
        }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold mb-2">My Books</h1>
            <p className="text-muted-foreground">Access all your purchased books and track your reading progress</p>
          </div>

          {/* Reading Statistics */}
          {ebooks.length > 0 && <ReadingStats stats={stats} />}

          {/* Continue Reading Section */}
          {recentlyRead.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-heading font-semibold mb-4">Continue Reading</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentlyRead.map(renderBookCard)}
              </div>
            </div>
          )}

          {purchases.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground mb-2">No books purchased yet</p>
                <p className="text-sm text-muted-foreground">
                  Browse our collection and start your reading journey
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({purchases.length})</TabsTrigger>
                <TabsTrigger value="ebooks">E-books ({ebooks.length})</TabsTrigger>
                <TabsTrigger value="paperback">Paperback ({paperbacks.length})</TabsTrigger>
                <TabsTrigger value="hardcover">Hardcover ({hardcovers.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {purchases.map(renderBookCard)}
                </div>
              </TabsContent>
              
              <TabsContent value="ebooks" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ebooks.length > 0 ? ebooks.map(renderBookCard) : (
                    <p className="text-muted-foreground col-span-3 text-center py-8">No e-books purchased</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="paperback" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paperbacks.length > 0 ? paperbacks.map(renderBookCard) : (
                    <p className="text-muted-foreground col-span-3 text-center py-8">No paperback books purchased</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="hardcover" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hardcovers.length > 0 ? hardcovers.map(renderBookCard) : (
                    <p className="text-muted-foreground col-span-3 text-center py-8">No hardcover books purchased</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {selectedBook && (
        <EbookReader
          pdfUrl={selectedBook.url}
          title={selectedBook.title}
          bookId={selectedBook.bookId}
          isOpen={true}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
};
