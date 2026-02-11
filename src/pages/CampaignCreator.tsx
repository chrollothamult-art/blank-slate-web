import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Save, Sparkles, User, Globe, Scroll, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useLoreChronicles } from "@/hooks/useLoreChronicles";
import { supabase } from "@/integrations/supabase/client";

const genres = [
  { value: "adventure", label: "Adventure", description: "Epic quests and exploration" },
  { value: "mystery", label: "Mystery", description: "Clues, puzzles, and investigation" },
  { value: "horror", label: "Horror", description: "Dark tales and survival" },
  { value: "romance", label: "Romance", description: "Love stories and relationships" },
  { value: "fantasy", label: "Fantasy", description: "Magic and mythical worlds" },
  { value: "political", label: "Political", description: "Intrigue and power plays" }
];

const difficulties = [
  { value: "easy", label: "Easy", description: "Relaxed gameplay, forgiving choices" },
  { value: "normal", label: "Normal", description: "Balanced challenge" },
  { value: "hard", label: "Hard", description: "Demanding stat requirements" },
  { value: "nightmare", label: "Nightmare", description: "Punishing difficulty, permadeath possible" }
];

const universeOptions = [
  { 
    value: "thouart", 
    label: "ThouArt Universe",
    icon: Scroll,
    description: "Use official races, magic, relics, and lore from the Witness Almanac"
  },
  { 
    value: "original", 
    label: "Original Universe",
    icon: Globe,
    description: "Create your own world with custom races, magic systems, and rules"
  }
];

const CampaignCreator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createCampaign } = useLoreChronicles();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [universeMode, setUniverseMode] = useState<"thouart" | "original">("thouart");
  const [worldName, setWorldName] = useState("");
  const [worldRules, setWorldRules] = useState("");
  const [permadeath, setPermadeath] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !genre || !difficulty) return;
    
    setCreating(true);
    const result = await createCampaign({
      title: title.trim(),
      description: description.trim() || null,
      genre,
      difficulty,
      cover_image_url: coverUrl.trim() || null,
      permadeath
    });

    if (result && universeMode === "original") {
      await (supabase as any).from("rp_campaign_universe").insert([{
        campaign_id: result.id,
        mode: "original",
        world_name: worldName.trim() || null,
        rules_document: worldRules.trim() || null,
      }]);
    }

    setCreating(false);
    if (result) {
      navigate(`/lore-chronicles/edit-campaign/${result.id}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen rpg-page flex items-center justify-center p-4">
        <div className="rpg-card rounded-lg max-w-md w-full text-center p-8">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">You need to sign in to create a campaign</p>
          <Button onClick={() => navigate('/auth')} className="rpg-btn-primary text-primary-foreground border-0">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const isValid = title.trim() && genre && difficulty;

  return (
    <div className="min-h-screen rpg-page py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/lore-chronicles')} className="hover:bg-accent/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-accent to-amber-300 bg-clip-text text-transparent">
              Create Campaign
            </h1>
            <p className="text-muted-foreground">Design your branching adventure</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="rpg-card rounded-lg">
            <div className="p-6 pb-4 border-b border-border/50">
              <h3 className="flex items-center gap-2 font-semibold">
                <BookOpen className="h-5 w-5 text-accent" />
                Campaign Details
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Set up the basic information for your campaign
              </p>
            </div>
            <div className="p-6 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Campaign Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The Lost Relic of Eternity"
                  maxLength={100}
                  className="bg-muted/30 border-border/50 focus:border-accent/50"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A gripping tale of adventure and discovery..."
                  rows={4}
                  maxLength={1000}
                  className="bg-muted/30 border-border/50 focus:border-accent/50"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {description.length}/1000
                </p>
              </div>

              {/* Universe Mode */}
              <div className="space-y-4">
                <Label>Universe Mode *</Label>
                <RadioGroup 
                  value={universeMode} 
                  onValueChange={(v) => setUniverseMode(v as "thouart" | "original")}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {universeOptions.map(option => (
                    <div key={option.value}>
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={option.value}
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-border/50 bg-muted/20 p-4 hover:bg-accent/10 hover:border-accent/30 peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/10 [&:has([data-state=checked])]:border-accent cursor-pointer transition-all"
                      >
                        <option.icon className="mb-3 h-6 w-6 text-accent" />
                        <div className="text-center">
                          <p className="font-semibold">{option.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Original Universe Settings */}
              {universeMode === "original" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 p-4 border border-accent/20 rounded-lg bg-accent/5"
                >
                  <div className="space-y-2">
                    <Label htmlFor="worldName">World Name</Label>
                    <Input
                      id="worldName"
                      value={worldName}
                      onChange={(e) => setWorldName(e.target.value)}
                      placeholder="The Realm of Shadows"
                      maxLength={100}
                      className="bg-muted/30 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="worldRules">World Rules & Lore (optional)</Label>
                    <Textarea
                      id="worldRules"
                      value={worldRules}
                      onChange={(e) => setWorldRules(e.target.value)}
                      placeholder="Describe the rules, magic systems, factions, and lore of your custom world..."
                      rows={4}
                      maxLength={2000}
                      className="bg-muted/30 border-border/50"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {worldRules.length}/2000
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 You can define custom races, magic systems, and factions after creating the campaign.
                  </p>
                </motion.div>
              )}

              {/* Genre */}
              <div className="space-y-2">
                <Label>Genre *</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="bg-muted/30 border-border/50">
                    <SelectValue placeholder="Select a genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map(g => (
                      <SelectItem key={g.value} value={g.value}>
                        <div className="flex flex-col">
                          <span>{g.label}</span>
                          <span className="text-xs text-muted-foreground">{g.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label>Difficulty *</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="bg-muted/30 border-border/50">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map(d => (
                      <SelectItem key={d.value} value={d.value}>
                        <div className="flex flex-col">
                          <span>{d.label}</span>
                          <span className="text-xs text-muted-foreground">{d.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Permadeath Mode */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                <div className="flex items-center gap-3">
                  <Skull className="h-5 w-5 text-destructive" />
                  <div>
                    <Label className="font-medium">Permadeath Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Characters are permanently deleted on death — hardcore mode
                    </p>
                  </div>
                </div>
                <Switch
                  checked={permadeath}
                  onCheckedChange={setPermadeath}
                />
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <Label htmlFor="cover">Cover Image URL (optional)</Label>
                <Input
                  id="cover"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                  className="bg-muted/30 border-border/50"
                />
                {coverUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden h-40 bg-muted/30 border border-border/50">
                    <img 
                      src={coverUrl} 
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/lore-chronicles')}
                  className="border-border/50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={!isValid || creating}
                  className="rpg-btn-primary text-primary-foreground border-0"
                >
                  {creating ? (
                    "Creating..."
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create & Edit Nodes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CampaignCreator;
