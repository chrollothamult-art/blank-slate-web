import { useState } from "react";
import { Search, Music, Check, Play, Pause } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRef } from "react";

const AUDIO_LIBRARY: { category: string; items: { id: string; label: string; keywords: string[]; url: string; duration: string }[] }[] = [
  {
    category: "Ambient",
    items: [
      { id: "forest-ambience", label: "Forest Ambience", keywords: ["forest", "nature", "birds", "peaceful"], url: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3", duration: "2:30" },
      { id: "tavern-crowd", label: "Tavern Crowd", keywords: ["tavern", "inn", "crowd", "pub", "chatter"], url: "https://cdn.pixabay.com/audio/2022/03/10/audio_4dedf5bf94.mp3", duration: "1:45" },
      { id: "dungeon-drip", label: "Dungeon Drips", keywords: ["dungeon", "cave", "drip", "dark", "underground"], url: "https://cdn.pixabay.com/audio/2022/02/07/audio_d1718ab41b.mp3", duration: "3:00" },
      { id: "ocean-waves", label: "Ocean Waves", keywords: ["ocean", "sea", "water", "waves", "coast"], url: "https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e4.mp3", duration: "2:00" },
      { id: "campfire-crackle", label: "Campfire Crackle", keywords: ["fire", "camp", "crackle", "warm", "night"], url: "https://cdn.pixabay.com/audio/2021/08/04/audio_12b0c7443c.mp3", duration: "2:15" },
      { id: "rain-thunder", label: "Rain & Thunder", keywords: ["rain", "thunder", "storm", "weather"], url: "https://cdn.pixabay.com/audio/2022/05/16/audio_460bfb1a71.mp3", duration: "3:30" },
    ],
  },
  {
    category: "Dramatic",
    items: [
      { id: "battle-drums", label: "Battle Drums", keywords: ["battle", "war", "drums", "combat", "fight"], url: "https://cdn.pixabay.com/audio/2023/09/04/audio_5c458cced1.mp3", duration: "1:30" },
      { id: "epic-discovery", label: "Epic Discovery", keywords: ["discovery", "reveal", "epic", "treasure"], url: "https://cdn.pixabay.com/audio/2022/01/20/audio_bc26d8bdd0.mp3", duration: "1:00" },
      { id: "tension-rising", label: "Rising Tension", keywords: ["tension", "suspense", "danger", "creepy"], url: "https://cdn.pixabay.com/audio/2022/03/15/audio_7506e1d0a3.mp3", duration: "2:00" },
      { id: "chase-scene", label: "Chase Scene", keywords: ["chase", "run", "escape", "fast", "pursuit"], url: "https://cdn.pixabay.com/audio/2022/10/30/audio_3b1d02c064.mp3", duration: "1:45" },
    ],
  },
  {
    category: "Emotional",
    items: [
      { id: "melancholy-strings", label: "Melancholy Strings", keywords: ["sad", "melancholy", "loss", "sorrow"], url: "https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3", duration: "2:30" },
      { id: "triumphant-fanfare", label: "Triumphant Fanfare", keywords: ["triumph", "victory", "win", "celebration"], url: "https://cdn.pixabay.com/audio/2022/11/22/audio_febc508520.mp3", duration: "0:45" },
      { id: "mysterious-melody", label: "Mysterious Melody", keywords: ["mystery", "magic", "ethereal", "wonder"], url: "https://cdn.pixabay.com/audio/2022/04/27/audio_67bcce71d1.mp3", duration: "2:00" },
      { id: "peaceful-piano", label: "Peaceful Piano", keywords: ["peaceful", "calm", "rest", "gentle"], url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3", duration: "3:00" },
    ],
  },
];

interface AudioLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

export const AudioLibrary = ({ open, onOpenChange, onSelect }: AudioLibraryProps) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredAudio = AUDIO_LIBRARY.map(cat => ({
    ...cat,
    items: cat.items.filter(item => {
      if (selectedCategory && cat.category !== selectedCategory) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return item.label.toLowerCase().includes(q) || item.keywords.some(k => k.includes(q));
    }),
  })).filter(cat => cat.items.length > 0);

  const handleSelect = (url: string) => {
    stopPreview();
    onSelect(url);
    onOpenChange(false);
  };

  const togglePreview = (item: { id: string; url: string }) => {
    if (previewingId === item.id) {
      stopPreview();
    } else {
      stopPreview();
      const audio = new Audio(item.url);
      audio.volume = 0.3;
      audio.play().catch(() => {});
      audioRef.current = audio;
      setPreviewingId(item.id);
      audio.onended = () => setPreviewingId(null);
    }
  };

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPreviewingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) stopPreview(); onOpenChange(o); }}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Audio Library
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search audio tracks..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {AUDIO_LIBRARY.map(cat => (
              <Badge
                key={cat.category}
                variant={selectedCategory === cat.category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat.category === selectedCategory ? null : cat.category)}
              >
                {cat.category}
              </Badge>
            ))}
          </div>

          {filteredAudio.map(cat => (
            <div key={cat.category}>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{cat.category}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cat.items.map(item => (
                  <Card
                    key={item.id}
                    className={cn(
                      "cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all",
                      previewingId === item.id && "ring-2 ring-primary"
                    )}
                    onClick={() => handleSelect(item.url)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-9 w-9"
                        onClick={(e) => { e.stopPropagation(); togglePreview(item); }}
                      >
                        {previewingId === item.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.duration}</p>
                      </div>
                      <Check className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {filteredAudio.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="h-10 w-10 mx-auto mb-2" />
              <p>No matching tracks found.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
