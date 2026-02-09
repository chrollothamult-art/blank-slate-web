import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AITransitionScreenProps {
  narration: string;
  onComplete: () => void;
  isVisible: boolean;
  backgroundImage?: string;
}

export const AITransitionScreen = ({
  narration,
  onComplete,
  isVisible,
  backgroundImage,
}: AITransitionScreenProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isVisible || !narration) return;

    setDisplayedText("");
    setIsTyping(true);
    let index = 0;

    intervalRef.current = setInterval(() => {
      if (index < narration.length) {
        setDisplayedText(narration.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 30);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [narration, isVisible]);

  const handleSkip = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayedText(narration);
    setIsTyping(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-background">
            {backgroundImage && (
              <img
                src={backgroundImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />
            
            {/* Ambient particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-primary/30"
                  initial={{
                    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                    y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 10,
                    opacity: 0,
                  }}
                  animate={{
                    y: -20,
                    opacity: [0, 0.6, 0],
                  }}
                  transition={{
                    duration: 4 + Math.random() * 4,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                    ease: "linear",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-2xl mx-auto px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mb-6"
            >
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="relative"
            >
              <p className="text-lg md:text-xl leading-relaxed text-foreground/90 font-serif italic whitespace-pre-wrap">
                {displayedText}
                {isTyping && (
                  <span className="inline-block w-0.5 h-5 bg-primary/70 ml-1 animate-pulse" />
                )}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isTyping ? 0.7 : 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-10 flex items-center justify-center gap-3"
            >
              {isTyping ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground gap-2"
                >
                  <SkipForward className="h-4 w-4" />
                  Skip
                </Button>
              ) : (
                <Button
                  onClick={onComplete}
                  className="gap-2"
                >
                  Continue
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </Button>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
