import { useState, useRef } from "react";
import { Upload, X, Loader2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CampaignAudioUploadProps {
  campaignId: string;
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  className?: string;
}

export const CampaignAudioUpload = ({
  campaignId,
  currentUrl,
  onUpload,
  onRemove,
  label = "Upload Audio",
  className = "",
}: CampaignAudioUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an MP3, WAV, OGG, or WebM audio file.",
        variant: "destructive",
      });
      return;
    }

    // 5MB max for audio
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum audio file size is 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${campaignId}/audio/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("rp-campaign-assets")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("rp-campaign-assets")
        .getPublicUrl(fileName);

      onUpload(urlData.publicUrl);
      toast({ title: "Audio uploaded!" });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({
        title: "Upload failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const fileName = currentUrl ? currentUrl.split("/").pop() : null;

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4"
        onChange={handleFileSelect}
        className="hidden"
      />

      {currentUrl ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
          <Music className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName || "Audio file"}</p>
            <p className="text-xs text-muted-foreground">Background audio attached</p>
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4" />
            </Button>
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full h-16 border-dashed flex flex-col gap-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs">Uploading...</span>
            </>
          ) : (
            <>
              <Music className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-[10px] text-muted-foreground">
                MP3, WAV, OGG · Max 5MB
              </span>
            </>
          )}
        </Button>
      )}
    </div>
  );
};
