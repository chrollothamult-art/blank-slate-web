import { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  X, 
  FileX, 
  ZoomIn, 
  ZoomOut, 
  ChevronUp, 
  ChevronDown,
  RotateCw 
} from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Book3DProps {
  book: {
    id: string;
    title: string;
    author: string;
  };
  onClose: () => void;
}

export const Book3D = ({ book, onClose }: Book3DProps) => {
  const [previewPDF, setPreviewPDF] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [scale, setScale] = useState(1);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const isScrollingProgrammatically = useRef(false);

  useEffect(() => {
    const fetchPreviewPDF = async () => {
      setIsLoading(true);
      const { data } = await (supabase
        .from("books" as any)
        .select("preview_pdf_url")
        .eq("id", book.id)
        .maybeSingle()) as any;
      
      setPreviewPDF(data?.preview_pdf_url || null);
      setIsLoading(false);
    };

    fetchPreviewPDF();
  }, [book.id]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  // Intersection observer to track current page
  useEffect(() => {
    if (numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingProgrammatically.current) return;
        
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
  }, [numPages, currentPage]);

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
    setPdfError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error);
    setPdfError("Failed to load PDF preview.");
  };

  const handleZoom = (newScale: number) => {
    setScale(Math.max(0.5, Math.min(2, newScale)));
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

  const setPageRef = useCallback((pageNum: number, ref: HTMLDivElement | null) => {
    if (ref) {
      pageRefs.current.set(pageNum, ref);
    } else {
      pageRefs.current.delete(pageNum);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur hover:bg-background text-foreground"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      <div className="w-full max-w-4xl h-[90vh] flex flex-col bg-background rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-primary">{book.title}</h3>
            <p className="text-sm text-muted-foreground">by {book.author} • Preview</p>
          </div>

          {previewPDF && numPages > 0 && (
            <div className="flex items-center gap-2">
              {/* Zoom controls */}
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-muted rounded-lg">
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
                  disabled={scale >= 2}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <RotateCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Loading preview...</p>
              </div>
            </div>
          ) : previewPDF ? (
            <div 
              ref={scrollContainerRef}
              className="h-full overflow-auto bg-muted/10"
            >
              {pdfError ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <FileX className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="text-destructive">{pdfError}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-4 gap-4">
                  <Document
                    file={previewPDF}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex items-center justify-center py-20">
                        <RotateCw className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    }
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
                          className="shadow-lg bg-white"
                          loading={
                            <Skeleton className="w-[600px] h-[800px]" />
                          }
                        />
                      </div>
                    ))}
                  </Document>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <FileX className="h-16 w-16 text-muted-foreground mb-4" />
              <h4 className="text-lg font-semibold text-foreground mb-2">No Preview Available</h4>
              <p className="text-sm text-muted-foreground">
                A preview has not been uploaded for this book yet.
              </p>
            </div>
          )}
        </div>

        {/* Footer - only show if PDF loaded */}
        {previewPDF && numPages > 0 && (
          <footer className="flex items-center justify-between px-4 py-3 border-t bg-card shrink-0">
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
        )}

        <p className="text-xs text-muted-foreground py-2 text-center border-t">
          Press ESC to close
        </p>
      </div>
    </div>
  );
};
