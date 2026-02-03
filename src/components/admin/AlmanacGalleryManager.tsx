import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_BUCKET } from "@/lib/storageSetup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Trash2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  order_index: number;
}

interface AlmanacGalleryManagerProps {
  entryId: string;
  category: string;
  onClose?: () => void;
}

export const AlmanacGalleryManager = ({ 
  entryId, 
  category,
  onClose 
}: AlmanacGalleryManagerProps) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newCaption, setNewCaption] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchImages();
  }, [entryId, category]);

  const fetchImages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("almanac_entry_images" as any)
      .select("*")
      .eq("entry_id", entryId)
      .eq("category", category)
      .order("order_index", { ascending: true });

    if (!error && data) {
      setImages(data as unknown as GalleryImage[]);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `almanac/${category}/${entryId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        toast({
          title: "Upload failed",
          description: uploadError.message,
          variant: "destructive",
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("almanac_entry_images" as any)
        .insert({
          entry_id: entryId,
          category: category,
          image_url: publicUrl,
          caption: newCaption || null,
          order_index: images.length,
        } as any);

      if (insertError) {
        toast({
          title: "Error",
          description: "Failed to save image to database",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

      setNewCaption("");
      fetchImages();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm("Delete this image?")) return;

    const { error } = await supabase
      .from("almanac_entry_images" as any)
      .delete()
      .eq("id", imageId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Image deleted",
    });
    fetchImages();
  };

  const handleCaptionUpdate = async (imageId: string, caption: string) => {
    const { error } = await supabase
      .from("almanac_entry_images" as any)
      .update({ caption } as any)
      .eq("id", imageId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update caption",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
          <h4 className="font-medium">Gallery Images ({images.length})</h4>
        </div>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Gallery
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-4 text-muted-foreground">
          Loading images...
        </div>
      ) : (
        <>
          {/* Existing Images */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {images.map((image) => (
                <Card key={image.id} className="relative group overflow-hidden">
                  <img
                    src={image.image_url}
                    alt={image.caption || "Gallery image"}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(image.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-2">
                    <Input
                      defaultValue={image.caption || ""}
                      placeholder="Add caption..."
                      className="text-xs h-7"
                      onBlur={(e) => handleCaptionUpdate(image.id, e.target.value)}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Add New Image */}
          <Card className="p-4 border-dashed">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Caption for new image (optional)"
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                {uploading && (
                  <span className="text-sm text-muted-foreground">Uploading...</span>
                )}
              </div>
            </div>
          </Card>

          {images.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No gallery images yet. Upload images above.
            </p>
          )}
        </>
      )}
    </div>
  );
};
