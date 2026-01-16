import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { almanacCategories } from "@/data/chronologyData";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageGallery } from "@/components/ImageGallery";
import { Footer } from "@/components/Footer";
import { BookSearchBar } from "@/components/BookSearchBar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface AlmanacEntry {
  id: string;
  name: string;
  slug: string;
  description: string;
  article: string;
  image_url: string | null;
  // Character-specific fields
  role?: string;
  affiliation?: string;
  era?: string;
  species?: string;
  abilities?: string;
  relationships?: string;
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
  const navigate = useNavigate();
  const [entries, setEntries] = useState<AlmanacEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<AlmanacEntry | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const category = almanacCategories.find((c) => c.id === categoryId);
  const tableName = categoryId ? categoryTableMap[categoryId] : null;
  const isCharacterCategory = categoryId === "characters";

  useEffect(() => {
    if (tableName) {
      fetchEntries();
    }
  }, [tableName]);

  useEffect(() => {
    if (selectedEntry && isCharacterCategory) {
      fetchGalleryImages(selectedEntry.id);
    } else {
      setGalleryImages([]);
    }
  }, [selectedEntry, isCharacterCategory]);

  const fetchEntries = async () => {
    if (!tableName) return;

    const { data, error } = await supabase
      .from(tableName as any)
      .select("*")
      .order("order_index", { ascending: true });

    if (!error && data) {
      setEntries(data as any);
    }
    setLoading(false);
  };

  const fetchGalleryImages = async (characterId: string) => {
    const { data, error } = await supabase
      .from("almanac_character_images" as any)
      .select("id, image_url, caption")
      .eq("character_id", characterId)
      .order("order_index", { ascending: true });

    if (!error && data) {
      setGalleryImages(data as unknown as GalleryImage[]);
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

  // Pagination logic
  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEntries, currentPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

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

  if (selectedEntry) {
    return (
      <div className="min-h-screen flex flex-col bg-[hsl(var(--parchment-bg))]">
        <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => setSelectedEntry(null)}
            className="mb-6 text-[hsl(var(--parchment-brown))] hover:bg-[hsl(var(--parchment-card))]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {category.title}
          </Button>

          <Card className="shadow-xl bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
            <CardHeader>
              <CardTitle className="text-4xl font-heading text-[hsl(var(--parchment-brown))]">
                {selectedEntry.name}
              </CardTitle>
              <CardDescription className="text-[hsl(var(--parchment-light-muted))]">
                {selectedEntry.description}
              </CardDescription>
              
              {/* Character-specific metadata */}
              {isCharacterCategory && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedEntry.role && (
                    <span className="px-3 py-1 rounded-full text-sm bg-[hsl(var(--parchment-border))] text-[hsl(var(--parchment-brown))]">
                      {selectedEntry.role}
                    </span>
                  )}
                  {selectedEntry.affiliation && (
                    <span className="px-3 py-1 rounded-full text-sm bg-[hsl(var(--parchment-bg))] text-[hsl(var(--parchment-brown))]">
                      {selectedEntry.affiliation}
                    </span>
                  )}
                  {selectedEntry.era && (
                    <span className="px-3 py-1 rounded-full text-sm bg-[hsl(var(--parchment-gold))] text-white">
                      {selectedEntry.era}
                    </span>
                  )}
                  {selectedEntry.species && (
                    <span className="px-3 py-1 rounded-full text-sm bg-[hsl(var(--parchment-muted))] text-white">
                      {selectedEntry.species}
                    </span>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Image Gallery for Characters, Single Image for Others */}
              {isCharacterCategory ? (
                <ImageGallery 
                  images={galleryImages} 
                  mainImage={selectedEntry.image_url}
                  altText={selectedEntry.name}
                />
              ) : selectedEntry.image_url ? (
                <div className="w-full">
                  <img
                    src={selectedEntry.image_url}
                    alt={selectedEntry.name}
                    className="w-full h-96 object-cover rounded-lg shadow-lg"
                  />
                </div>
              ) : null}

              <Separator className="bg-[hsl(var(--parchment-border))]" />

              <div className="prose max-w-none">
                <p className="leading-relaxed whitespace-pre-line text-[hsl(var(--parchment-brown))]">
                  {selectedEntry.article}
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
                        <p className="whitespace-pre-line text-[hsl(var(--parchment-muted))]">
                          {selectedEntry.abilities}
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
                        <p className="whitespace-pre-line text-[hsl(var(--parchment-muted))]">
                          {selectedEntry.relationships}
                        </p>
                      </div>
                    </>
                  )}
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
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/chronology")}
            className="text-[hsl(var(--parchment-brown))] hover:bg-[hsl(var(--parchment-card))]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chronology
          </Button>

          {isCharacterCategory && (
            <Button
              variant="outline"
              onClick={() => navigate("/relationships")}
              className="border-[hsl(var(--parchment-gold))] text-[hsl(var(--parchment-brown))] hover:bg-[hsl(var(--parchment-gold))/10]"
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
          <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
            <CardContent className="p-12 text-center">
              <p className="text-[hsl(var(--parchment-muted))]">
                {searchQuery ? `No entries matching "${searchQuery}"` : `No entries yet for ${category.title}. Check back later!`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedEntries.map((entry) => (
              <Card
                key={entry.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]"
                onClick={() => setSelectedEntry(entry)}
              >
                {entry.image_url && (
                  <div className="w-full h-80 overflow-hidden">
                    <img
                      src={entry.image_url}
                      alt={entry.name}
                      className="w-full h-full object-cover"
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
                  {/* Show character role/era badges in list */}
                  {isCharacterCategory && (entry.role || entry.era) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.role && (
                        <span className="px-2 py-0.5 rounded text-xs bg-[hsl(var(--parchment-border))] text-[hsl(var(--parchment-brown))]">
                          {entry.role}
                        </span>
                      )}
                      {entry.era && (
                        <span className="px-2 py-0.5 rounded text-xs bg-[hsl(var(--parchment-gold))] text-white">
                          {entry.era}
                        </span>
                      )}
                    </div>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
          {renderPagination()}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AlmanacCategory;
