import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface CampaignReview {
  id: string;
  campaign_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    username: string;
    avatar_url: string | null;
  };
}

export const useCampaignReviews = (campaignId: string) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<CampaignReview[]>([]);
  const [userReview, setUserReview] = useState<CampaignReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const fetchReviews = useCallback(async () => {
    if (!campaignId) return;

    setLoading(true);
    
    const { data, error } = await supabase
      .from("rp_campaign_reviews")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      setLoading(false);
      return;
    }

    // Fetch user profiles separately
    const userIds = [...new Set((data || []).map(r => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const mappedReviews: CampaignReview[] = (data || []).map((r) => {
      const profile = profileMap.get(r.user_id);
      return {
        id: r.id,
        campaign_id: r.campaign_id,
        user_id: r.user_id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        created_at: r.created_at,
        updated_at: r.updated_at,
        user: profile ? { username: profile.username, avatar_url: profile.avatar_url } : undefined
      };
    });

    setReviews(mappedReviews);

    // Find user's review
    if (user) {
      const myReview = mappedReviews.find(r => r.user_id === user.id);
      setUserReview(myReview || null);
    }

    // Calculate average
    if (mappedReviews.length > 0) {
      const avg = mappedReviews.reduce((sum, r) => sum + r.rating, 0) / mappedReviews.length;
      setAverageRating(Math.round(avg * 10) / 10);
      setReviewCount(mappedReviews.length);
    } else {
      setAverageRating(0);
      setReviewCount(0);
    }

    setLoading(false);
  }, [campaignId, user]);

  const submitReview = async (rating: number, title?: string, content?: string) => {
    if (!user) {
      toast({ title: "Please sign in to leave a review", variant: "destructive" });
      return false;
    }

    if (userReview) {
      // Update existing review
      const { error } = await supabase
        .from("rp_campaign_reviews")
        .update({
          rating,
          title: title || null,
          content: content || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", userReview.id);

      if (error) {
        toast({ title: "Failed to update review", description: error.message, variant: "destructive" });
        return false;
      }

      toast({ title: "Review updated!" });
    } else {
      // Create new review
      const { error } = await supabase
        .from("rp_campaign_reviews")
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          rating,
          title: title || null,
          content: content || null
        });

      if (error) {
        toast({ title: "Failed to submit review", description: error.message, variant: "destructive" });
        return false;
      }

      toast({ title: "Review submitted!" });
    }

    await fetchReviews();
    return true;
  };

  const deleteReview = async () => {
    if (!userReview) return false;

    const { error } = await supabase
      .from("rp_campaign_reviews")
      .delete()
      .eq("id", userReview.id);

    if (error) {
      toast({ title: "Failed to delete review", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Review deleted" });
    await fetchReviews();
    return true;
  };

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    userReview,
    loading,
    averageRating,
    reviewCount,
    submitReview,
    deleteReview,
    refetch: fetchReviews
  };
};
