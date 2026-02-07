import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { almanacCategories } from "@/data/chronologyData";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Network, Loader2, BookOpen, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageGallery } from "@/components/ImageGallery";
import { Footer } from "@/components/Footer";
import { BookSearchBar } from "@/components/BookSearchBar";
import { AlmanacReferenceParser } from "@/components/AlmanacReferenceParser";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import SocialButton from "@/components/ui/social-button";
import { useAlmanacEntries } from "@/hooks/useAlmanacEntries";
import { CategoryMetadataBadges } from "@/components/almanac/CategoryMetadataBadges";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAlmanacReadLimit } from "@/hooks/useAlmanacReadLimit";
import { AlmanacLoginPrompt } from "@/components/AlmanacLoginPrompt";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface PromoBook {
  id: string;
  title: string;
  author: string;
  cover_image_url: string | null;
}

interface AlmanacEntry {
  id: string;
  name: string;
  slug: string;
  description: string;
  article: string;
  image_url: string | null;
  is_disabled?: boolean;
  promo_enabled?: boolean;
  promo_text?: string | null;
  promo_link?: string | null;
  promo_book_id?: string | null;
  // Character-specific fields
  role?: string;
  affiliation?: string;
  era?: string;
  species?: string;
  abilities?: string;
  relationships?: string;
  // Kingdom-specific fields
  founded_date?: string;
  status?: string;
  // Location-specific fields
  location_type?: string;
  kingdom?: string;
  // Magic-specific fields
  magic_type?: string;
  difficulty?: string;
  // Relic-specific fields
  type?: string;
  power_level?: string;
  // Race-specific fields
  population?: string;
  homeland?: string;
  // Concept-specific fields
  concept_type?: string;
  // Title-specific fields
  rank?: string;
  authority?: string;
}

interface GalleryImage {
  id: string;
  image_url: string;
  caption?: string;
}

const categoryTableMap: Record<string, string> = {
  kingdoms: "almanac_kingdoms",
  relics: "almanac_relics",
  races: "almanac_races",
  titles: "almanac_titles",
  locations: "almanac_locations",
  magic: "almanac_magic",
  concepts: "almanac_concepts",
  characters: "almanac_characters",
};

const ITEMS_PER_PAGE = 9;

const AlmanacCategory = () => {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<AlmanacEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<AlmanacEntry | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [promoBook, setPromoBook] = useState<PromoBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Get user preference for infinite scroll
  const { infiniteScrollEnabled } = useUserPreferences();
  
  // Almanac read limit for non-logged-in users
  const { 
    canReadEntry, 
    recordEntryRead, 
    showLoginPrompt, 
    closeLoginPrompt 
  } = useAlmanacReadLimit();

  // Get all almanac entries for cross-referencing
  const { entries: allAlmanacEntries } = useAlmanacEntries();

  const category = almanacCategories.find((c) => c.id === categoryId);
  const tableName = categoryId ? categoryTableMap[categoryId] : null;
  const isCharacterCategory = categoryId === "characters";

  useEffect(() => {
    if (tableName) {
      fetchEntries();
    }
  }, [tableName]);

  // Handle entry URL parameter for deep linking and browser back/forward
  useEffect(() => {
    const entrySlug = searchParams.get("entry");
    if (entrySlug && entries.length > 0) {
      const entry = entries.find((e) => e.slug === entrySlug);
      if (entry) {
        setSelectedEntry(entry);
      }
    } else if (!entrySlug && selectedEntry) {
      // Browser back button was pressed, clear selection
      setSelectedEntry(null);
    }
  }, [searchParams, entries]);

  useEffect(() => {
    if (selectedEntry) {
      // Fetch gallery images - characters use their own table, others use the generic table
      if (isCharacterCategory) {
        fetchCharacterGalleryImages(selectedEntry.id);
      } else if (categoryId) {
        fetchGenericGalleryImages(selectedEntry.id, categoryId);
      }
    } else {
      setGalleryImages([]);
    }

    // Fetch promo book if entry has one
    if (selectedEntry?.promo_enabled && selectedEntry?.promo_book_id) {
      fetchPromoBook(selectedEntry.promo_book_id);
    } else {
      setPromoBook(null);
    }
  }, [selectedEntry, isCharacterCategory, categoryId]);

  const fetchEntries = async () => {
    if (!tableName) return;

    const { data, error } = await supabase
      .from(tableName as any)
      .select("*")
      .eq("is_disabled", false)
      .order("order_index", { ascending: true });

    if (!error && data) {
      setEntries(data as any);
    }
    setLoading(false);
  };

  const fetchCharacterGalleryImages = async (characterId: string) => {
    const { data, error } = await supabase
      .from("almanac_character_images" as any)
      .select("id, image_url, caption")
      .eq("character_id", characterId)
      .order("order_index", { ascending: true });

    if (!error && data) {
      setGalleryImages(data as unknown as GalleryImage[]);
    }
  };

  const fetchGenericGalleryImages = async (entryId: string, category: string) => {
    const { data, error } = await supabase
      .from("almanac_entry_images" as any)
      .select("id, image_url, caption")
      .eq("entry_id", entryId)
      .eq("category", category)
      .order("order_index", { ascending: true });

    if (!error && data) {
      setGalleryImages(data as unknown as GalleryImage[]);
    }
  };

  const fetchPromoBook = async (bookId: string) => {
    const { data, error } = await supabase
      .from("books")
      .select("id, title, author, cover_image_url")
      .eq("id", bookId)
      .single();

    if (!error && data) {
      setPromoBook(data as PromoBook);
    }
  };

  // Filter entries by search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.name.toLowerCase().includes(query) ||
        entry.description.toLowerCase().includes(query) ||
        entry.role?.toLowerCase().includes(query) ||
        entry.era?.toLowerCase().includes(query)
    );
  }, [entries, searchQuery]);

  // Infinite scroll hook
  const {
    displayedItems: infiniteScrollItems,
    hasMore: infiniteScrollHasMore,
    loadMoreRef,
  } = useInfiniteScroll({
    items: filteredEntries,
    itemsPerPage: ITEMS_PER_PAGE,
    enabled: infiniteScrollEnabled,
  });

  // Pagination logic (used when infinite scroll is disabled)
  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEntries, currentPage]);

  // Get the entries to display based on scroll mode
  const displayedEntries = infiniteScrollEnabled ? infiniteScrollItems : paginatedEntries;

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle URL query param for direct entry linking (from cross-references)
  useEffect(() => {
    const entrySlug = searchParams.get("entry");
    if (entrySlug && entries.length > 0) {
      const matchedEntry = entries.find(
        (e) => e.slug === entrySlug || e.name.toLowerCase() === entrySlug.toLowerCase()
      );
      if (matchedEntry) {
        setSelectedEntry(matchedEntry);
      }
    }
  }, [searchParams, entries]);

  // Scroll to top when selected entry changes
  useEffect(() => {
    if (selectedEntry) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [selectedEntry]);

  const renderPagination = () => {
    // Don't show pagination if infinite scroll is enabled
    if (infiniteScrollEnabled || totalPages <= 1) return null;

    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }

    return (
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          {pages.map((page, idx) =>
            page === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const renderInfiniteScrollLoader = () => {
    if (!infiniteScrollEnabled) return null;
    
    return (
      <div ref={loadMoreRef} className="flex justify-center py-8">
        {infiniteScrollHasMore && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading more...</span>
          </div>
        )}
      </div>
    );
  };

  if (!category || !tableName) {
    return (
      <div className="min-h-screen flex flex-col bg-[hsl(var(--parchment-bg))]">
        <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl flex items-center justify-center">
          <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--parchment-brown))]">Category Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-[hsl(var(--parchment-muted))]">
                The almanac category you're looking for doesn't exist.
              </p>
              <Button onClick={() => navigate("/chronology")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Chronology
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Handle back button to clear entry selection
  const handleBackToCategory = () => {
    setSelectedEntry(null);
    setSearchParams({});
  };

  if (selectedEntry) {
    return (
      <div className="min-h-screen flex flex-col bg-[hsl(var(--parchment-bg))]">
        <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
          <Breadcrumbs 
            items={[
              { label: "Chronology", href: "/chronology" },
              { label: category.title, href: `/almanac/${categoryId}` },
              { label: selectedEntry.name }
            ]}
            className="mb-4"
          />
          
          <Button
            variant="ghost"
            onClick={handleBackToCategory}
            className="mb-6 text-[hsl(var(--parchment-brown))] hover:bg-[hsl(var(--parchment-card))]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {category.title}
          </Button>

          <Card className="shadow-xl bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-4xl font-heading text-[hsl(var(--parchment-brown))]">
                    {selectedEntry.name}
                  </CardTitle>
                  <CardDescription className="text-[hsl(var(--parchment-light-muted))] mt-2">
                    {selectedEntry.description}
                  </CardDescription>
                </div>
                <SocialButton 
                  shareUrl={`${window.location.origin}/almanac/${categoryId}?entry=${selectedEntry.slug}`}
                  shareTitle={`${selectedEntry.name} - ThouArt Almanac`}
                  shareDescription={selectedEntry.description}
                />
              </div>
              
              {/* Category-specific metadata badges */}
              <CategoryMetadataBadges 
                categoryId={categoryId || ""} 
                entry={selectedEntry} 
              />
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Image Gallery for all categories */}
              {(galleryImages.length > 0 || selectedEntry.image_url) ? (
                <ImageGallery 
                  images={galleryImages} 
                  mainImage={selectedEntry.image_url}
                  altText={selectedEntry.name}
                />
              ) : null}

              <Separator className="bg-[hsl(var(--parchment-border))]" />

              <div className="prose max-w-none">
                <p className="leading-relaxed text-[hsl(var(--parchment-brown))]">
                  <AlmanacReferenceParser
                    content={selectedEntry.article}
                    allEntries={allAlmanacEntries}
                    currentEntryId={selectedEntry.id}
                  />
                </p>
              </div>

              {/* Character-specific sections */}
              {isCharacterCategory && (
                <>
                  {selectedEntry.abilities && (
                    <>
                      <Separator className="bg-[hsl(var(--parchment-border))]" />
                      <div>
                        <h3 className="text-xl font-heading font-semibold mb-3 text-[hsl(var(--parchment-brown))]">
                          Abilities
                        </h3>
                        <p className="text-[hsl(var(--parchment-muted))]">
                          <AlmanacReferenceParser
                            content={selectedEntry.abilities}
                            allEntries={allAlmanacEntries}
                            currentEntryId={selectedEntry.id}
                          />
                        </p>
                      </div>
                    </>
                  )}

                  {selectedEntry.relationships && (
                    <>
                      <Separator className="bg-[hsl(var(--parchment-border))]" />
                      <div>
                        <h3 className="text-xl font-heading font-semibold mb-3 text-[hsl(var(--parchment-brown))]">
                          Relationships
                        </h3>
                        <p className="text-[hsl(var(--parchment-muted))]">
                          <AlmanacReferenceParser
                            content={selectedEntry.relationships}
                            allEntries={allAlmanacEntries}
                            currentEntryId={selectedEntry.id}
                          />
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Promo Banner */}
              {selectedEntry.promo_enabled && (selectedEntry.promo_book_id || selectedEntry.promo_link) && (
                <>
                  <Separator className="bg-[hsl(var(--parchment-border))]" />
                  <div className="bg-gradient-to-r from-[hsl(var(--parchment-gold))/10] to-[hsl(var(--parchment-border))/30] rounded-xl p-6 border border-[hsl(var(--parchment-gold))/30]">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      {promoBook?.cover_image_url && (
                        <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
                          <img
                            src={promoBook.cover_image_url}
                            alt={promoBook.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 text-center md:text-left">
                        <p className="text-lg font-heading font-semibold text-[hsl(var(--parchment-brown))] mb-2">
                          {selectedEntry.promo_text || `Find out more about ${selectedEntry.name}!`}
                        </p>
                        {promoBook && (
                          <p className="text-sm text-[hsl(var(--parchment-muted))] mb-3">
                            {promoBook.title} by {promoBook.author}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedEntry.promo_book_id && promoBook && (
                          <Link to={`/books?book=${promoBook.id}`}>
                            <Button className="bg-[hsl(var(--parchment-gold))] hover:bg-[hsl(var(--parchment-gold))]/90 text-white">
                              <BookOpen className="h-4 w-4 mr-2" />
                              View Book
                            </Button>
                          </Link>
                        )}
                        {selectedEntry.promo_link && (
                          <a href={selectedEntry.promo_link} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="border-[hsl(var(--parchment-gold))] text-[hsl(var(--parchment-brown))] hover:bg-[hsl(var(--parchment-gold))]/10">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Learn More
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--parchment-bg))]">
      <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <Breadcrumbs 
          items={[
            { label: "Chronology", href: "/chronology" },
            { label: category.title }
          ]}
          className="mb-4"
        />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/chronology")}
            className="text-[hsl(var(--parchment-brown))] hover:bg-[hsl(var(--parchment-card))] w-fit"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chronology
          </Button>

          {isCharacterCategory && (
            <Button
              variant="outline"
              onClick={() => navigate("/relationships")}
              className="border-[hsl(var(--parchment-gold))] text-[hsl(var(--parchment-brown))] hover:bg-[hsl(var(--parchment-gold))/10] w-fit"
            >
              <Network className="mr-2 h-4 w-4" />
              View Relationships Map
            </Button>
          )}
        </div>

        <Card className="shadow-xl mb-8 bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
          <CardHeader>
            <CardTitle className="text-4xl font-heading text-[hsl(var(--parchment-brown))]">
              {category.title}
            </CardTitle>
            <CardDescription className="text-[hsl(var(--parchment-light-muted))]">
              Explore the {category.title.toLowerCase()} of the Realms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BookSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={`Search ${category.title.toLowerCase()} by name, description...`}
            />
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-[hsl(var(--parchment-muted))]">Loading entries...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <EmptyState
            type="search"
            title={searchQuery ? `No results for "${searchQuery}"` : `No ${category.title.toLowerCase()} yet`}
            description={searchQuery ? "Try adjusting your search terms" : "Check back later for new entries!"}
          />
        ) : (
          <>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08 },
              },
            }}
          >
            {displayedEntries.map((entry) => (
              <motion.div
                key={entry.id}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Card
                  className="cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]"
                  onClick={() => {
                    if (canReadEntry(entry.id)) {
                      recordEntryRead(entry.id);
                      setSelectedEntry(entry);
                      setSearchParams({ entry: entry.slug });
                    }
                  }}
                >
                  {entry.image_url && (
                    <div className="w-full h-80 overflow-hidden rounded-t-2xl">
                      <OptimizedImage
                        src={entry.image_url}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl text-[hsl(var(--parchment-brown))]">
                      {entry.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-[hsl(var(--parchment-muted))]">
                      {entry.description}
                    </CardDescription>
                    {/* Show category-specific badges in list */}
                    <CategoryMetadataBadges 
                      categoryId={categoryId || ""} 
                      entry={entry} 
                      variant="compact"
                    />
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          {renderPagination()}
          {renderInfiniteScrollLoader()}
          </>
        )}
      </div>
      <Footer />
      
      {/* Login Prompt Dialog */}
      <AlmanacLoginPrompt open={showLoginPrompt} onClose={closeLoginPrompt} />
    </div>
  );
};

export default AlmanacCategory;
