import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
  action?: "fill" | "select" | "click" | "info";
  autoFillValue?: string;
  autoFillField?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    targetSelector: '#title',
    title: "1. Name Your Campaign",
    description: "Start with a compelling title. This is the first thing players see — make it mysterious and intriguing!",
    action: "fill",
    autoFillValue: "The Lost Relic of Eternity",
    autoFillField: "title",
    position: "bottom",
  },
  {
    targetSelector: '#description',
    title: "2. Write a Description",
    description: "Hook players with a short summary. Don't spoil the ending — leave them wanting more!",
    action: "fill",
    autoFillValue: "Deep within the Ashen Wastes, a relic of unimaginable power stirs. Ancient prophecies speak of a chosen one who will either save the realm or plunge it into eternal darkness. Your choices will shape the fate of the world.",
    autoFillField: "description",
    position: "bottom",
  },
  {
    targetSelector: '[data-tour="universe-mode"]',
    title: "3. Choose Your Universe",
    description: "ThouArt mode gives you pre-built lore, races, and magic. Original mode lets you create everything from scratch. For your first campaign, ThouArt is recommended!",
    action: "info",
    position: "bottom",
  },
  {
    targetSelector: '[data-tour="genre-select"]',
    title: "4. Pick a Genre",
    description: "The genre sets the tone for your entire campaign. Adventure is great for beginners — it's flexible and exciting!",
    action: "info",
    position: "bottom",
  },
  {
    targetSelector: '[data-tour="difficulty-select"]',
    title: "5. Set the Difficulty",
    description: "Difficulty affects stat check thresholds and consequences. Start with Normal — you can always adjust later.",
    action: "info",
    position: "bottom",
  },
  {
    targetSelector: '[data-tour="permadeath"]',
    title: "6. Permadeath (Optional)",
    description: "When enabled, characters are permanently deleted on death. This is hardcore mode — leave it off for now!",
    action: "info",
    position: "top",
  },
  {
    targetSelector: '#cover',
    title: "7. Add a Cover Image (Optional)",
    description: "A great cover image makes your campaign stand out in the browser. You can add this later too.",
    action: "info",
    position: "top",
  },
  {
    targetSelector: '[data-tour="create-btn"]',
    title: "8. Create & Start Building!",
    description: "Once you're happy with the basics, hit this button to create your campaign and start adding story nodes, choices, and encounters!",
    action: "info",
    position: "top",
  },
];

interface CampaignCreatorTourProps {
  active: boolean;
  onClose: () => void;
  onFillField: (field: string, value: string) => void;
}

const CampaignCreatorTour = ({ active, onClose, onFillField }: CampaignCreatorTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const updateHighlight = useCallback(() => {
    if (!active) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
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
    // Auto-fill if this step has an action
    if (step.action === "fill" && step.autoFillField && step.autoFillValue) {
      onFillField(step.autoFillField, step.autoFillValue);
    }
    if (currentStep < tourSteps.length - 1) {
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
      case "right":
        return {
          top: `${highlightRect.top + highlightRect.height / 2}px`,
          left: `${highlightRect.right + padding + 12}px`,
          transform: "translateY(-50%)",
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
      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="tour-mask">
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
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.7)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Click blocker (except on highlighted area) */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Highlight border glow */}
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

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="absolute z-[101] bg-background border border-border/80 rounded-xl shadow-2xl p-5"
          style={{
            width: tooltipWidth,
            ...getTooltipPosition(),
          }}
        >
          {/* Progress */}
          <div className="flex items-center justify-between mb-3">
            <Badge variant="outline" className="text-xs text-accent border-accent/30">
              Step {currentStep + 1}/{tourSteps.length}
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

          {step.action === "fill" && (
            <div className="text-xs bg-accent/10 text-accent p-2 rounded-lg mb-4 flex items-center gap-2">
              <Sparkles className="h-3 w-3 flex-shrink-0" />
              <span>Click "Next" to auto-fill this field with an example!</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              className="rpg-btn-primary text-primary-foreground border-0 gap-1"
            >
              {currentStep === tourSteps.length - 1 ? (
                <>
                  <Check className="h-3 w-3" />
                  Finish Tour
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-3 w-3" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CampaignCreatorTour;
