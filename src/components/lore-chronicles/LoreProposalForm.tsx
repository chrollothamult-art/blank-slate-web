import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Scroll, Sparkles, MapPin, Sword, Users, Wand2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLoreProposals, ProposalCategory, LoreProposalContent } from "@/hooks/useLoreProposals";
import { useAuth } from "@/contexts/AuthContext";
import { useLoreConflictChecker } from "@/hooks/useLoreConflictChecker";
import { LoreConflictWarnings } from "@/components/lore-chronicles/LoreConflictWarnings";
import { useDebounce } from "@/hooks/useDebounce";

const CATEGORIES: { value: ProposalCategory; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "race", label: "Race", icon: <Users className="h-5 w-5" />, description: "A new playable race for characters" },
  { value: "location", label: "Location", icon: <MapPin className="h-5 w-5" />, description: "A place in the ThouArt world" },
  { value: "item", label: "Item", icon: <Sword className="h-5 w-5" />, description: "Weapons, artifacts, or relics" },
  { value: "faction", label: "Faction", icon: <Users className="h-5 w-5" />, description: "Organizations or groups" },
  { value: "ability", label: "Ability", icon: <Wand2 className="h-5 w-5" />, description: "Magic or skills characters can learn" },
  { value: "concept", label: "Concept", icon: <BookOpen className="h-5 w-5" />, description: "Lore, history, or world mechanics" },
];

interface Props {
  onSuccess?: () => void;
}

export const LoreProposalForm = ({ onSuccess }: Props) => {
  const { user } = useAuth();
  const { createProposal } = useLoreProposals();
  const { conflicts, checkConflicts } = useLoreConflictChecker();
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState<ProposalCategory | "">("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<LoreProposalContent>({
    name: "",
    description: "",
    details: ""
  });
  
  const debouncedName = useDebounce(content.name, 500);
  
  useEffect(() => {
    if (debouncedName) {
      checkConflicts(debouncedName, category || undefined);
    }
  }, [debouncedName, category, checkConflicts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !title || !content.name || !content.description) return;

    setSubmitting(true);
    const result = await createProposal(title, category, content);
    setSubmitting(false);

    if (result) {
      setCategory("");
      setTitle("");
      setContent({ name: "", description: "", details: "" });
      onSuccess?.();
    }
  };

  if (!user) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Scroll className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sign in to Contribute</h3>
          <p className="text-muted-foreground">
            Join the community to propose new lore for the ThouArt universe.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Propose New Lore</CardTitle>
        </div>
        <CardDescription>
          Submit new races, locations, items, or concepts for Loremaster review
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <motion.button
                  key={cat.value}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCategory(cat.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    category === cat.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {cat.icon}
                    <span className="font-medium">{cat.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Proposal Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., The Shadowkin - A New Race"
              required
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {category === "race" ? "Race Name" : 
               category === "location" ? "Location Name" :
               category === "item" ? "Item Name" :
               category === "faction" ? "Faction Name" :
               category === "ability" ? "Ability Name" : "Name"} *
            </Label>
            <Input
              id="name"
              value={content.name}
              onChange={(e) => setContent({ ...content, name: e.target.value })}
              placeholder="Enter the name"
              required
            />
            {/* Universe Consistency Check */}
            <LoreConflictWarnings conflicts={conflicts} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Short Description *</Label>
            <Textarea
              id="description"
              value={content.description}
              onChange={(e) => setContent({ ...content, description: e.target.value })}
              placeholder="A brief overview (2-3 sentences)"
              rows={3}
              required
            />
          </div>

          {/* Category-specific fields */}
          {category === "race" && (
            <div className="space-y-2">
              <Label htmlFor="homeland">Homeland</Label>
              <Input
                id="homeland"
                value={content.homeland || ""}
                onChange={(e) => setContent({ ...content, homeland: e.target.value })}
                placeholder="Where do they originate from?"
              />
            </div>
          )}

          {category === "location" && (
            <div className="space-y-2">
              <Label htmlFor="location_type">Location Type</Label>
              <Select
                value={content.location_type || ""}
                onValueChange={(value) => setContent({ ...content, location_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="city">City</SelectItem>
                  <SelectItem value="village">Village</SelectItem>
                  <SelectItem value="dungeon">Dungeon</SelectItem>
                  <SelectItem value="forest">Forest</SelectItem>
                  <SelectItem value="mountain">Mountain</SelectItem>
                  <SelectItem value="ruins">Ruins</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {category === "item" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item_type">Item Type</Label>
                <Select
                  value={content.item_type || ""}
                  onValueChange={(value) => setContent({ ...content, item_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weapon">Weapon</SelectItem>
                    <SelectItem value="armor">Armor</SelectItem>
                    <SelectItem value="artifact">Artifact</SelectItem>
                    <SelectItem value="potion">Potion</SelectItem>
                    <SelectItem value="quest">Quest Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rarity">Rarity</Label>
                <Select
                  value={content.rarity || ""}
                  onValueChange={(value) => setContent({ ...content, rarity: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rarity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Common</SelectItem>
                    <SelectItem value="uncommon">Uncommon</SelectItem>
                    <SelectItem value="rare">Rare</SelectItem>
                    <SelectItem value="epic">Epic</SelectItem>
                    <SelectItem value="legendary">Legendary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {(category === "item" || category === "ability") && (
            <div className="space-y-2">
              <Label htmlFor="effect">Effect / Ability</Label>
              <Textarea
                id="effect"
                value={content.effect || ""}
                onChange={(e) => setContent({ ...content, effect: e.target.value })}
                placeholder="What does it do? What powers does it grant?"
                rows={2}
              />
            </div>
          )}

          {/* Detailed Lore */}
          <div className="space-y-2">
            <Label htmlFor="details">Detailed Lore</Label>
            <Textarea
              id="details"
              value={content.details || ""}
              onChange={(e) => setContent({ ...content, details: e.target.value })}
              placeholder="Full history, significance, and any additional details..."
              rows={6}
            />
          </div>

          {/* Image URL (optional) */}
          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL (optional)</Label>
            <Input
              id="image_url"
              type="url"
              value={content.image_url || ""}
              onChange={(e) => setContent({ ...content, image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={submitting || !category || !title || !content.name || !content.description}
          >
            {submitting ? "Submitting..." : "Submit for Review"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Submissions are reviewed by Loremasters for consistency with existing lore.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
