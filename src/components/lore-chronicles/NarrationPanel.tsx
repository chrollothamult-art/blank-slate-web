import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Volume2, VolumeX, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface NarrationPanelProps {
  narrationText: string;
  npcName?: string;
  npcPortrait?: string;
  isNpcDialogue?: boolean;
  onComplete?: () => void;
  speed?: "slow" | "normal" | "fast";
  className?: string;
}

export const NarrationPanel = ({
  narrationText,
  npcName,
  npcPortrait,
  isNpcDialogue = false,
  onComplete,
  speed = "normal",
  className
}: NarrationPanelProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);

  const speedMs = {
    slow: 50,
    normal: 30,
    fast: 15
  };

  useEffect(() => {
    // Reset state when narration text changes
    setDisplayedText("");
    setIsComplete(false);
    setIsSkipped(false);
    indexRef.current = 0;

    if (!narrationText) return;

    const typeCharacter = () => {
      if (indexRef.current < narrationText.length) {
        setDisplayedText(narrationText.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setIsComplete(true);
        onComplete?.();
      }
    };

    intervalRef.current = setInterval(typeCharacter, speedMs[speed]);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [narrationText, speed, onComplete]);

  const handleSkip = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setDisplayedText(narrationText);
    setIsComplete(true);
    setIsSkipped(true);
    onComplete?.();
  };

  if (!narrationText) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "relative rounded-xl overflow-hidden",
        isNpcDialogue
          ? "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20"
          : "bg-gradient-to-br from-muted/50 via-background to-muted/30 border border-border",
        className
      )}
    >
      {/* Atmospheric overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MiIgaGVpZ2h0PSIyNiI+CjxyZWN0IGZpbGw9IiNmZmYiIHdpZHRoPSI1MiIgaGVpZ2h0PSIyNiIvPgo8cmVjdCBmaWxsPSIjZjVmNWY1IiB3aWR0aD0iMTMiIGhlaWdodD0iMTMiLz4KPHJlY3QgZmlsbD0iI2Y1ZjVmNSIgeD0iMTMiIHk9IjEzIiB3aWR0aD0iMTMiIGhlaWdodD0iMTMiLz4KPHJlY3QgZmlsbD0iI2Y1ZjVmNSIgeD0iMjYiIHdpZHRoPSIxMyIgaGVpZ2h0PSIxMyIvPgo8cmVjdCBmaWxsPSIjZjVmNWY1IiB4PSIzOSIgeT0iMTMiIHdpZHRoPSIxMyIgaGVpZ2h0PSIxMyIvPgo8L3N2Zz4=')] opacity-[0.02]" />

      <div className="relative p-6">
        {/* NPC Header */}
        {isNpcDialogue && npcName && (
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-12 w-12 ring-2 ring-primary/30">
              <AvatarImage src={npcPortrait} alt={npcName} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                {npcName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{npcName}</p>
              <p className="text-sm text-muted-foreground">speaks...</p>
            </div>
          </div>
        )}

        {/* Narrator Header */}
        {!isNpcDialogue && (
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Narrator</span>
          </div>
        )}

        {/* Narration Text */}
        <div className={cn(
          "text-lg leading-relaxed min-h-[100px]",
          isNpcDialogue ? "italic text-foreground/90" : "text-foreground"
        )}>
          {displayedText}
          {!isComplete && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.7 }}
              className="inline-block w-0.5 h-5 bg-primary ml-0.5 align-middle"
            />
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isComplete ? (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/80" />
                Complete
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-2 h-2 rounded-full bg-primary"
                />
                Narrating...
              </span>
            )}
          </div>

          {!isComplete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Skip
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// NPC Dialogue Bubble variant
export const NPCDialogueBubble = ({
  npcName,
  npcPortrait,
  dialogue,
  onComplete,
  className
}: {
  npcName: string;
  npcPortrait?: string;
  dialogue: string;
  onComplete?: () => void;
  className?: string;
}) => {
  return (
    <NarrationPanel
      narrationText={dialogue}
      npcName={npcName}
      npcPortrait={npcPortrait}
      isNpcDialogue={true}
      onComplete={onComplete}
      className={className}
    />
  );
};
