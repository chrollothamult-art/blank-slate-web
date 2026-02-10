import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";

const shortcuts = [
  { keys: ["1", "2", "3", "4"], description: "Select choice" },
  { keys: ["Space"], description: "Continue (narrative nodes)" },
  { keys: ["Esc"], description: "Back to Lore Chronicles" },
  { keys: ["?"], description: "Toggle this overlay" },
];

export const ShortcutOverlay = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible((v) => !v);
    window.addEventListener("toggle-shortcut-overlay", handler);
    return () => window.removeEventListener("toggle-shortcut-overlay", handler);
  }, []);

  return (
    <>
      {/* Floating ? button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-6 right-6 z-40 h-10 w-10 rounded-full bg-muted/80 backdrop-blur"
        onClick={() => setVisible((v) => !v)}
      >
        <Keyboard className="h-4 w-4" />
      </Button>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-6 z-50 bg-background border border-border rounded-xl shadow-lg p-4 w-64"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-primary" />
                Keyboard Shortcuts
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setVisible(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2">
              {shortcuts.map((s) => (
                <div key={s.description} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.description}</span>
                  <div className="flex gap-1">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
