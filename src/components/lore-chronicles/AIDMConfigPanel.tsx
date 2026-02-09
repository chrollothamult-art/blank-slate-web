import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, Shield, Volume2, Plus, Trash2, Save, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAIConfig, AIGuardrails, NPCVoiceProfile } from "@/hooks/useAIConfig";
import { LoreContextSelector } from "./LoreContextSelector";

interface AIDMConfigPanelProps {
  campaignId: string;
}

const TONE_OPTIONS = [
  { value: "dark", label: "Dark & Foreboding", description: "Grim, tense, and atmospheric" },
  { value: "balanced", label: "Balanced", description: "Adapts to the scene context" },
  { value: "lighthearted", label: "Lighthearted", description: "Fun, adventurous, and upbeat" },
  { value: "epic", label: "Epic Fantasy", description: "Grand, heroic, and dramatic" },
  { value: "mysterious", label: "Mysterious", description: "Enigmatic and suspenseful" },
  { value: "political", label: "Political Intrigue", description: "Complex schemes and diplomacy" }
];

export const AIDMConfigPanel = ({ campaignId }: AIDMConfigPanelProps) => {
  const { config, loading, saving, createOrUpdateConfig, toggleAI } = useAIConfig(campaignId);
  
  const [localInstructions, setLocalInstructions] = useState("");
  const [localTone, setLocalTone] = useState("balanced");
  const [localGuardrails, setLocalGuardrails] = useState<AIGuardrails>({
    no_explicit_content: true,
    family_friendly: false,
    allow_violence: true,
    always_offer_peaceful_option: false
  });
  
  const [newNpcName, setNewNpcName] = useState("");
  const [newNpcStyle, setNewNpcStyle] = useState("");
  const [npcProfiles, setNpcProfiles] = useState<Record<string, NPCVoiceProfile>>({});
  const [loreContextIds, setLoreContextIds] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize local state from config
  if (config && !initialized) {
    setLocalInstructions(config.dm_instructions || "");
    setLocalTone(config.tone);
    setLocalGuardrails(config.guardrails);
    setNpcProfiles(config.npc_voice_profiles);
    setLoreContextIds(config.lore_context_ids || []);
    setInitialized(true);
  }

  const handleSave = async () => {
    await createOrUpdateConfig({
      dm_instructions: localInstructions,
      tone: localTone,
      guardrails: localGuardrails,
      npc_voice_profiles: npcProfiles,
      lore_context_ids: loreContextIds
    });
  };

  const addNpcProfile = () => {
    if (!newNpcName.trim()) return;
    
    const id = crypto.randomUUID();
    setNpcProfiles({
      ...npcProfiles,
      [id]: {
        name: newNpcName,
        style: newNpcStyle || "neutral",
        traits: []
      }
    });
    setNewNpcName("");
    setNewNpcStyle("");
  };

  const removeNpcProfile = (id: string) => {
    const updated = { ...npcProfiles };
    delete updated[id];
    setNpcProfiles(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-center">
          <Bot className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading AI configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Enable Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  AI Dungeon Master
                  <Badge variant="secondary" className="text-xs">Beta</Badge>
                </CardTitle>
                <CardDescription>
                  Let AI enhance your story with dynamic narration
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={config?.ai_enabled ?? false}
              onCheckedChange={(enabled) => toggleAI(enabled)}
            />
          </div>
        </CardHeader>
      </Card>

      {!config?.ai_enabled && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Enable AI Dungeon Master above to configure AI-powered narration for your campaign.
          </AlertDescription>
        </Alert>
      )}

      {config?.ai_enabled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* DM Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                DM Instructions
              </CardTitle>
              <CardDescription>
                Guide the AI's storytelling style, plot constraints, and narrative focus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={localInstructions}
                onChange={(e) => setLocalInstructions(e.target.value)}
                placeholder="Example: Keep the tone dark and foreboding. Never kill the player outright. Always offer a peaceful option. Emphasize the conflict between the Elder Council and the Shadow Guild. Kael is sarcastic but loyal."
                rows={6}
                className="resize-none"
              />
              <div className="text-sm text-muted-foreground">
                <strong>Tips:</strong> Describe the tone, constraints, lore focus, and NPC personalities.
              </div>
            </CardContent>
          </Card>

          {/* Tone Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Narrative Tone</CardTitle>
              <CardDescription>
                Set the overall mood for AI-generated narration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TONE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setLocalTone(option.value)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      localTone === option.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Guardrails */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Content Guardrails
              </CardTitle>
              <CardDescription>
                Set hard limits on what the AI can generate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">No Explicit Content</p>
                  <p className="text-sm text-muted-foreground">Block adult or mature themes</p>
                </div>
                <Switch
                  checked={localGuardrails.no_explicit_content}
                  onCheckedChange={(checked) =>
                    setLocalGuardrails({ ...localGuardrails, no_explicit_content: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Family Friendly</p>
                  <p className="text-sm text-muted-foreground">Keep content suitable for all ages</p>
                </div>
                <Switch
                  checked={localGuardrails.family_friendly}
                  onCheckedChange={(checked) =>
                    setLocalGuardrails({ ...localGuardrails, family_friendly: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Allow Violence</p>
                  <p className="text-sm text-muted-foreground">Combat and conflict descriptions</p>
                </div>
                <Switch
                  checked={localGuardrails.allow_violence}
                  onCheckedChange={(checked) =>
                    setLocalGuardrails({ ...localGuardrails, allow_violence: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Always Offer Peaceful Option</p>
                  <p className="text-sm text-muted-foreground">AI must include a non-violent choice</p>
                </div>
                <Switch
                  checked={localGuardrails.always_offer_peaceful_option}
                  onCheckedChange={(checked) =>
                    setLocalGuardrails({ ...localGuardrails, always_offer_peaceful_option: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* NPC Voice Profiles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                NPC Voice Profiles
              </CardTitle>
              <CardDescription>
                Define how specific NPCs speak and behave
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Profiles */}
              {Object.entries(npcProfiles).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(npcProfiles).map(([id, profile]) => (
                    <div
                      key={id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{profile.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{profile.style}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeNpcProfile(id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Profile */}
              <div className="flex gap-2">
                <Input
                  value={newNpcName}
                  onChange={(e) => setNewNpcName(e.target.value)}
                  placeholder="NPC Name"
                  className="flex-1"
                />
                <Select value={newNpcStyle} onValueChange={setNewNpcStyle}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="cryptic">Cryptic</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                    <SelectItem value="jovial">Jovial</SelectItem>
                    <SelectItem value="nervous">Nervous</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={addNpcProfile} disabled={!newNpcName.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lore Context Selector */}
          <LoreContextSelector
            selectedIds={loreContextIds}
            onSelectionChange={setLoreContextIds}
          />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save AI Configuration"}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
