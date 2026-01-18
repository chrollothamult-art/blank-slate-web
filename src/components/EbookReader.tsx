import { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RotateCw,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Palette,
  Sun,
  Moon,
  Coffee,
  Highlighter,
  StickyNote,
} from "lucide-react";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useHighlightsNotes } from "@/hooks/useHighlightsNotes";
import { HighlightsNotesPanel } from "@/components/reader/HighlightsNotesPanel";
import { TextSelectionHighlighter } from "@/components/reader/TextSelectionHighlighter";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ReadingTheme = "light" | "dark" | "sepia" | "custom";

interface ThemeConfig {
  name: string;
  icon: React.ReactNode;
  bgClass: string;
  contentBg: string;
  headerBg: string;
  textClass: string;
}

const themeConfigs: Record<ReadingTheme, ThemeConfig> = {
  light: {
    name: "Light",
    icon: <Sun className="h-4 w-4" />,
    bgClass: "bg-white",
    contentBg: "bg-gray-100",
    headerBg: "bg-white border-gray-200",
    textClass: "text-gray-900",
  },
  dark: {
    name: "Dark",
    icon: <Moon className="h-4 w-4" />,
    bgClass: "bg-gray-900",
    contentBg: "bg-gray-800",
    headerBg: "bg-gray-900 border-gray-700",
    textClass: "text-gray-100",
  },
  sepia: {
    name: "Sepia",
    icon: <Coffee className="h-4 w-4" />,
    bgClass: "bg-[#f4ecd8]",
    contentBg: "bg-[#ede4d0]",
    headerBg: "bg-[#f4ecd8] border-[#d4c4a0]",
    textClass: "text-[#5b4636]",
  },
  custom: {
    name: "Custom",
    icon: <Palette className="h-4 w-4" />,
    bgClass: "bg-[#e8f0e8]",
    contentBg: "bg-[#d8e8d8]",
    headerBg: "bg-[#e8f0e8] border-[#b8d0b8]",
    textClass: "text-[#2a3a2a]",
  },
};

interface EbookReaderProps {
  pdfUrl: string;
  title: string;
  bookId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const EbookReader = ({
  pdfUrl,
  title,
  bookId,
  isOpen,
  onClose,
}: EbookReaderProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>("light");
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingProgrammatically = useRef(false);

  const { progress, updateProgress, loading: progressLoading } = useReadingProgress(bookId);
  const { bookmarks, addBookmark, removeBookmark, isPageBookmarked, getBookmarkForPage } = useBookmarks(bookId);
  const { 
    highlights, 
    notes, 
    addHighlight, 
    updateHighlightColor, 
    deleteHighlight, 
    addNote, 
    updateNote, 
    deleteNote 
  } = useHighlightsNotes(bookId);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);

  const currentTheme = themeConfigs[readingTheme];

  // Initialize from saved progress
  useEffect(() => {
    if (progress && !progressLoading && numPages > 0) {
      const savedPage = progress.current_page;
      if (savedPage > 1 && savedPage <= numPages) {
        setCurrentPage(savedPage);
        setPageInput(savedPage.toString());
        // Scroll to saved page after a short delay to ensure pages are rendered
        setTimeout(() => {
          scrollToPage(savedPage, false);
        }, 500);
      }
    }
  }, [progress, progressLoading, numPages]);

  // Update progress when current page changes
  useEffect(() => {
    if (!isOpen || numPages === 0) return;

    const timer = setTimeout(() => {
      updateProgress(currentPage, numPages);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentPage, numPages, isOpen, updateProgress]);

  // Intersection observer to track current page
  useEffect(() => {
    if (!isOpen || numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingProgrammatically.current) return;
        
        // Find the page that is most visible
        let mostVisiblePage = currentPage;
        let maxRatio = 0;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            const pageNum = parseInt(entry.target.getAttribute("data-page") || "1");
            maxRatio = entry.intersectionRatio;
            mostVisiblePage = pageNum;
          }
        });

        if (mostVisiblePage !== currentPage && maxRatio > 0.3) {
          setCurrentPage(mostVisiblePage);
          setPageInput(mostVisiblePage.toString());
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: "-10% 0px -10% 0px",
      }
    );

    pageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [isOpen, numPages, currentPage]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Home":
          e.preventDefault();
          scrollToPage(1);
          break;
        case "End":
          e.preventDefault();
          scrollToPage(numPages);
          break;
        case "+":
        case "=":
          e.preventDefault();
          handleZoom(Math.min(scale + 0.25, 3));
          break;
        case "-":
          e.preventDefault();
          handleZoom(Math.max(scale - 0.25, 0.5));
          break;
        case "Escape":
          if (isFullscreen) {
            toggleFullscreen();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, numPages, scale, isFullscreen]);

  const scrollToPage = useCallback((pageNum: number, smooth = true) => {
    const pageRef = pageRefs.current.get(pageNum);
    if (pageRef && scrollContainerRef.current) {
      isScrollingProgrammatically.current = true;
      pageRef.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
      setCurrentPage(pageNum);
      setPageInput(pageNum.toString());
      
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 500);
    }
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setPdfError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error);
    setPdfError("Failed to load PDF. Please try again.");
    setIsLoading(false);
  };

  const handleZoom = (newScale: number) => {
    setScale(Math.max(0.5, Math.min(3, newScale)));
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (page >= 1 && page <= numPages) {
      scrollToPage(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const progressPercentage = numPages > 0 ? Math.round((currentPage / numPages) * 100) : 0;

  const setPageRef = useCallback((pageNum: number, ref: HTMLDivElement | null) => {
    if (ref) {
      pageRefs.current.set(pageNum, ref);
    } else {
      pageRefs.current.delete(pageNum);
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        ref={containerRef}
        className={`max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 flex flex-col ${currentTheme.bgClass} transition-colors duration-300`}
      >
        {/* Header */}
        <header className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${currentTheme.headerBg} ${currentTheme.textClass} transition-colors duration-300`}>
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg truncate max-w-[200px] sm:max-w-[400px]">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Bookmark current page button */}
            <Button
              variant={isPageBookmarked(currentPage) ? "default" : "ghost"}
              size="icon"
              onClick={() => {
                const existing = getBookmarkForPage(currentPage);
                if (existing) {
                  removeBookmark(existing.id);
                } else {
                  addBookmark(currentPage);
                }
              }}
              title={isPageBookmarked(currentPage) ? "Remove bookmark" : "Add bookmark"}
            >
              {isPageBookmarked(currentPage) ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>

            {/* Bookmarks list */}
            <Popover open={showBookmarks} onOpenChange={setShowBookmarks}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Bookmark className="h-4 w-4" />
                  <span className="hidden sm:inline">Bookmarks</span>
                  {bookmarks.length > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 ml-1">
                      {bookmarks.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="end">
                <div className="text-sm font-medium mb-2">Bookmarks</div>
                {bookmarks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No bookmarks yet
                  </p>
                ) : (
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-1">
                      {bookmarks.map((bookmark) => (
                        <div
                          key={bookmark.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted group"
                        >
                          <button
                            onClick={() => {
                              scrollToPage(bookmark.page_number);
                              setShowBookmarks(false);
                            }}
                            className="flex-1 text-left text-sm truncate"
                          >
                            {bookmark.label || `Page ${bookmark.page_number}`}
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeBookmark(bookmark.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </PopoverContent>
            </Popover>

            {/* Highlights & Notes Panel */}
            <Sheet open={showNotesPanel} onOpenChange={setShowNotesPanel}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Highlighter className="h-4 w-4" />
                  <span className="hidden sm:inline">Notes</span>
                  {(highlights.length + notes.length) > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 ml-1">
                      {highlights.length + notes.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[350px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Highlighter className="h-5 w-5" />
                    Highlights & Notes
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <HighlightsNotesPanel
                    highlights={highlights}
                    notes={notes}
                    currentPage={currentPage}
                    onGoToPage={(page) => {
                      scrollToPage(page);
                      setShowNotesPanel(false);
                    }}
                    onUpdateHighlightColor={updateHighlightColor}
                    onDeleteHighlight={deleteHighlight}
                    onAddNote={addNote}
                    onUpdateNote={updateNote}
                    onDeleteNote={deleteNote}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Theme selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  {currentTheme.icon}
                  <span className="hidden sm:inline">{currentTheme.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Reading Theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.entries(themeConfigs) as [ReadingTheme, ThemeConfig][]).map(
                  ([key, theme]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setReadingTheme(key)}
                      className={`gap-2 ${readingTheme === key ? "bg-accent" : ""}`}
                    >
                      {theme.icon}
                      {theme.name}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Zoom controls - desktop */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleZoom(scale - 0.25)}
                disabled={scale <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleZoom(scale + 0.25)}
                disabled={scale >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Fullscreen toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="hidden sm:flex"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>

            {/* Close button */}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* PDF viewer with vertical scroll */}
          <main 
            ref={scrollContainerRef}
            className={`flex-1 overflow-auto ${currentTheme.contentBg} transition-colors duration-300`}
          >
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className={`text-center space-y-4 ${currentTheme.textClass}`}>
                  <RotateCw className="h-8 w-8 animate-spin mx-auto opacity-60" />
                  <p className="opacity-60">Loading book...</p>
                </div>
              </div>
            )}

            {pdfError && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <p className="text-destructive">{pdfError}</p>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col items-center py-4 gap-4">
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={null}
                className="max-w-full"
              >
                {Array.from({ length: numPages }, (_, index) => (
                  <div
                    key={`page_${index + 1}`}
                    ref={(ref) => setPageRef(index + 1, ref)}
                    data-page={index + 1}
                    className="mb-4"
                  >
                    <Page
                      pageNumber={index + 1}
                      scale={scale}
                      className={`shadow-lg ${
                        readingTheme === "dark" 
                          ? "invert hue-rotate-180" 
                          : readingTheme === "sepia" 
                            ? "sepia-[0.3]" 
                            : ""
                      }`}
                      loading={
                        <Skeleton className="w-[600px] h-[800px]" />
                      }
                    />
                  </div>
                ))}
              </Document>
            </div>

            {/* Text Selection Highlighter */}
            <TextSelectionHighlighter
              containerRef={scrollContainerRef as React.RefObject<HTMLElement>}
              currentPage={currentPage}
              onHighlight={(text, page, color, startOffset, endOffset) => {
                addHighlight(page, text, startOffset, endOffset, color);
              }}
              onAddNote={(page, content) => {
                addNote(page, content);
              }}
            />
          </main>
        </div>

        {/* Footer */}
        <footer className={`flex items-center justify-between px-4 py-3 border-t shrink-0 ${currentTheme.headerBg} ${currentTheme.textClass} transition-colors duration-300`}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="gap-1"
          >
            <ChevronUp className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="flex items-center gap-2">
            {/* Mobile zoom */}
            <div className="flex md:hidden items-center gap-2">
              <Slider
                value={[scale]}
                onValueChange={([val]) => handleZoom(val)}
                min={0.5}
                max={2}
                step={0.1}
                className="w-20"
              />
            </div>

            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">Page</span>
              <Input
                type="number"
                value={pageInput}
                onChange={handlePageInputChange}
                className="w-14 h-8 text-center text-sm"
                min={1}
                max={numPages}
              />
              <span className="text-sm text-muted-foreground">of {numPages}</span>
            </form>

            <span className="text-sm text-muted-foreground ml-2 hidden sm:inline">
              ({progressPercentage}%)
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
            className="gap-1"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
};
