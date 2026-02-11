import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Shield, Sword, Sparkles, Trash2,
  ChevronRight, Star, Zap, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useInventory, InventoryEntry, RpItem } from "@/hooks/useInventory";

interface PlayerInventoryMenuProps {
  characterId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAction?: (action: ItemAction) => void;
}

export interface ItemAction {
  actionType: string;
  itemId: string;
  itemName: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: "border-slate-500/30",
  uncommon: "border-green-500/30",
  rare: "border-blue-500/30",
  epic: "border-purple-500/30",
  legendary: "border-amber-500/40 shadow-amber-500/10 shadow-md",
};

const RARITY_DOT: Record<string, string> = {
  common: "bg-slate-500",
  uncommon: "bg-green-500",
  rare: "bg-blue-500",
  epic: "bg-purple-500",
  legendary: "bg-amber-500",
};

const TYPE_ICONS: Record<string, string> = {
  weapon: "⚔️",
  armor: "🛡️",
  consumable: "🧪",
  quest: "📜",
  misc: "📦",
  relic: "✨",
};

// Item-specific actions based on item type
function getItemActions(item: RpItem): Array<{ id: string; label: string; icon: string; destructive?: boolean }> {
  const actions: Array<{ id: string; label: string; icon: string; destructive?: boolean }> = [];
  const name = item.name?.toLowerCase() || "";
  const type = item.item_type;

  // Weapon actions
  if (type === "weapon" || name.includes("knife") || name.includes("dagger") || name.includes("sword") || name.includes("blade") || name.includes("axe")) {
    actions.push(
      { id: "stab", label: "Stab", icon: "🗡️" },
      { id: "slash", label: "Slash", icon: "⚔️" },
      { id: "throw", label: "Throw", icon: "🎯" },
      { id: "hide", label: "Hide on person", icon: "🫥" },
      { id: "brandish", label: "Brandish", icon: "😤" },
    );
  }

  if (name.includes("bow") || name.includes("crossbow")) {
    actions.push(
      { id: "shoot", label: "Shoot", icon: "🏹" },
      { id: "aim", label: "Aim carefully", icon: "🎯" },
    );
  }

  if (name.includes("staff") || name.includes("wand") || name.includes("orb")) {
    actions.push(
      { id: "channel", label: "Channel magic", icon: "✨" },
      { id: "strike", label: "Strike with", icon: "💫" },
    );
  }

  // Armor/shield
  if (type === "armor" || name.includes("shield") || name.includes("armor") || name.includes("helm")) {
    actions.push(
      { id: "equip", label: "Equip", icon: "🛡️" },
      { id: "block", label: "Block with", icon: "🛡️" },
    );
  }

  // Consumable
  if (type === "consumable" || name.includes("potion") || name.includes("elixir") || name.includes("food") || name.includes("drink")) {
    actions.push(
      { id: "consume", label: "Use / Consume", icon: "🧪" },
      { id: "throw_at", label: "Throw at target", icon: "💣" },
      { id: "offer", label: "Offer to someone", icon: "🎁" },
    );
  }

  // Relic / misc
  if (type === "relic" || type === "misc") {
    actions.push(
      { id: "use", label: "Use", icon: "✨" },
      { id: "examine", label: "Examine closely", icon: "🔍" },
    );
  }

  // Quest items
  if (item.is_quest_item) {
    actions.push(
      { id: "examine", label: "Examine", icon: "🔍" },
      { id: "present", label: "Present to NPC", icon: "📜" },
    );
  }

  // Universal
  actions.push(
    { id: "offer_trade", label: "Offer for trade", icon: "🤝" },
    { id: "inspect", label: "Inspect", icon: "🧐" },
  );

  if (!item.is_quest_item) {
    actions.push({ id: "drop", label: "Drop", icon: "⬇️", destructive: true });
  }

  // Dedupe by id
  const seen = new Set<string>();
  return actions.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

export const PlayerInventoryMenu = ({
  characterId,
  open,
  onOpenChange,
  onItemAction,
}: PlayerInventoryMenuProps) => {
  const { inventory, loading, removeItem } = useInventory(characterId);
  const [selectedItem, setSelectedItem] = useState<InventoryEntry | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const categorized = useMemo(() => {
    const cats: Record<string, InventoryEntry[]> = { all: inventory };
    for (const entry of inventory) {
      const type = entry.item?.item_type || "misc";
      if (!cats[type]) cats[type] = [];
      cats[type].push(entry);
    }
    return cats;
  }, [inventory]);

  const displayItems = activeTab === "all" ? inventory : (categorized[activeTab] || []);

  const handleItemAction = (actionId: string, entry: InventoryEntry) => {
    if (actionId === "drop" && entry.item && !entry.item.is_quest_item) {
      removeItem(entry.item_id, 1);
      if (selectedItem?.id === entry.id) setSelectedItem(null);
      return;
    }
    if (onItemAction && entry.item) {
      onItemAction({ actionType: actionId, itemId: entry.item_id, itemName: entry.item.name });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px] sm:w-[400px] p-0 flex flex-col">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            Inventory
            <Badge variant="outline" className="ml-auto text-xs">
              {inventory.length} items
            </Badge>
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Category filter */}
            <div className="flex gap-1 px-3 py-2 overflow-x-auto">
              <Button
                size="sm"
                variant={activeTab === "all" ? "default" : "ghost"}
                className="text-xs h-7 shrink-0"
                onClick={() => setActiveTab("all")}
              >
                All ({inventory.length})
              </Button>
              {Object.entries(categorized)
                .filter(([k]) => k !== "all")
                .map(([type, items]) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={activeTab === type ? "default" : "ghost"}
                    className="text-xs h-7 shrink-0"
                    onClick={() => setActiveTab(type)}
                  >
                    {TYPE_ICONS[type] || "📦"} {type} ({items.length})
                  </Button>
                ))}
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Item list */}
              <ScrollArea className={`${selectedItem ? "w-1/2" : "w-full"} border-r`}>
                <div className="p-2 space-y-1">
                  {displayItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No items</p>
                    </div>
                  ) : (
                    displayItems.map((entry) => {
                      const item = entry.item;
                      if (!item) return null;
                      const rarity = item.rarity || "common";
                      const isSelected = selectedItem?.id === entry.id;

                      return (
                        <motion.button
                          key={entry.id}
                          layout
                          className={`w-full text-left rounded-lg border p-2.5 transition-colors ${
                            RARITY_COLORS[rarity] || RARITY_COLORS.common
                          } ${isSelected ? "bg-accent/10 ring-1 ring-primary/30" : "hover:bg-muted/50"}`}
                          onClick={() => setSelectedItem(isSelected ? null : entry)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{item.icon_emoji || "📦"}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              <div className="flex items-center gap-1.5">
                                <div className={`h-1.5 w-1.5 rounded-full ${RARITY_DOT[rarity] || RARITY_DOT.common}`} />
                                <span className="text-[10px] text-muted-foreground capitalize">{rarity}</span>
                                {entry.quantity > 1 && (
                                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">
                                    x{entry.quantity}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {item.is_quest_item && <Star className="h-3 w-3 text-amber-500" />}
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              {/* Item detail + actions */}
              <AnimatePresence>
                {selectedItem && selectedItem.item && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "50%", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <ScrollArea className="h-full">
                      <div className="p-3 space-y-3">
                        {/* Header */}
                        <div className="text-center">
                          <span className="text-3xl">{selectedItem.item.icon_emoji || "📦"}</span>
                          <h3 className="font-semibold text-sm mt-1">{selectedItem.item.name}</h3>
                          <div className="flex items-center justify-center gap-1.5 mt-1">
                            <div className={`h-2 w-2 rounded-full ${RARITY_DOT[selectedItem.item.rarity || "common"]}`} />
                            <span className="text-xs text-muted-foreground capitalize">
                              {selectedItem.item.rarity || "common"} {selectedItem.item.item_type}
                            </span>
                          </div>
                        </div>

                        {selectedItem.item.description && (
                          <p className="text-xs text-muted-foreground italic text-center">
                            {selectedItem.item.description}
                          </p>
                        )}

                        {/* Stat bonuses */}
                        {selectedItem.item.stat_bonus && Object.keys(selectedItem.item.stat_bonus).length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {Object.entries(selectedItem.item.stat_bonus).map(([stat, val]) => (
                              <Badge key={stat} variant="secondary" className="text-[10px]">
                                {stat} +{val}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <Separator />

                        {/* Item Actions */}
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                            Actions
                          </p>
                          {getItemActions(selectedItem.item).map((action) => (
                            <Button
                              key={action.id}
                              variant={action.destructive ? "destructive" : "ghost"}
                              size="sm"
                              className="w-full justify-start h-8 text-xs gap-2"
                              onClick={() => handleItemAction(action.id, selectedItem)}
                            >
                              <span>{action.icon}</span>
                              {action.label}
                            </Button>
                          ))}
                        </div>

                        <div className="text-[10px] text-muted-foreground text-center pt-2">
                          Qty: {selectedItem.quantity} · Found:{" "}
                          {new Date(selectedItem.acquired_at).toLocaleDateString()}
                        </div>
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
