import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface WishlistItem {
  id: string;
  book_id: string;
  created_at: string;
}

export const useWishlist = () => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("wishlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWishlist(data || []);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = useCallback(
    async (bookId: string) => {
      if (!user) {
        toast.error("Please sign in to add to wishlist");
        return false;
      }

      // Optimistic update
      const tempItem: WishlistItem = {
        id: `temp-${Date.now()}`,
        book_id: bookId,
        created_at: new Date().toISOString(),
      };
      setWishlist((prev) => [tempItem, ...prev]);

      try {
        const { data, error } = await supabase
          .from("wishlists")
          .insert({ user_id: user.id, book_id: bookId })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            toast.info("Already in your wishlist");
            setWishlist((prev) => prev.filter((item) => item.id !== tempItem.id));
            return false;
          }
          throw error;
        }

        // Replace temp item with real item
        setWishlist((prev) =>
          prev.map((item) => (item.id === tempItem.id ? data : item))
        );
        toast.success("Added to wishlist");
        return true;
      } catch (error) {
        console.error("Error adding to wishlist:", error);
        setWishlist((prev) => prev.filter((item) => item.id !== tempItem.id));
        toast.error("Failed to add to wishlist");
        return false;
      }
    },
    [user]
  );

  const removeFromWishlist = useCallback(
    async (bookId: string) => {
      if (!user) return false;

      const itemToRemove = wishlist.find((item) => item.book_id === bookId);
      if (!itemToRemove) return false;

      // Optimistic update
      setWishlist((prev) => prev.filter((item) => item.book_id !== bookId));

      try {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("book_id", bookId);

        if (error) throw error;
        toast.success("Removed from wishlist");
        return true;
      } catch (error) {
        console.error("Error removing from wishlist:", error);
        setWishlist((prev) => [...prev, itemToRemove]);
        toast.error("Failed to remove from wishlist");
        return false;
      }
    },
    [user, wishlist]
  );

  const toggleWishlist = useCallback(
    async (bookId: string) => {
      const isInWishlist = wishlist.some((item) => item.book_id === bookId);
      if (isInWishlist) {
        return removeFromWishlist(bookId);
      } else {
        return addToWishlist(bookId);
      }
    },
    [wishlist, addToWishlist, removeFromWishlist]
  );

  const isInWishlist = useCallback(
    (bookId: string) => {
      return wishlist.some((item) => item.book_id === bookId);
    },
    [wishlist]
  );

  return {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    refetch: fetchWishlist,
  };
};
