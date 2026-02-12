import { motion } from "framer-motion";
import { Shield, Sword, Crown, Footprints, Hand, Gem, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useInventory, InventoryEntry } from "@/hooks/useInventory";

interface EquipmentPanelProps {
  characterId: string;
}

const EQUIPMENT_SLOTS = [
  { key: "head", label: "Head", icon: Crown },
  { key: "chest", label: "Chest", icon: Shield },
  { key: "hands", label: "Hands", icon: Hand },
  { key: "feet", label: "Feet", icon: Footprints },
  { key: "weapon", label: "Weapon", icon: Sword },
  { key: "accessory", label: "Accessory", icon: Gem },
] as const;

const rarityColors: Record<string, string> = {
  common: "border-slate-500/30",
  uncommon: "border-green-500/30",
  rare: "border-blue-500/30",
  epic: "border-purple-500/30",
  legendary: "border-amber-500/40 shadow-amber-500/10 shadow-md",
};

export const EquipmentPanel = ({ characterId }: EquipmentPanelProps) => {
  const { inventory, equipItem, unequipItem, getEquippedStatBonuses, loading } = useInventory(characterId);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse text-muted-foreground">Loading equipment...</div>
        </CardContent>
      </Card>
    );
  }

  const equippedBySlot = new Map<string, InventoryEntry>();
  for (const entry of inventory) {
    if (entry.equipped_slot) {
      equippedBySlot.set(entry.equipped_slot, entry);
    }
  }

  const equippableItems = inventory.filter(
    (e) => e.item?.equipment_slot && !e.equipped_slot
  );

  const statBonuses = getEquippedStatBonuses();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Equipment
          </CardTitle>
          {Object.keys(statBonuses).length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {Object.entries(statBonuses).map(([stat, value]) => (
                <Badge key={stat} variant="secondary" className="text-xs">
                  {stat} +{value}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <CardDescription>Equip items to gain stat bonuses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {EQUIPMENT_SLOTS.map(({ key, label, icon: Icon }) => {
            const equipped = equippedBySlot.get(key);
            const rarity = equipped?.item?.rarity || "common";

            return (
              <TooltipProvider key={key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative rounded-xl border-2 p-3 flex flex-col items-center justify-center text-center min-h-[100px] transition-all ${
                        equipped
                          ? `${rarityColors[rarity] || rarityColors.common} bg-gradient-to-br from-background to-muted/30`
                          : "border-dashed border-muted-foreground/20 bg-muted/10"
                      }`}
                    >
                      {equipped ? (
                        <>
                          <span className="text-2xl mb-1">{equipped.item?.icon_emoji || "📦"}</span>
                          <p className="text-[11px] font-semibold line-clamp-1">{equipped.item?.name}</p>
                          <p className="text-[9px] text-muted-foreground capitalize">{label}</p>

                          {/* Durability bar */}
                          {equipped.current_durability !== null && equipped.item?.max_durability && (
                            <div className="w-full mt-1.5">
                              <Progress
                                value={(equipped.current_durability / equipped.item.max_durability) * 100}
                                className="h-1.5"
                              />
                              <p className="text-[8px] text-muted-foreground text-center mt-0.5">
                                {equipped.current_durability}/{equipped.item.max_durability}
                              </p>
                            </div>
                          )}

                          {/* Unequip button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-5 w-5 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              unequipItem(equipped.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Icon className="h-6 w-6 text-muted-foreground/30 mb-1" />
                          <p className="text-[10px] text-muted-foreground">{label}</p>
                        </>
                      )}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    {equipped ? (
                      <div className="space-y-1">
                        <p className="font-semibold">{equipped.item?.icon_emoji} {equipped.item?.name}</p>
                        {equipped.item?.description && (
                          <p className="text-xs text-muted-foreground">{equipped.item.description}</p>
                        )}
                        {equipped.item?.stat_bonus && Object.keys(equipped.item.stat_bonus).length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {Object.entries(equipped.item.stat_bonus).map(([stat, val]) => (
                              <Badge key={stat} variant="secondary" className="text-xs">
                                {stat} +{val}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {equipped.current_durability !== null && equipped.current_durability <= 0 && (
                          <Badge variant="destructive" className="text-xs">Broken — no stat bonuses</Badge>
                        )}
                        <p className="text-xs text-muted-foreground">Click X to unequip</p>
                      </div>
                    ) : (
                      <p className="text-xs">No {label.toLowerCase()} equipped</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Equippable items from inventory */}
        {equippableItems.length > 0 && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Available to equip:</p>
            <div className="flex flex-wrap gap-2">
              {equippableItems.map((entry) => (
                <Badge
                  key={entry.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors gap-1"
                  onClick={() => {
                    if (entry.item?.equipment_slot) {
                      equipItem(entry.id, entry.item.equipment_slot);
                    }
                  }}
                >
                  {entry.item?.icon_emoji || "📦"} {entry.item?.name}
                  <span className="text-muted-foreground text-[9px]">({entry.item?.equipment_slot})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EquipmentPanel;
