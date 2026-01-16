import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Share2, Loader2 } from "lucide-react";
import { ReadingProgress, formatReadingTime } from "@/hooks/useReadingProgress";

interface ShareProgressButtonProps {
  progress: ReadingProgress;
  bookTitle: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export const ShareProgressButton = ({
  progress,
  bookTitle,
  variant = "outline",
  size = "sm",
}: ShareProgressButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  const getMilestoneMessage = () => {
    const percentage = Math.round(progress.progress_percentage);
    const timeSpent = formatReadingTime(progress.time_spent_seconds);
    
    if (progress.completed) {
      return `🎉 I just finished reading "${bookTitle}"! It took me ${timeSpent} of reading time. What a journey!`;
    } else if (percentage >= 75) {
      return `📚 Almost there! I'm ${percentage}% through "${bookTitle}" with ${timeSpent} of reading time.`;
    } else if (percentage >= 50) {
      return `📖 Halfway milestone! I've reached ${percentage}% of "${bookTitle}". ${timeSpent} spent so far.`;
    } else if (percentage >= 25) {
      return `📕 Getting into it! ${percentage}% through "${bookTitle}". ${timeSpent} of reading and counting!`;
    } else {
      return `📗 Just started "${bookTitle}"! Currently at ${percentage}% with ${timeSpent} of reading time.`;
    }
  };

  const handleShare = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to share your reading progress",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsSharing(true);

    try {
      const milestoneMessage = getMilestoneMessage();
      const fullContent = customMessage 
        ? `${milestoneMessage}\n\n${customMessage}`
        : milestoneMessage;

      const { error } = await supabase.from("forum_posts").insert({
        title: progress.completed 
          ? `Finished: ${bookTitle}` 
          : `Reading Progress: ${bookTitle}`,
        content: fullContent,
        category: "Book Discussion",
        author_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Shared successfully!",
        description: "Your reading milestone has been posted to the forum",
      });

      setIsOpen(false);
      setCustomMessage("");
    } catch (error: any) {
      console.error("Error sharing progress:", error);
      toast({
        title: "Error",
        description: "Failed to share your progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Reading Milestone</DialogTitle>
            <DialogDescription>
              Post your progress to the forum and celebrate with the community!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm">{getMilestoneMessage()}</p>
            </div>

            {/* Custom message */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Add a personal message (optional)
              </label>
              <Textarea
                placeholder="Share your thoughts about the book so far..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Stats summary */}
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress: {Math.round(progress.progress_percentage)}%</span>
              <span>Time: {formatReadingTime(progress.time_spent_seconds)}</span>
              <span>Page: {progress.current_page}/{progress.total_pages}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={isSharing}>
              {isSharing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share to Forum
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
