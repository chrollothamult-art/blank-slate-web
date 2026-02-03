import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export const NavigationProgress = () => {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start progress on route change
    setIsNavigating(true);
    setProgress(0);

    // Animate progress
    const timer1 = setTimeout(() => setProgress(30), 50);
    const timer2 = setTimeout(() => setProgress(60), 150);
    const timer3 = setTimeout(() => setProgress(80), 300);
    const timer4 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setIsNavigating(false), 200);
    }, 400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-primary to-primary/50 shadow-lg shadow-primary/30"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ 
              duration: 0.3, 
              ease: "easeOut" 
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
