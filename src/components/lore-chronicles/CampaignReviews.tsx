import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, Edit2, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useCampaignReviews } from "@/hooks/useCampaignReviews";
import { formatDistanceToNow } from "date-fns";

interface CampaignReviewsProps {
  campaignId: string;
}

const StarRating = ({ 
  rating, 
  onRate, 
  editable = false,
  size = "md"
}: { 
  rating: number; 
  onRate?: (rating: number) => void; 
  editable?: boolean;
  size?: "sm" | "md" | "lg";
}) => {
  const [hover, setHover] = useState(0);
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= (hover || rating)
              ? "text-yellow-500 fill-yellow-500"
              : "text-muted-foreground"
          } ${editable ? "cursor-pointer transition-colors" : ""}`}
          onClick={() => editable && onRate?.(star)}
          onMouseEnter={() => editable && setHover(star)}
          onMouseLeave={() => editable && setHover(0)}
        />
      ))}
    </div>
  );
};

export const CampaignReviews = ({ campaignId }: CampaignReviewsProps) => {
  const { user } = useAuth();
  const { reviews, userReview, loading, averageRating, reviewCount, submitReview, deleteReview } = useCampaignReviews(campaignId);
  
  const [isWriting, setIsWriting] = useState(false);
  const [rating, setRating] = useState(userReview?.rating || 0);
  const [title, setTitle] = useState(userReview?.title || "");
  const [content, setContent] = useState(userReview?.content || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setSubmitting(true);
    const success = await submitReview(rating, title, content);
    setSubmitting(false);
    
    if (success) {
      setIsWriting(false);
    }
  };

  const handleEdit = () => {
    if (userReview) {
      setRating(userReview.rating);
      setTitle(userReview.title || "");
      setContent(userReview.content || "");
    }
    setIsWriting(true);
  };

  const handleDelete = async () => {
    await deleteReview();
    setRating(0);
    setTitle("");
    setContent("");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Reviews
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <StarRating rating={Math.round(averageRating)} size="sm" />
              <span>
                {averageRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </CardDescription>
          </div>
          
          {user && !userReview && !isWriting && (
            <Button onClick={() => setIsWriting(true)} size="sm">
              Write Review
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Write/Edit Review Form */}
        {isWriting && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-muted/50 rounded-lg p-4 space-y-4"
          >
            <div>
              <label className="text-sm font-medium mb-2 block">Your Rating</label>
              <StarRating rating={rating} onRate={setRating} editable size="lg" />
            </div>
            
            <Input
              placeholder="Review title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            
            <Textarea
              placeholder="Share your thoughts about this campaign..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
            
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setIsWriting(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={rating === 0 || submitting}>
                <Send className="h-4 w-4 mr-2" />
                {userReview ? "Update" : "Submit"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* User's Review */}
        {userReview && !isWriting && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-primary">Your Review</span>
                <StarRating rating={userReview.rating} size="sm" />
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={handleEdit}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            {userReview.title && (
              <h4 className="font-semibold">{userReview.title}</h4>
            )}
            {userReview.content && (
              <p className="text-sm text-muted-foreground mt-1">{userReview.content}</p>
            )}
          </div>
        )}

        {/* All Reviews */}
        {reviews.filter(r => r.user_id !== user?.id).length > 0 ? (
          <div className="space-y-4">
            {reviews.filter(r => r.user_id !== user?.id).map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-border/50 pb-4 last:border-0"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={review.user?.avatar_url || undefined} />
                    <AvatarFallback>
                      {review.user?.username?.slice(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{review.user?.username || "Anonymous"}</span>
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {review.title && (
                      <h4 className="font-semibold text-sm">{review.title}</h4>
                    )}
                    
                    {review.content && (
                      <p className="text-sm text-muted-foreground mt-1">{review.content}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          !userReview && (
            <p className="text-center text-muted-foreground py-4">
              No reviews yet. Be the first to share your thoughts!
            </p>
          )
        )}
      </CardContent>
    </Card>
  );
};
