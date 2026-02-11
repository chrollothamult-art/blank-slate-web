import { motion } from "framer-motion";
import { Trophy, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TutorialCompletionBadgeProps {
  show: boolean;
  onDismiss: () => void;
  onStartCreating: () => void;
}

const TutorialCompletionBadge = ({ show, onDismiss, onStartCreating }: TutorialCompletionBadgeProps) => {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.6, bounce: 0.4 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-background border border-accent/30 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center"
        initial={{ rotateY: -90 }}
        animate={{ rotateY: 0 }}
        transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
      >
        {/* Animated trophy */}
        <motion.div
          animate={{ 
            y: [0, -8, 0],
            rotate: [0, -5, 5, 0],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/15 mb-6"
        >
          <Trophy className="h-10 w-10 text-accent" />
        </motion.div>

        {/* Sparkle particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-accent"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [0, (Math.random() - 0.5) * 120],
              y: [0, (Math.random() - 0.5) * 120],
            }}
            transition={{ duration: 1.5, delay: 0.3 + i * 0.15, repeat: Infinity, repeatDelay: 2 }}
            style={{ top: "30%", left: "50%" }}
          >
            <Sparkles className="h-4 w-4" />
          </motion.div>
        ))}

        <Badge className="bg-accent/20 text-accent border-accent/30 mb-3 text-sm px-3 py-1">
          Achievement Unlocked!
        </Badge>

        <h2 className="text-2xl font-bold mb-2">Campaign Scholar</h2>
        <p className="text-muted-foreground text-sm mb-6">
          You've completed all 9 tutorial steps and mastered the fundamentals of campaign creation. You're ready to build your first adventure!
        </p>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onDismiss} className="border-border/50">
            Close
          </Button>
          <Button onClick={onStartCreating} className="rpg-btn-primary text-primary-foreground border-0 gap-2">
            <Sparkles className="h-4 w-4" />
            Create Campaign
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          🏅 This badge is saved to your profile
        </p>
      </motion.div>
    </motion.div>
  );
};

export default TutorialCompletionBadge;
