import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sword, BookOpen, Users, Scroll, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string;
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to Lore Chronicles!",
    description: "Forge your destiny in the ThouArt universe. Let's take a quick tour of what you can do here.",
    icon: <Sparkles className="h-8 w-8 text-primary" />,
  },
  {
    title: "Create a Character",
    description: "Start by creating your hero. Choose a race, allocate stats, write a backstory, and upload a portrait.",
    icon: <Sword className="h-8 w-8 text-primary" />,
  },
  {
    title: "Browse Campaigns",
    description: "Discover branching adventures created by the community. Filter by genre and difficulty to find your perfect quest.",
    icon: <BookOpen className="h-8 w-8 text-primary" />,
  },
  {
    title: "Join Sessions",
    description: "Play solo or team up with others in group sessions. Your choices shape the story and affect your character's stats.",
    icon: <Users className="h-8 w-8 text-primary" />,
  },
  {
    title: "Expand the Lore",
    description: "Propose new races, locations, and items to the universe. Loremasters review submissions for consistency.",
    icon: <Scroll className="h-8 w-8 text-primary" />,
  },
];

const TOUR_STORAGE_KEY = "lore-chronicles-tour-completed";

export const OnboardingTour = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  };

  const next = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  if (!user || !isVisible) return null;

  const step = tourSteps[currentStep];
  const isLast = currentStep === tourSteps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && dismiss()}
      >
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative bg-background border border-border rounded-2xl shadow-2xl max-w-md w-full p-8"
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8"
            onClick={dismiss}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Step indicator */}
          <div className="flex justify-center gap-1.5 mb-6">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "w-8 bg-primary"
                    : i < currentStep
                    ? "w-3 bg-primary/40"
                    : "w-3 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              {step.icon}
            </div>
            <h3 className="text-xl font-bold">{step.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{step.description}</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={prev}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            <span className="text-xs text-muted-foreground">
              {currentStep + 1} / {tourSteps.length}
            </span>

            <Button size="sm" onClick={next} className="gap-1">
              {isLast ? "Get Started" : "Next"}
              {!isLast && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          {/* Skip link */}
          {!isLast && (
            <button
              onClick={dismiss}
              className="block mx-auto mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip tour
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
