import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sword, Eye, MessageSquare, Footprints, Crosshair, Zap,
  Search, ChevronRight, Sparkles, Shield, Heart, Hand,
  Volume2, Flame, BookOpen, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CharacterStats } from "@/hooks/useLoreChronicles";
import { InventoryEntry } from "@/hooks/useInventory";

// All possible player actions organized by category
export interface PlayerAction {
  id: string;
  name: string;
  category: ActionCategory;
  description: string;
  icon: string;
  statRequired?: { stat: keyof CharacterStats; min: number };
  itemRequired?: string; // item_type or "any"
  contextual?: boolean; // only appears in certain situations
}

type ActionCategory = "combat" | "stealth" | "social" | "exploration" | "survival" | "magic";

const CATEGORY_CONFIG: Record<ActionCategory, { icon: typeof Sword; label: string; color: string }> = {
  combat: { icon: Sword, label: "Combat", color: "text-red-500" },
  stealth: { icon: Eye, label: "Stealth", color: "text-purple-500" },
  social: { icon: MessageSquare, label: "Social", color: "text-blue-500" },
  exploration: { icon: Search, label: "Explore", color: "text-green-500" },
  survival: { icon: Shield, label: "Survival", color: "text-amber-500" },
  magic: { icon: Sparkles, label: "Magic", color: "text-cyan-500" },
};

// Full action library — always available based on stats/items
const ALL_ACTIONS: PlayerAction[] = [
  // Combat
  { id: "punch", name: "Punch", category: "combat", description: "Strike with your fists", icon: "👊", statRequired: { stat: "strength", min: 2 } },
  { id: "kick", name: "Kick", category: "combat", description: "A powerful kick", icon: "🦵", statRequired: { stat: "strength", min: 3 } },
  { id: "tackle", name: "Tackle", category: "combat", description: "Charge and tackle the target", icon: "💥", statRequired: { stat: "strength", min: 4 } },
  { id: "block", name: "Block", category: "combat", description: "Brace for an incoming attack", icon: "🛡️", statRequired: { stat: "strength", min: 3 } },
  { id: "dodge", name: "Dodge", category: "combat", description: "Evade an incoming attack", icon: "💨", statRequired: { stat: "agility", min: 4 } },
  { id: "disarm", name: "Disarm", category: "combat", description: "Knock the weapon from their hands", icon: "🤺", statRequired: { stat: "agility", min: 5 } },
  { id: "grapple", name: "Grapple", category: "combat", description: "Restrain your opponent", icon: "🤼", statRequired: { stat: "strength", min: 5 } },
  { id: "headbutt", name: "Headbutt", category: "combat", description: "A desperate close-range strike", icon: "🤕", statRequired: { stat: "strength", min: 3 } },

  // Stealth
  { id: "sneak", name: "Sneak", category: "stealth", description: "Move silently past danger", icon: "🤫", statRequired: { stat: "agility", min: 3 } },
  { id: "hide", name: "Hide", category: "stealth", description: "Conceal yourself from view", icon: "🫥", statRequired: { stat: "agility", min: 3 } },
  { id: "pickpocket", name: "Pickpocket", category: "stealth", description: "Steal from an unsuspecting target", icon: "🤏", statRequired: { stat: "agility", min: 6 } },
  { id: "eavesdrop", name: "Eavesdrop", category: "stealth", description: "Listen to a nearby conversation", icon: "👂", statRequired: { stat: "agility", min: 2 } },
  { id: "lockpick", name: "Pick Lock", category: "stealth", description: "Attempt to open a lock", icon: "🔓", statRequired: { stat: "agility", min: 4 }, itemRequired: "lockpick" },
  { id: "disguise", name: "Disguise", category: "stealth", description: "Change your appearance", icon: "🎭", statRequired: { stat: "charisma", min: 4 } },
  { id: "sabotage", name: "Sabotage", category: "stealth", description: "Tamper with something covertly", icon: "🔧", statRequired: { stat: "agility", min: 5 } },
  { id: "plant_evidence", name: "Plant Evidence", category: "stealth", description: "Place incriminating items", icon: "📋", statRequired: { stat: "agility", min: 5 } },

  // Social
  { id: "persuade", name: "Persuade", category: "social", description: "Convince someone through reason", icon: "🗣️", statRequired: { stat: "charisma", min: 4 } },
  { id: "intimidate", name: "Intimidate", category: "social", description: "Frighten someone into compliance", icon: "😠", statRequired: { stat: "strength", min: 4 } },
  { id: "deceive", name: "Deceive", category: "social", description: "Tell a convincing lie", icon: "🤥", statRequired: { stat: "charisma", min: 5 } },
  { id: "flatter", name: "Flatter", category: "social", description: "Compliment to gain favor", icon: "😊", statRequired: { stat: "charisma", min: 3 } },
  { id: "insult", name: "Insult", category: "social", description: "Provoke with cutting words", icon: "🤬", statRequired: { stat: "charisma", min: 2 } },
  { id: "barter", name: "Barter", category: "social", description: "Negotiate a trade or deal", icon: "🤝", statRequired: { stat: "charisma", min: 3 } },
  { id: "beg", name: "Beg", category: "social", description: "Plead desperately for help", icon: "🙏" },
  { id: "seduce", name: "Seduce", category: "social", description: "Use charm and allure", icon: "😏", statRequired: { stat: "charisma", min: 7 } },
  { id: "rally", name: "Rally", category: "social", description: "Inspire allies to action", icon: "📢", statRequired: { stat: "charisma", min: 6 } },
  { id: "threaten", name: "Threaten", category: "social", description: "Issue a serious warning", icon: "⚠️", statRequired: { stat: "strength", min: 3 } },

  // Exploration
  { id: "search", name: "Search Area", category: "exploration", description: "Look carefully for hidden things", icon: "🔍" },
  { id: "examine", name: "Examine", category: "exploration", description: "Study something closely", icon: "🧐" },
  { id: "listen", name: "Listen", category: "exploration", description: "Pay attention to sounds", icon: "👂" },
  { id: "smell", name: "Smell", category: "exploration", description: "Sniff the air for clues", icon: "👃" },
  { id: "climb", name: "Climb", category: "exploration", description: "Scale a surface", icon: "🧗", statRequired: { stat: "agility", min: 4 } },
  { id: "swim", name: "Swim", category: "exploration", description: "Travel through water", icon: "🏊", statRequired: { stat: "strength", min: 3 } },
  { id: "dig", name: "Dig", category: "exploration", description: "Excavate the ground", icon: "⛏️", statRequired: { stat: "strength", min: 3 } },
  { id: "track", name: "Track", category: "exploration", description: "Follow footprints or trails", icon: "🐾", statRequired: { stat: "agility", min: 3 } },

  // Survival
  { id: "rest", name: "Rest", category: "survival", description: "Take a moment to recover", icon: "😴" },
  { id: "forage", name: "Forage", category: "survival", description: "Search for food and supplies", icon: "🌿" },
  { id: "camp", name: "Make Camp", category: "survival", description: "Set up a temporary shelter", icon: "⛺" },
  { id: "bandage", name: "Bandage Wound", category: "survival", description: "Treat an injury", icon: "🩹", itemRequired: "bandage" },
  { id: "cook", name: "Cook", category: "survival", description: "Prepare food for bonuses", icon: "🍳", itemRequired: "food" },
  { id: "craft", name: "Craft", category: "survival", description: "Create something from materials", icon: "🔨", statRequired: { stat: "agility", min: 3 } },
  { id: "pray", name: "Pray", category: "survival", description: "Seek divine guidance or protection", icon: "🙏" },
  { id: "meditate", name: "Meditate", category: "survival", description: "Focus your mind and spirit", icon: "🧘", statRequired: { stat: "magic", min: 2 } },

  // Magic
  { id: "cast_spell", name: "Cast Spell", category: "magic", description: "Channel arcane energy", icon: "✨", statRequired: { stat: "magic", min: 4 } },
  { id: "heal", name: "Heal", category: "magic", description: "Mend wounds with magic", icon: "💚", statRequired: { stat: "magic", min: 5 } },
  { id: "detect_magic", name: "Detect Magic", category: "magic", description: "Sense magical auras", icon: "🔮", statRequired: { stat: "magic", min: 3 } },
  { id: "enchant", name: "Enchant", category: "magic", description: "Imbue an item with magic", icon: "⚡", statRequired: { stat: "magic", min: 6 } },
  { id: "dispel", name: "Dispel", category: "magic", description: "Remove magical effects", icon: "🚫", statRequired: { stat: "magic", min: 5 } },
  { id: "summon", name: "Summon", category: "magic", description: "Call forth a creature or spirit", icon: "👻", statRequired: { stat: "magic", min: 7 } },
  { id: "illusion", name: "Create Illusion", category: "magic", description: "Conjure a false image", icon: "🌈", statRequired: { stat: "magic", min: 4 } },
  { id: "telekinesis", name: "Telekinesis", category: "magic", description: "Move objects with your mind", icon: "🫳", statRequired: { stat: "magic", min: 6 } },
];

interface PlayerInteractionsMenuProps {
  characterStats: CharacterStats;
  inventory: InventoryEntry[];
  onAction: (action: PlayerAction) => void;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PlayerInteractionsMenu = ({
  characterStats,
  inventory,
  onAction,
  disabled = false,
  open,
  onOpenChange,
}: PlayerInteractionsMenuProps) => {
  const [activeCategory, setActiveCategory] = useState<ActionCategory>("combat");
  const [searchQuery, setSearchQuery] = useState("");

  const checkStatMet = (action: PlayerAction): boolean => {
    if (!action.statRequired) return true;
    const val = characterStats[action.statRequired.stat] || 0;
    return val >= action.statRequired.min;
  };

  const checkItemMet = (action: PlayerAction): boolean => {
    if (!action.itemRequired) return true;
    return inventory.some(
      (e) => e.item?.item_type === action.itemRequired || 
             e.item?.name?.toLowerCase().includes(action.itemRequired!.replace("_", " "))
    );
  };

  // Get item-specific actions from equipped inventory
  const itemActions = useMemo(() => {
    const actions: PlayerAction[] = [];
    for (const entry of inventory) {
      const item = entry.item;
      if (!item) continue;
      const type = item.item_type;

      // Generate item-specific actions based on item type
      if (type === "weapon" || item.name?.toLowerCase().includes("knife") || item.name?.toLowerCase().includes("dagger") || item.name?.toLowerCase().includes("sword")) {
        actions.push(
          { id: `stab_${item.id}`, name: `Stab (${item.name})`, category: "combat", description: `Attack with ${item.name}`, icon: "🗡️", statRequired: { stat: "strength", min: 3 } },
          { id: `slash_${item.id}`, name: `Slash (${item.name})`, category: "combat", description: `Sweeping attack with ${item.name}`, icon: "⚔️", statRequired: { stat: "strength", min: 4 } },
          { id: `throw_weapon_${item.id}`, name: `Throw (${item.name})`, category: "combat", description: `Hurl ${item.name} at a target`, icon: "🎯", statRequired: { stat: "agility", min: 4 } },
          { id: `hide_weapon_${item.id}`, name: `Hide (${item.name})`, category: "stealth", description: `Conceal ${item.name} on your person`, icon: "🫥", statRequired: { stat: "agility", min: 3 } },
          { id: `brandish_${item.id}`, name: `Brandish (${item.name})`, category: "social", description: `Display ${item.name} threateningly`, icon: "😤", statRequired: { stat: "strength", min: 2 } },
        );
      }

      if (type === "armor" || item.name?.toLowerCase().includes("shield")) {
        actions.push(
          { id: `equip_armor_${item.id}`, name: `Brace (${item.name})`, category: "combat", description: `Use ${item.name} defensively`, icon: "🛡️" },
        );
      }

      if (type === "consumable" || item.name?.toLowerCase().includes("potion")) {
        actions.push(
          { id: `use_${item.id}`, name: `Use (${item.name})`, category: "survival", description: `Consume ${item.name}`, icon: "🧪" },
          { id: `throw_potion_${item.id}`, name: `Throw (${item.name})`, category: "combat", description: `Throw ${item.name} at target`, icon: "💣", statRequired: { stat: "agility", min: 3 } },
        );
      }

      if (type === "relic" || type === "misc") {
        actions.push(
          { id: `use_item_${item.id}`, name: `Use (${item.name})`, category: "exploration", description: `Use ${item.name}`, icon: "✨" },
          { id: `examine_item_${item.id}`, name: `Examine (${item.name})`, category: "exploration", description: `Study ${item.name} closely`, icon: "🔍" },
          { id: `offer_${item.id}`, name: `Offer (${item.name})`, category: "social", description: `Present ${item.name} to someone`, icon: "🎁" },
        );
      }

      // Universal item actions
      actions.push(
        { id: `drop_${item.id}`, name: `Drop (${item.name})`, category: "exploration", description: `Leave ${item.name} behind`, icon: "⬇️" },
      );
    }
    return actions;
  }, [inventory]);

  const allActions = useMemo(() => [...ALL_ACTIONS, ...itemActions], [itemActions]);

  const filteredActions = useMemo(() => {
    let actions = allActions.filter((a) => a.category === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      actions = allActions.filter(
        (a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      );
    }
    return actions;
  }, [allActions, activeCategory, searchQuery]);

  const availableCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of Object.keys(CATEGORY_CONFIG)) {
      counts[cat] = allActions
        .filter((a) => a.category === cat)
        .filter((a) => checkStatMet(a) && checkItemMet(a)).length;
    }
    return counts;
  }, [allActions, characterStats, inventory]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[340px] sm:w-[400px] p-0 flex flex-col">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            Actions
          </SheetTitle>
          <Input
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-sm"
          />
        </SheetHeader>

        <Tabs
          value={searchQuery ? "all" : activeCategory}
          onValueChange={(v) => {
            setSearchQuery("");
            setActiveCategory(v as ActionCategory);
          }}
          className="flex-1 flex flex-col min-h-0"
        >
          {!searchQuery && (
            <TabsList className="grid grid-cols-6 mx-2 mt-2">
              {(Object.entries(CATEGORY_CONFIG) as [ActionCategory, typeof CATEGORY_CONFIG[ActionCategory]][]).map(
                ([cat, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <TabsTrigger key={cat} value={cat} className="text-[10px] gap-0.5 px-1 flex-col h-auto py-1.5">
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                      <span>{cfg.label}</span>
                      <span className="text-[9px] text-muted-foreground">{availableCount[cat]}</span>
                    </TabsTrigger>
                  );
                }
              )}
            </TabsList>
          )}

          <ScrollArea className="flex-1 px-2 py-2">
            <div className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {filteredActions.map((action) => {
                  const statMet = checkStatMet(action);
                  const itemMet = checkItemMet(action);
                  const available = statMet && itemMet;

                  return (
                    <motion.div
                      key={action.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <Button
                        variant="ghost"
                        className={`w-full justify-start h-auto py-2.5 px-3 text-left ${
                          !available ? "opacity-40" : "hover:bg-accent/10"
                        }`}
                        disabled={disabled || !available}
                        onClick={() => onAction(action)}
                      >
                        <div className="flex items-start gap-2.5 w-full">
                          <span className="text-lg shrink-0 mt-0.5">{action.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{action.name}</p>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {action.description}
                            </p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {action.statRequired && (
                                <Badge
                                  variant={statMet ? "outline" : "destructive"}
                                  className="text-[9px] px-1 py-0 h-4"
                                >
                                  {action.statRequired.stat.slice(0, 3).toUpperCase()} {action.statRequired.min}+
                                </Badge>
                              )}
                              {action.itemRequired && (
                                <Badge
                                  variant={itemMet ? "outline" : "destructive"}
                                  className="text-[9px] px-1 py-0 h-4"
                                >
                                  🎒 {action.itemRequired}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                        </div>
                      </Button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {filteredActions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {searchQuery ? "No matching actions found" : "No actions in this category"}
                </p>
              )}
            </div>
          </ScrollArea>
        </Tabs>

        {/* Stats footer */}
        <div className="border-t p-3 flex flex-wrap gap-1.5">
          {Object.entries(characterStats).map(([stat, value]) => (
            <Badge key={stat} variant="outline" className="text-[10px]">
              {stat.slice(0, 3).toUpperCase()}: {value}
            </Badge>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
