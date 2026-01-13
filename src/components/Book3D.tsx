import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { X, FileX } from "lucide-react";

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
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    const fetchPreviewPDF = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("books")
        .select("preview_pdf_url")
        .eq("id", book.id)
        .maybeSingle();
      
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

  {/* Reduced padding + increased modal width */}
  <div className="w-full max-w-5xl h-[85vh] flex flex-col items-center justify-center p-3">
    <div className="text-center mb-3 bg-background/80 backdrop-blur px-5 py-2 rounded-lg">
      <h3 className="text-xl font-semibold text-primary">{book.title}</h3>
      <p className="text-muted-foreground">by {book.author}</p>
    </div>

    <div className="relative w-full h-full flex items-center justify-center">
      {isLoading ? (
        <div className="w-full h-full bg-background rounded-lg shadow-2xl p-4">
          <Skeleton className="w-full h-full" />
        </div>
      ) : previewPDF ? (
        <div className="relative aspect-[3/4] max-h-full max-w-[85%] bg-background rounded-lg shadow-2xl overflow-hidden">
          {iframeLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <Skeleton className="w-full h-full" />
            </div>
          )}
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewPDF)}&embedded=true`}
            className="w-full h-full border-0"
            title={`${book.title} Preview`}
            onLoad={() => setIframeLoading(false)}
          />
        </div>
      ) : (
        <div className="w-full h-full bg-background rounded-lg shadow-2xl flex flex-col items-center justify-center p-8 text-center">
          <FileX className="h-16 w-16 text-muted-foreground mb-4" />
          <h4 className="text-lg font-semibold text-foreground mb-2">No Preview Available</h4>
          <p className="text-sm text-muted-foreground">
            A preview has not been uploaded for this book yet.
          </p>
        </div>
      )}
    </div>

    <p className="text-xs text-muted-foreground mt-3 text-center">
      Press ESC to close
    </p>
  </div>
</div>
  );
};
