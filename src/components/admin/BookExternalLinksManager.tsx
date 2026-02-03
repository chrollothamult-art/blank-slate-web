import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ExternalLink, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface ExternalLink {
  id: string;
  book_id: string;
  format_type: string;
  store_name: string;
  url: string;
  order_index: number;
}

interface BookExternalLinksManagerProps {
  bookId: string;
  bookTitle: string;
}

const FORMAT_TYPES = [
  { value: "ebook", label: "eBook" },
  { value: "paperback", label: "Paperback" },
  { value: "hardcover", label: "Hardcover" },
  { value: "audiobook", label: "Audiobook" },
  { value: "special_edition", label: "Special Edition" },
];

const COMMON_STORES = [
  "Amazon",
  "Barnes & Noble",
  "Kobo",
  "Apple Books",
  "Google Play Books",
  "Audible",
  "Bookshop.org",
  "Other",
];

export const BookExternalLinksManager = ({ bookId, bookTitle }: BookExternalLinksManagerProps) => {
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLink, setNewLink] = useState({
    format_type: "",
    store_name: "",
    custom_store_name: "",
    url: "",
  });

  useEffect(() => {
    fetchLinks();
  }, [bookId]);

  const fetchLinks = async () => {
    const { data, error } = await supabase
      .from("book_external_links")
      .select("*")
      .eq("book_id", bookId)
      .order("order_index", { ascending: true });

    if (!error && data) {
      setLinks(data);
    }
    setLoading(false);
  };

  const handleAddLink = async () => {
    const storeName = newLink.store_name === "Other" ? newLink.custom_store_name : newLink.store_name;
    
    if (!newLink.format_type || !storeName || !newLink.url) {
      toast.error("Please fill in all fields");
      return;
    }

    const { error } = await supabase
      .from("book_external_links")
      .insert({
        book_id: bookId,
        format_type: newLink.format_type,
        store_name: storeName,
        url: newLink.url,
        order_index: links.length,
      });

    if (error) {
      toast.error("Failed to add link");
      return;
    }

    toast.success("Link added successfully");
    setNewLink({ format_type: "", store_name: "", custom_store_name: "", url: "" });
    fetchLinks();
  };

  const handleDeleteLink = async (linkId: string) => {
    const { error } = await supabase
      .from("book_external_links")
      .delete()
      .eq("id", linkId);

    if (error) {
      toast.error("Failed to delete link");
      return;
    }

    toast.success("Link deleted");
    fetchLinks();
  };

  // Group links by format type
  const groupedLinks = links.reduce((acc, link) => {
    if (!acc[link.format_type]) {
      acc[link.format_type] = [];
    }
    acc[link.format_type].push(link);
    return acc;
  }, {} as Record<string, ExternalLink[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">External Purchase Links</CardTitle>
        <p className="text-sm text-muted-foreground">
          Add links to other stores where "{bookTitle}" can be purchased
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Link Form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30">
          <div>
            <Label>Format</Label>
            <Select
              value={newLink.format_type}
              onValueChange={(value) => setNewLink({ ...newLink, format_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_TYPES.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Store</Label>
            <Select
              value={newLink.store_name}
              onValueChange={(value) => setNewLink({ ...newLink, store_name: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_STORES.map((store) => (
                  <SelectItem key={store} value={store}>
                    {store}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {newLink.store_name === "Other" && (
              <Input
                className="mt-2"
                placeholder="Enter store name"
                value={newLink.custom_store_name}
                onChange={(e) => setNewLink({ ...newLink, custom_store_name: e.target.value })}
              />
            )}
          </div>

          <div>
            <Label>URL</Label>
            <Input
              type="url"
              placeholder="https://..."
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
            />
          </div>

          <div className="flex items-end">
            <Button onClick={handleAddLink} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </div>
        </div>

        {/* Existing Links */}
        {loading ? (
          <p className="text-muted-foreground">Loading links...</p>
        ) : links.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No external links added yet. Add links above to show "Also Available At" section on the book page.
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedLinks).map(([formatType, formatLinks]) => (
              <div key={formatType} className="space-y-2">
                <h4 className="font-medium capitalize">
                  {FORMAT_TYPES.find(f => f.value === formatType)?.label || formatType}
                </h4>
                <div className="space-y-2">
                  {formatLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-background"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{link.store_name}</span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 flex-1 truncate"
                      >
                        {link.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLink(link.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
