import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { format } from "date-fns";

interface Review {
  id: string;
  book_id: string;
  user_id: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface ReviewListProps {
  bookId: string;
}

export const ReviewList = ({ bookId }: ReviewListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [bookId]);

  const fetchReviews = async () => {
    setLoading(true);
    
    // First fetch reviews
    const { data: reviewsData, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .eq("book_id", bookId)
      .order("created_at", { ascending: false });

    if (reviewsData) {
      // Then fetch profiles for each review
      const userIds = reviewsData.map((r) => r.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      // Merge profiles into reviews
      const reviewsWithProfiles = reviewsData.map((review) => ({
        ...review,
        profiles: profilesData?.find((p) => p.id === review.user_id) || null,
      }));

      setReviews(reviewsWithProfiles);
    }
    setLoading(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-accent text-accent" : "text-muted-foreground"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-20 bg-muted rounded w-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No reviews yet. Be the first to review this book!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="p-6">
          <div className="flex items-start space-x-4">
            <Avatar>
              <AvatarFallback>
                {(review.profiles?.username || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{review.profiles?.username || "Anonymous"}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(review.created_at), "MMM dd, yyyy")}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  {renderStars(review.rating)}
                </div>
              </div>
              <h4 className="font-semibold text-lg">{review.title}</h4>
              <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
