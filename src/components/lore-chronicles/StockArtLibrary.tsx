import { useState } from "react";
import { Search, Image as ImageIcon, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Curated stock art categories for fantasy campaigns
const STOCK_ART: { category: string; items: { id: string; label: string; keywords: string[]; url: string }[] }[] = [
  {
    category: "Landscapes",
    items: [
      { id: "forest-path", label: "Forest Path", keywords: ["forest", "path", "woods", "nature"], url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80" },
      { id: "mountain-peak", label: "Mountain Peak", keywords: ["mountain", "peak", "summit", "high"], url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" },
      { id: "dark-cave", label: "Dark Cave", keywords: ["cave", "dark", "underground", "dungeon"], url: "https://images.unsplash.com/photo-1504699439244-b4f7e9e1faab?w=800&q=80" },
      { id: "river-valley", label: "River Valley", keywords: ["river", "valley", "water", "stream"], url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80" },
      { id: "desert-dunes", label: "Desert Dunes", keywords: ["desert", "sand", "dunes", "arid"], url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80" },
      { id: "snow-landscape", label: "Snowy Landscape", keywords: ["snow", "winter", "ice", "frozen"], url: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=800&q=80" },
    ],
  },
  {
    category: "Structures",
    items: [
      { id: "castle-gate", label: "Castle Gate", keywords: ["castle", "gate", "fortress", "kingdom"], url: "https://images.unsplash.com/photo-1533154683220-bfcef4aba930?w=800&q=80" },
      { id: "tavern-interior", label: "Tavern Interior", keywords: ["tavern", "inn", "pub", "bar"], url: "https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=800&q=80" },
      { id: "ancient-ruins", label: "Ancient Ruins", keywords: ["ruins", "ancient", "temple", "old"], url: "https://images.unsplash.com/photo-1568322503323-f41e3a4c0e5f?w=800&q=80" },
      { id: "village-road", label: "Village Road", keywords: ["village", "town", "road", "settlement"], url: "https://images.unsplash.com/photo-1580137189272-c9379f8864fd?w=800&q=80" },
    ],
  },
  {
    category: "Atmosphere",
    items: [
      { id: "stormy-sky", label: "Stormy Sky", keywords: ["storm", "lightning", "thunder", "dark"], url: "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=800&q=80" },
      { id: "misty-morning", label: "Misty Morning", keywords: ["mist", "fog", "morning", "dawn"], url: "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?w=800&q=80" },
      { id: "starry-night", label: "Starry Night", keywords: ["stars", "night", "sky", "celestial"], url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80" },
      { id: "sunset-glow", label: "Sunset Glow", keywords: ["sunset", "dusk", "evening", "golden"], url: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&q=80" },
    ],
  },
  {
    category: "Objects",
    items: [
      { id: "ancient-book", label: "Ancient Book", keywords: ["book", "tome", "scroll", "library"], url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80" },
      { id: "treasure-chest", label: "Treasure", keywords: ["treasure", "gold", "chest", "coins"], url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80" },
      { id: "campfire", label: "Campfire", keywords: ["fire", "camp", "flame", "warmth"], url: "https://images.unsplash.com/photo-1475619175254-66fedbb72225?w=800&q=80" },
      { id: "sword-weapon", label: "Sword", keywords: ["sword", "weapon", "blade", "combat"], url: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=800&q=80" },
    ],
  },
];

interface StockArtLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

export const StockArtLibrary = ({ open, onOpenChange, onSelect }: StockArtLibraryProps) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredArt = STOCK_ART.map(cat => ({
    ...cat,
    items: cat.items.filter(item => {
      if (selectedCategory && cat.category !== selectedCategory) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return item.label.toLowerCase().includes(q) || item.keywords.some(k => k.includes(q));
    }),
  })).filter(cat => cat.items.length > 0);

  const handleSelect = (url: string) => {
    onSelect(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Stock Art Library
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search scenes..."
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
            {STOCK_ART.map(cat => (
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

          {/* Art Grid */}
          {filteredArt.map(cat => (
            <div key={cat.category}>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{cat.category}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {cat.items.map(item => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all overflow-hidden group"
                    onClick={() => handleSelect(item.url)}
                  >
                    <div className="relative aspect-video">
                      <img
                        src={item.url}
                        alt={item.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Check className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <CardContent className="p-2">
                      <p className="text-xs font-medium truncate">{item.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {filteredArt.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-10 w-10 mx-auto mb-2" />
              <p>No matching art found.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
