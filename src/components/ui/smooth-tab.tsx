"use client";

import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  title: string;
  icon?: LucideIcon;
  content?: React.ReactNode;
  cardContent?: React.ReactNode;
  color?: string;
}

interface SmoothTabProps {
  items: TabItem[];
  defaultTabId?: string;
  className?: string;
  activeColor?: string;
  onChange?: (tabId: string) => void;
  showCardContent?: boolean;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    filter: "blur(8px)",
    scale: 0.95,
    position: "absolute" as const,
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    position: "absolute" as const,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    filter: "blur(8px)",
    scale: 0.95,
    position: "absolute" as const,
  }),
};

const transition = {
  duration: 0.4,
  ease: [0.32, 0.72, 0, 1] as const,
};

export default function SmoothTab({
  items,
  defaultTabId,
  className,
  activeColor = "bg-primary",
  onChange,
  showCardContent = false,
}: SmoothTabProps) {
  const [selected, setSelected] = React.useState(defaultTabId || items[0]?.id);
  const [direction, setDirection] = React.useState(0);
  const [dimensions, setDimensions] = React.useState({ width: 0, left: 0 });

  const buttonRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const updateDimensions = () => {
      const selectedButton = buttonRefs.current.get(selected);
      const container = containerRef.current;

      if (selectedButton && container) {
        const rect = selectedButton.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        setDimensions({
          width: rect.width,
          left: rect.left - containerRect.left,
        });
      }
    };

    requestAnimationFrame(() => {
      updateDimensions();
    });

    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [selected]);

  const handleTabClick = (tabId: string) => {
    const currentIndex = items.findIndex((item) => item.id === selected);
    const newIndex = items.findIndex((item) => item.id === tabId);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setSelected(tabId);
    onChange?.(tabId);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    tabId: string
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTabClick(tabId);
    }
  };

  const selectedItem = items.find((item) => item.id === selected);

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Card Content Area - optional */}
      {showCardContent && selectedItem?.cardContent && (
        <div className="relative mb-4 overflow-hidden rounded-xl border bg-card">
          <div className="relative w-full min-h-[200px]">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={selected}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full"
              >
                {selectedItem.cardContent}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Bottom Toolbar */}
      <div className="relative flex items-center justify-center">
        {/* Sliding Background */}
        <motion.div
          className={cn(
            "absolute h-full rounded-lg",
            activeColor
          )}
          initial={false}
          animate={{
            width: dimensions.width,
            x: dimensions.left,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
        />

        <div
          ref={containerRef}
          className="relative z-10 flex items-center gap-1 rounded-lg border bg-muted/50 p-1"
          role="tablist"
        >
          {items.map((item) => {
            const isSelected = selected === item.id;
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                className={cn(
                  "relative flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  isSelected
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => handleTabClick(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                ref={(el) => {
                  if (el) buttonRefs.current.set(item.id, el);
                  else buttonRefs.current.delete(item.id);
                }}
                role="tab"
                tabIndex={isSelected ? 0 : -1}
                type="button"
                aria-selected={isSelected}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.title}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
