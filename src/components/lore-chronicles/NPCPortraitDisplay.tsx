import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface NPCPortraitProps {
  name: string;
  portraitUrl?: string;
  expression?: "neutral" | "happy" | "angry" | "sad";
  position?: "left" | "right" | "center";
  size?: "sm" | "md" | "lg";
  speaking?: boolean;
  className?: string;
}

const expressionEmoji: Record<string, string> = {
  neutral: "",
  happy: "😊",
  angry: "😠",
  sad: "😢",
};

export const NPCPortraitDisplay = ({
  name,
  portraitUrl,
  expression = "neutral",
  position = "left",
  size = "md",
  speaking = false,
  className,
}: NPCPortraitProps) => {
  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  const positionClasses = {
    left: "mr-auto",
    right: "ml-auto",
    center: "mx-auto",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn("flex flex-col items-center gap-2", positionClasses[position], className)}
    >
      <div className="relative">
        {/* Idle breathing animation */}
        <motion.div
          animate={{
            scale: [1, 1.03, 1],
            y: [0, -2, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Avatar className={cn(
            sizeClasses[size],
            "ring-2 transition-all duration-300",
            speaking
              ? "ring-primary ring-offset-2 ring-offset-background"
              : "ring-border"
          )}>
            <AvatarImage src={portraitUrl} alt={name} className="object-cover" />
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        {/* Speaking indicator with pulse */}
        {speaking && (
          <>
            <motion.div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <span className="text-[10px]">💬</span>
            </motion.div>
            {/* Glow ring when speaking */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/50"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}

        {/* Expression badge */}
        {expression !== "neutral" && expressionEmoji[expression] && (
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {expressionEmoji[expression]}
          </motion.div>
        )}
      </div>

      <span className="text-sm font-medium text-center">{name}</span>
    </motion.div>
  );
};

interface NPCPortraitBarProps {
  npcs: {
    name: string;
    portraitUrl?: string;
    expression?: "neutral" | "happy" | "angry" | "sad";
    speaking?: boolean;
  }[];
  position?: "left" | "right" | "center";
  className?: string;
}

export const NPCPortraitBar = ({ npcs, position = "left", className }: NPCPortraitBarProps) => {
  if (npcs.length === 0) return null;

  const positionClasses = {
    left: "justify-start",
    right: "justify-end",
    center: "justify-center",
  };

  return (
    <div className={cn("flex items-end gap-4", positionClasses[position], className)}>
      <AnimatePresence>
        {npcs.map((npc) => (
          <NPCPortraitDisplay
            key={npc.name}
            name={npc.name}
            portraitUrl={npc.portraitUrl}
            expression={npc.expression}
            speaking={npc.speaking}
            size="md"
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
