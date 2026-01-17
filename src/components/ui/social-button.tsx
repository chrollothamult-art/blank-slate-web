"use client";

import { Instagram, Link, Linkedin, Twitter } from "lucide-react";
import { FaTelegram } from "react-icons/fa";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  const currentUrl = shareUrl || (typeof window !== "undefined" ? window.location.href : "");

  const shareButtons = [
    { 
      icon: Twitter, 
      label: "Share on Twitter",
      action: () => {
        window.open(
          `https://x.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(currentUrl)}`,
          "_blank"
        );
      }
    },
    { 
      icon: FaTelegram, 
      label: "Share on Telegram",
      action: () => {
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareTitle)}`,
          "_blank"
        );
      }
    },
    { 
      icon: Linkedin, 
      label: "Share on LinkedIn",
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
      action: async () => {
        try {
          await navigator.clipboard.writeText(currentUrl);
          toast({
            title: "Link copied!",
            description: "The link has been copied to your clipboard.",
          });
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

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleShare = (index: number) => {
    setActiveIndex(index);
    shareButtons[index].action();
    setTimeout(() => setActiveIndex(null), 300);
  };

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <motion.div
        className="flex items-center gap-1"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <motion.div
          animate={{
            width: isVisible ? "auto" : 0,
            opacity: isVisible ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-1 pr-2">
            {shareButtons.map((button, i) => (
              <motion.button
                key={button.label}
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full",
                  "bg-primary/10 hover:bg-primary/20 transition-colors",
                  activeIndex === i && "bg-primary/30"
                )}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: isVisible ? 1 : 0,
                  opacity: isVisible ? 1 : 0,
                }}
                onClick={() => handleShare(i)}
                transition={{
                  duration: 0.3,
                  ease: [0.23, 1, 0.32, 1],
                  delay: isVisible ? i * 0.05 : 0,
                }}
                type="button"
                aria-label={button.label}
              >
                <motion.span
                  animate={{ scale: activeIndex === i ? 0.8 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <button.icon className="h-4 w-4 text-foreground" />
                </motion.span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          {...props}
        >
          <motion.span
            animate={{ rotate: isVisible ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link className="h-4 w-4" />
          </motion.span>
          Share
        </Button>
      </motion.div>
    </div>
  );
}
