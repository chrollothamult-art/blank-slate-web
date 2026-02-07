import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ExternalLinkData {
  id: string;
  format_type: string;
  store_name: string;
  url: string;
}

interface BookExternalLinksProps {
  bookId: string;
}

const FORMAT_LABELS: Record<string, string> = {
  ebook: "eBook",
  paperback: "Paperback",
  hardcover: "Hardcover",
  audiobook: "Audiobook",
  special_edition: "Special Edition",
};

export const BookExternalLinks = ({ bookId }: BookExternalLinksProps) => {
  const [links, setLinks] = useState<ExternalLinkData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      const { data, error } = await supabase
        .from("book_external_links" as any)
        .select("id, format_type, store_name, url")
        .eq("book_id", bookId)
        .order("order_index", { ascending: true });

      if (!error && data) {
        setLinks(data as unknown as ExternalLinkData[]);
      }
      setLoading(false);
    };

    fetchLinks();
  }, [bookId]);

  if (loading || links.length === 0) {
    return null;
  }

  // Group links by format type
  const groupedLinks = links.reduce((acc, link) => {
    if (!acc[link.format_type]) {
      acc[link.format_type] = [];
    }
    acc[link.format_type].push(link);
    return acc;
  }, {} as Record<string, ExternalLinkData[]>);

  return (
    <div className="mt-6">
      <Separator className="mb-4" />
      <h3 className="text-lg font-semibold mb-4 text-foreground">Also Available At</h3>
      <div className="space-y-4">
        {Object.entries(groupedLinks).map(([formatType, formatLinks]) => (
          <div key={formatType}>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {FORMAT_LABELS[formatType] || formatType}
            </h4>
            <div className="flex flex-wrap gap-2">
              {formatLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border border-border bg-muted/50 hover:bg-muted transition-colors"
                >
                  {link.store_name}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
