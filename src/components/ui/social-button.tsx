"use client";

import { Link, Linkedin, Share2 } from "lucide-react";
import { FaTelegram, FaXTwitter } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SocialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shareUrl?: string;
  shareTitle?: string;
  shareDescription?: string;
}

export default function SocialButton({
  className,
  shareUrl,
  shareTitle = "Check this out!",
  shareDescription = "Discover amazing books at ThouArt",
  ...props
}: SocialButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const currentUrl = shareUrl || (typeof window !== "undefined" ? window.location.href : "");

  const shareButtons = [
    { 
      icon: FaXTwitter, 
      label: "X",
      color: "hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2]",
      action: () => {
        window.open(
          `https://x.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(currentUrl)}`,
          "_blank"
        );
      }
    },
    { 
      icon: FaTelegram, 
      label: "Telegram",
      color: "hover:bg-[#0088cc]/20 hover:text-[#0088cc]",
      action: () => {
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareTitle)}`,
          "_blank"
        );
      }
    },
    { 
      icon: Linkedin, 
      label: "LinkedIn",
      color: "hover:bg-[#0A66C2]/20 hover:text-[#0A66C2]",
      action: () => {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
          "_blank"
        );
      }
    },
    { 
      icon: Link, 
      label: "Copy link",
      color: "hover:bg-primary/20 hover:text-primary",
      action: async () => {
        try {
          await navigator.clipboard.writeText(currentUrl);
          toast({
            title: "Link copied!",
            description: "The link has been copied to your clipboard.",
          });
          setIsOpen(false);
        } catch (err) {
          toast({
            title: "Failed to copy",
            description: "Please copy the URL manually.",
            variant: "destructive",
          });
        }
      }
    },
  ];

  return (
    <div className={cn("relative", className)}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex items-center justify-center",
          "h-10 w-10 rounded-full",
          "bg-gradient-to-br from-primary/10 to-primary/5",
          "border border-primary/20",
          "text-primary",
          "shadow-sm hover:shadow-md",
          "transition-all duration-300",
          isOpen && "bg-primary/20 border-primary/40"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        aria-label="Share"
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          <Share2 className="h-4 w-4" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className={cn(
                "absolute right-0 top-full mt-2 z-50",
                "min-w-[160px] p-2",
                "bg-background/95 backdrop-blur-xl",
                "border border-border/50",
                "rounded-xl shadow-xl",
                "ring-1 ring-black/5"
              )}
            >
              <div className="space-y-1">
                {shareButtons.map((button, i) => (
                  <motion.button
                    key={button.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => {
                      button.action();
                      if (button.label !== "Copy link") setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5",
                      "rounded-lg text-sm font-medium",
                      "text-foreground/80",
                      "transition-all duration-200",
                      button.color
                    )}
                    type="button"
                  >
                    <button.icon className="h-4 w-4" />
                    <span>{button.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
