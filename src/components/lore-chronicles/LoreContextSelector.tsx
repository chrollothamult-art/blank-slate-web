import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, MapPin, Users, Wand2, Crown, Gem, Scroll, X, Check, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface LoreEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url?: string | null;
}

interface LoreContextSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

const CATEGORIES = [
  { key: "characters", label: "Characters", icon: Users, table: "almanac_characters" },
  { key: "locations", label: "Locations", icon: MapPin, table: "almanac_locations" },
  { key: "races", label: "Races", icon: Crown, table: "almanac_races" },
  { key: "magic", label: "Magic", icon: Wand2, table: "almanac_magic" },
  { key: "relics", label: "Relics", icon: Gem, table: "almanac_relics" },
  { key: "kingdoms", label: "Kingdoms", icon: Scroll, table: "almanac_kingdoms" },
];

export const LoreContextSelector = ({ selectedIds, onSelectionChange }: LoreContextSelectorProps) => {
  const [entries, setEntries] = useState<Record<string, LoreEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("characters");

  useEffect(() => {
    const fetchAllEntries = async () => {
      setLoading(true);
      const result: Record<string, LoreEntry[]> = {};

      for (const category of CATEGORIES) {
        const { data } = await supabase
          .from(category.table as "almanac_characters")
          .select("id, name, description, image_url")
          .eq("is_disabled", false)
          .order("name");

        result[category.key] = ((data || []) as Array<{
          id: string;
          name: string;
          description: string;
          image_url: string | null;
        }>).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          category: category.key,
          image_url: item.image_url,
        }));
      }

      setEntries(result);
      setLoading(false);
    };

    fetchAllEntries();
  }, []);

  const toggleEntry = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const selectAll = (category: string) => {
    const categoryIds = entries[category]?.map((e) => e.id) || [];
    const newSelection = [...new Set([...selectedIds, ...categoryIds])];
    onSelectionChange(newSelection);
  };

  const deselectAll = (category: string) => {
    const categoryIds = entries[category]?.map((e) => e.id) || [];
    onSelectionChange(selectedIds.filter((id) => !categoryIds.includes(id)));
  };

  const filteredEntries = (category: string) => {
    const categoryEntries = entries[category] || [];
    if (!searchQuery.trim()) return categoryEntries;
    return categoryEntries.filter(
      (e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getCategoryCount = (category: string) => {
    const categoryIds = entries[category]?.map((e) => e.id) || [];
    return categoryIds.filter((id) => selectedIds.includes(id)).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-center">
          <Book className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading almanac entries...</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Book className="h-5 w-5" />
          Lore Context Injection
        </CardTitle>
        <CardDescription>
          Select almanac entries for the AI to reference when generating narration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedIds.length} entries selected
          </p>
          {selectedIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange([])}
              className="text-destructive"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="pl-9"
          />
        </div>

        {/* Categories Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-auto gap-1">
            {CATEGORIES.map(({ key, label, icon: Icon }) => (
              <TabsTrigger key={key} value={key} className="flex-col gap-1 py-2 px-2 text-xs">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                {getCategoryCount(key) > 0 && (
                  <Badge variant="secondary" className="h-4 text-[10px] px-1">
                    {getCategoryCount(key)}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES.map(({ key, label }) => (
            <TabsContent key={key} value={key} className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">{label}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectAll(key)}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deselectAll(key)}
                  >
                    <X className="h-3 w-3 mr-1" />
                    None
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  <AnimatePresence>
                    {filteredEntries(key).map((entry, index) => {
                      const isSelected = selectedIds.includes(entry.id);
                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                        >
                          <div
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40"
                            }`}
                            onClick={() => toggleEntry(entry.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleEntry(entry.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {entry.name}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {entry.description}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {filteredEntries(key).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No entries found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
