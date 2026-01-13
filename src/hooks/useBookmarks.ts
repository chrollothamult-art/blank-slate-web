import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Bookmark {
  id: string;
  book_id: string;
  page_number: number;
  label: string | null;
  created_at: string;
}

export const useBookmarks = (bookId: string) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchBookmarks = useCallback(async () => {
    if (!user || !bookId) {
      setBookmarks([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .order("page_number", { ascending: true });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setLoading(false);
    }
  }, [user, bookId]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const addBookmark = useCallback(
    async (pageNumber: number, label?: string) => {
      if (!user || !bookId) {
        toast.error("Please sign in to add bookmarks");
        return null;
      }

      // Check if bookmark already exists for this page
      const existing = bookmarks.find((b) => b.page_number === pageNumber);
      if (existing) {
        toast.info("Bookmark already exists for this page");
        return existing;
      }

      try {
        const { data, error } = await supabase
          .from("bookmarks")
          .insert({
            user_id: user.id,
            book_id: bookId,
            page_number: pageNumber,
            label: label || `Page ${pageNumber}`,
          })
          .select()
          .single();

        if (error) throw error;

        setBookmarks((prev) =>
          [...prev, data].sort((a, b) => a.page_number - b.page_number)
        );
        toast.success("Bookmark added");
        return data;
      } catch (error) {
        console.error("Error adding bookmark:", error);
        toast.error("Failed to add bookmark");
        return null;
      }
    },
    [user, bookId, bookmarks]
  );

  const removeBookmark = useCallback(
    async (bookmarkId: string) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("id", bookmarkId);

        if (error) throw error;

        setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
        toast.success("Bookmark removed");
        return true;
      } catch (error) {
        console.error("Error removing bookmark:", error);
        toast.error("Failed to remove bookmark");
        return false;
      }
    },
    [user]
  );

  const isPageBookmarked = useCallback(
    (pageNumber: number) => {
      return bookmarks.some((b) => b.page_number === pageNumber);
    },
    [bookmarks]
  );

  const getBookmarkForPage = useCallback(
    (pageNumber: number) => {
      return bookmarks.find((b) => b.page_number === pageNumber);
    },
    [bookmarks]
  );

  return {
    bookmarks,
    loading,
    addBookmark,
    removeBookmark,
    isPageBookmarked,
    getBookmarkForPage,
    refetch: fetchBookmarks,
  };
};
