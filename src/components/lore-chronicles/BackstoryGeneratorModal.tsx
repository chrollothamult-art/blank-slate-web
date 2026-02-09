import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Edit3, Check, Loader2, Wand2, X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBackstoryGenerator } from "@/hooks/useBackstoryGenerator";

interface BackstoryGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (backstory: string) => void;
  raceId: string | null;
  raceName: string | null;
  stats: {
    strength: number;
    magic: number;
    charisma: number;
    wisdom: number;
    agility: number;
  };
  existingBackstory?: string;
}

type ModalPhase = "prompt" | "generating" | "preview" | "editing" | "inspire" | "inspire-loading";

export const BackstoryGeneratorModal = ({
  isOpen,
  onClose,
  onAccept,
  raceId,
  raceName,
  stats,
  existingBackstory,
}: BackstoryGeneratorModalProps) => {
  const { generateBackstory, generateInspiration, isGenerating, error, clearError } = useBackstoryGenerator();
  const [phase, setPhase] = useState<ModalPhase>("prompt");
  const [prompt, setPrompt] = useState("");
  const [generatedBackstory, setGeneratedBackstory] = useState("");
  const [editedBackstory, setEditedBackstory] = useState("");
  const [inspireHooks, setInspireHooks] = useState<string[]>([]);

  const inspirationPrompts = [
    "exiled warrior seeking redemption",
    "orphaned mage with a forbidden power",
    "disgraced noble turned mercenary",
    "wandering healer haunted by the past",
    "former thief who found faith",
  ];

  const baseParams = { raceId, raceName, stats, existingBackstory: existingBackstory || undefined };

  const handleGenerate = async (playerPrompt?: string) => {
    clearError();
    setPhase("generating");

    const result = await generateBackstory({
      ...baseParams,
      playerPrompt: playerPrompt || prompt.trim() || undefined,
    });

    if (result) {
      setGeneratedBackstory(result);
      setEditedBackstory(result);
      setPhase("preview");
    } else {
      setPhase("prompt");
    }
  };

  const handleInspireMe = async () => {
    clearError();
    setPhase("inspire-loading");

    const hooks = await generateInspiration(baseParams);

    if (hooks && hooks.length > 0) {
      setInspireHooks(hooks);
      setPhase("inspire");
    } else {
      setPhase("prompt");
    }
  };

  const handlePickHook = async (hook: string) => {
    setPrompt(hook);
    await handleGenerate(hook);
  };

  const handleRegenerate = async () => {
    await handleGenerate(prompt.trim() || undefined);
  };

  const handleEdit = () => {
    setEditedBackstory(generatedBackstory);
    setPhase("editing");
  };

  const handleAccept = () => {
    onAccept(phase === "editing" ? editedBackstory : generatedBackstory);
    resetAndClose();
  };

  const resetAndClose = () => {
    setPhase("prompt");
    setPrompt("");
    setGeneratedBackstory("");
    setEditedBackstory("");
    setInspireHooks([]);
    clearError();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            AI Backstory Generator
          </DialogTitle>
          <DialogDescription>
            Generate a lore-consistent backstory for your character
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Phase: Prompt Input */}
          {phase === "prompt" && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Any preferences? (optional)</Label>
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'a betrayed knight', 'raised by wolves'"
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Or try an inspiration:</Label>
                <div className="flex flex-wrap gap-2">
                  {inspirationPrompts.map((ip) => (
                    <Badge
                      key={ip}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => {
                        setPrompt(ip);
                        handleGenerate(ip);
                      }}
                    >
                      {ip}
                    </Badge>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2 justify-between">
                <Button variant="outline" onClick={handleInspireMe} className="gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Inspire Me
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
                  <Button onClick={() => handleGenerate()} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Phase: Inspire Loading */}
          {phase === "inspire-loading" && (
            <motion.div
              key="inspire-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <div className="relative mx-auto w-16 h-16 mb-4">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <Lightbulb className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-muted-foreground font-medium">Seeking inspiration from the realm...</p>
              <p className="text-xs text-muted-foreground mt-2">Generating 3 backstory hooks for you</p>
              {error && (
                <div className="mt-4">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setPhase("prompt")}>
                    Try Again
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Phase: Inspire Me — Pick a hook */}
          {phase === "inspire" && (
            <motion.div
              key="inspire"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Choose a backstory hook:</span>
              </div>

              <div className="space-y-3">
                {inspireHooks.map((hook, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card
                      className="cursor-pointer border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                      onClick={() => handlePickHook(hook)}
                    >
                      <CardContent className="p-3 flex items-start gap-3">
                        <span className="text-lg mt-0.5">
                          {idx === 0 ? "⚔️" : idx === 1 ? "🌙" : "🔮"}
                        </span>
                        <p className="text-sm leading-relaxed">{hook}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-2 justify-between">
                <Button variant="ghost" size="sm" onClick={() => setPhase("prompt")}>
                  ← Back
                </Button>
                <Button variant="outline" size="sm" onClick={handleInspireMe} disabled={isGenerating} className="gap-1">
                  <RefreshCw className={`h-3 w-3 ${isGenerating ? "animate-spin" : ""}`} />
                  New hooks
                </Button>
              </div>
            </motion.div>
          )}

          {/* Phase: Generating */}
          {phase === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <div className="relative mx-auto w-16 h-16 mb-4">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-muted-foreground font-medium">The Keeper weaves your tale...</p>
              <p className="text-xs text-muted-foreground mt-2">Crafting a backstory from the lore of the realm</p>
              {error && (
                <div className="mt-4">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setPhase("prompt")}>
                    Try Again
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Phase: Preview */}
          {phase === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Generated Backstory</span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{generatedBackstory}</p>
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={resetAndClose}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={isGenerating} className="gap-1">
                  <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} /> Regenerate
                </Button>
                <Button variant="outline" size="sm" onClick={handleEdit} className="gap-1">
                  <Edit3 className="h-4 w-4" /> Edit
                </Button>
                <Button size="sm" onClick={handleAccept} className="gap-1">
                  <Check className="h-4 w-4" /> Use This
                </Button>
              </div>
            </motion.div>
          )}

          {/* Phase: Editing */}
          {phase === "editing" && (
            <motion.div
              key="editing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Edit your backstory</Label>
                <Textarea
                  value={editedBackstory}
                  onChange={(e) => setEditedBackstory(e.target.value)}
                  rows={10}
                  maxLength={2000}
                  className="font-serif"
                />
                <p className="text-xs text-muted-foreground text-right">{editedBackstory.length}/2000</p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setPhase("preview")}>
                  Back to Preview
                </Button>
                <Button size="sm" onClick={handleAccept} className="gap-1" disabled={!editedBackstory.trim()}>
                  <Check className="h-4 w-4" /> Use Edited Version
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
