import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Sparkles, Check, GitBranch, MessageSquare, BookOpen, Flag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface EditorTourStep {
  targetSelector: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  icon?: React.ReactNode;
}

const editorTourSteps: EditorTourStep[] = [
  {
    targetSelector: '[value="nodes"]',
    title: "📍 Story Nodes Tab",
    description: "This is your main workspace. Every scene, choice, and encounter lives here as a 'node'. Think of nodes as pages in a choose-your-own-adventure book.",
    position: "bottom",
    icon: <GitBranch className="h-4 w-4" />,
  },
  {
    targetSelector: '[data-tour="add-nodes"]',
    title: "➕ Adding Nodes",
    description: "Use these buttons to add different node types: Narrative (story text), Choice (branching paths), Stat Check (skill tests), and Ending (conclusions). Start with a Narrative node!",
    position: "bottom",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    targetSelector: '[data-tour="node-card"]',
    title: "📝 Editing a Node",
    description: "Click any node card to open the editor. Here you can write story text, add images, set XP rewards, and configure choices that link to other nodes.",
    position: "bottom",
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    targetSelector: '[value="key-points"]',
    title: "🏁 Key Points",
    description: "Key Points are major story milestones. They anchor your narrative arc — the journey between them is where player freedom lives. Set them after your nodes are in place.",
    position: "bottom",
    icon: <Flag className="h-4 w-4" />,
  },
  {
    targetSelector: '[value="triggers"]',
    title: "⚡ Event Triggers",
    description: "Triggers fire events when conditions are met — like a stat reaching a threshold or possessing an item. They make your world feel dynamic and reactive.",
    position: "bottom",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    targetSelector: '[value="random-events"]',
    title: "🎲 Random Events",
    description: "Add surprise encounters, weather changes, or ambushes that fire with a % probability. Great for replayability — but use sparingly (2-3 per section).",
    position: "bottom",
  },
  {
    targetSelector: '[value="hints"]',
    title: "💡 Hints System",
    description: "Design hints that help players when they're stuck. You can gate hints behind attempt counts or time delays so players try on their own first.",
    position: "bottom",
  },
  {
    targetSelector: '[value="ai-dm"]',
    title: "🤖 AI Dungeon Master",
    description: "Configure AI narration for smoother transitions between nodes. Write DM instructions to set tone, inject lore context, and enable free-text player input on select nodes.",
    position: "bottom",
  },
  {
    targetSelector: '[data-tour="publish-btn"]',
    title: "🚀 Publish When Ready!",
    description: "Your campaign stays as a draft until you publish. Test it yourself first — play through at least twice. Once published, players can discover and play your adventure!",
    position: "bottom",
  },
];

interface CampaignEditorTourProps {
  active: boolean;
  onClose: () => void;
}

const CampaignEditorTour = ({ active, onClose }: CampaignEditorTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const step = editorTourSteps[currentStep];
  const progress = ((currentStep + 1) / editorTourSteps.length) * 100;

  const updateHighlight = useCallback(() => {
    if (!active) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setHighlightRect(null);
    }
  }, [active, step.targetSelector]);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(updateHighlight, 300);
    window.addEventListener("resize", updateHighlight);
    window.addEventListener("scroll", updateHighlight, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateHighlight);
      window.removeEventListener("scroll", updateHighlight, true);
    };
  }, [active, currentStep, updateHighlight]);

  const handleNext = () => {
    if (currentStep < editorTourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  if (!active) return null;

  const padding = 8;
  const tooltipWidth = 360;

  const getTooltipPosition = () => {
    if (!highlightRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const pos = step.position || "bottom";
    switch (pos) {
      case "bottom":
        return {
          top: `${highlightRect.bottom + padding + 12}px`,
          left: `${Math.max(16, Math.min(highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 16))}px`,
        };
      case "top":
        return {
          top: `${highlightRect.top - padding - 12}px`,
          left: `${Math.max(16, Math.min(highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 16))}px`,
          transform: "translateY(-100%)",
        };
      default:
        return {
          top: `${highlightRect.bottom + padding + 12}px`,
          left: `${Math.max(16, highlightRect.left)}px`,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="editor-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {highlightRect && (
              <rect
                x={highlightRect.left - padding}
                y={highlightRect.top - padding}
                width={highlightRect.width + padding * 2}
                height={highlightRect.height + padding * 2}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#editor-tour-mask)" />
      </svg>

      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {highlightRect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute border-2 border-accent rounded-lg pointer-events-none"
          style={{
            top: highlightRect.top - padding,
            left: highlightRect.left - padding,
            width: highlightRect.width + padding * 2,
            height: highlightRect.height + padding * 2,
            boxShadow: "0 0 20px hsl(var(--accent) / 0.4), inset 0 0 20px hsl(var(--accent) / 0.1)",
          }}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="absolute z-[101] bg-background border border-border/80 rounded-xl shadow-2xl p-5"
          style={{ width: tooltipWidth, ...getTooltipPosition() }}
        >
          <div className="flex items-center justify-between mb-3">
            <Badge variant="outline" className="text-xs text-accent border-accent/30">
              Editor Tour {currentStep + 1}/{editorTourSteps.length}
            </Badge>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <Progress value={progress} className="h-1 mb-4" />

          <h3 className="font-semibold text-base mb-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {step.description}
          </p>

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handlePrev} disabled={currentStep === 0} className="gap-1">
              <ArrowLeft className="h-3 w-3" /> Back
            </Button>
            <Button size="sm" onClick={handleNext} className="rpg-btn-primary text-primary-foreground border-0 gap-1">
              {currentStep === editorTourSteps.length - 1 ? (
                <><Check className="h-3 w-3" /> Finish Tour</>
              ) : (
                <>Next <ArrowRight className="h-3 w-3" /></>
              )}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CampaignEditorTour;
