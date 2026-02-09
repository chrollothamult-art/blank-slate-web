import { motion } from "framer-motion";
import { Package, Lock, Sparkles, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useInventory, InventoryEntry } from "@/hooks/useInventory";

interface InventoryPanelProps {
  characterId: string;
  inventorySlots: number;
  editable?: boolean;
}

const rarityColors: Record<string, string> = {
  common: "bg-slate-500",
  uncommon: "bg-green-500",
  rare: "bg-blue-500",
  epic: "bg-purple-500",
  legendary: "bg-amber-500",
};

const rarityBorderColors: Record<string, string> = {
  common: "border-slate-500/30",
  uncommon: "border-green-500/30",
  rare: "border-blue-500/30",
  epic: "border-purple-500/30",
  legendary: "border-amber-500/30 shadow-amber-500/20 shadow-lg",
};

const typeLabels: Record<string, string> = {
  weapon: "⚔️ Weapon",
  armor: "🛡️ Armor",
  consumable: "🧪 Consumable",
  quest: "📜 Quest Item",
  misc: "📦 Misc",
  relic: "✨ Relic",
};

export const InventoryPanel = ({ characterId, inventorySlots, editable = false }: InventoryPanelProps) => {
  const { inventory, loading, removeItem } = useInventory(characterId);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Loading inventory...</div>
        </CardContent>
      </Card>
    );
  }

  const usedSlots = inventory.length;
  const emptySlots = Math.max(0, inventorySlots - usedSlots);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Inventory
          </CardTitle>
          <Badge variant="outline">
            {usedSlots} / {inventorySlots} slots
          </Badge>
        </div>
        <CardDescription>
          Items collected during your adventures
        </CardDescription>
      </CardHeader>
      <CardContent>
        {inventory.length === 0 && emptySlots === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No items yet</p>
            <p className="text-sm">Complete story nodes to find items</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {inventory.map((entry, index) => (
              <ItemCard
                key={entry.id}
                entry={entry}
                index={index}
                editable={editable}
                onRemove={() => removeItem(entry.item_id)}
              />
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <motion.div
                key={`empty-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (usedSlots + i) * 0.03 }}
                className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center bg-muted/10"
              >
                <Lock className="h-5 w-5 text-muted-foreground/30" />
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ItemCard = ({
  entry,
  index,
  editable,
  onRemove,
}: {
  entry: InventoryEntry;
  index: number;
  editable: boolean;
  onRemove: () => void;
}) => {
  const item = entry.item;
  if (!item) return null;

  const rarity = item.rarity || "common";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, type: "spring" }}
            className={`aspect-square rounded-xl border-2 ${rarityBorderColors[rarity] || rarityBorderColors.common} bg-gradient-to-br from-background to-muted/30 p-2 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-105 transition-transform relative overflow-hidden group`}
          >
            {/* Rarity glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity ${rarityColors[rarity] || rarityColors.common}`} />

            {/* Icon */}
            <span className="text-2xl mb-1">{item.icon_emoji || "📦"}</span>

            {/* Name */}
            <p className="text-[10px] font-semibold line-clamp-2 leading-tight">
              {item.name}
            </p>

            {/* Quantity */}
            {entry.quantity > 1 && (
              <Badge variant="secondary" className="absolute top-1 right-1 text-[9px] px-1 py-0 h-4">
                x{entry.quantity}
              </Badge>
            )}

            {/* Quest item indicator */}
            {item.is_quest_item && (
              <Sparkles className="absolute top-1 left-1 h-3 w-3 text-amber-500" />
            )}

            {/* Rarity dot */}
            <div className={`absolute bottom-1 left-1 h-2 w-2 rounded-full ${rarityColors[rarity] || rarityColors.common}`} />

            {/* Remove button */}
            {editable && !item.is_quest_item && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-0 right-0 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{item.icon_emoji}</span>
              <span className="font-semibold">{item.name}</span>
              <Badge className={`${rarityColors[rarity] || rarityColors.common} text-white text-xs`}>
                {rarity}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {typeLabels[item.item_type] || item.item_type}
            </p>
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
            {item.stat_bonus && Object.keys(item.stat_bonus).length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {Object.entries(item.stat_bonus).map(([stat, value]) => (
                  <Badge key={stat} variant="secondary" className="text-xs">
                    {stat} +{value}
                  </Badge>
                ))}
              </div>
            )}
            {item.is_consumable && (
              <Badge variant="outline" className="text-xs">Consumable</Badge>
            )}
            {item.is_quest_item && (
              <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">Quest Item</Badge>
            )}
            <p className="text-xs text-muted-foreground">
              Qty: {entry.quantity} • Found: {new Date(entry.acquired_at).toLocaleDateString()}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default InventoryPanel;
