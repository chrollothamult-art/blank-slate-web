import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ReadingProgress {
  id: string;
  user_id: string;
  book_id: string;
  current_page: number;
  total_pages: number;
  progress_percentage: number;
  time_spent_seconds: number;
  last_read_at: string;
  completed: boolean;
  completed_at: string | null;
}

export interface ReadingStats {
  totalBooksStarted: number;
  totalBooksCompleted: number;
  totalTimeSpentSeconds: number;
  averageProgress: number;
}

export const useReadingProgress = (bookId?: string) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [allProgress, setAllProgress] = useState<ReadingProgress[]>([]);
  const [stats, setStats] = useState<ReadingStats>({
    totalBooksStarted: 0,
    totalBooksCompleted: 0,
    totalTimeSpentSeconds: 0,
    averageProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const timeTrackingRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch progress for a specific book
  const fetchProgress = useCallback(async () => {
    if (!user || !bookId) return;

    const { data, error } = await supabase
      .from("reading_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .single();

    if (!error && data) {
      setProgress(data);
      timeTrackingRef.current = data.time_spent_seconds;
    }
    setLoading(false);
  }, [user, bookId]);

  // Fetch all progress for reading stats
  const fetchAllProgress = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("reading_progress")
      .select("*")
      .eq("user_id", user.id)
      .order("last_read_at", { ascending: false });

    if (!error && data) {
      setAllProgress(data);
      
      // Calculate stats
      const totalBooksStarted = data.length;
      const totalBooksCompleted = data.filter(p => p.completed).length;
      const totalTimeSpentSeconds = data.reduce((acc, p) => acc + p.time_spent_seconds, 0);
      const averageProgress = data.length > 0 
        ? data.reduce((acc, p) => acc + Number(p.progress_percentage), 0) / data.length 
        : 0;

      setStats({
        totalBooksStarted,
        totalBooksCompleted,
        totalTimeSpentSeconds,
        averageProgress,
      });
    }
    setLoading(false);
  }, [user]);

  // Update progress
  const updateProgress = useCallback(async (
    currentPage: number, 
    totalPages: number
  ) => {
    if (!user || !bookId) return;

    const progressPercentage = Math.min((currentPage / totalPages) * 100, 100);
    const completed = progressPercentage >= 100;
    const timeSpent = timeTrackingRef.current;

    const progressData = {
      user_id: user.id,
      book_id: bookId,
      current_page: currentPage,
      total_pages: totalPages,
      progress_percentage: progressPercentage,
      time_spent_seconds: timeSpent,
      last_read_at: new Date().toISOString(),
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from("reading_progress")
      .upsert(progressData, { 
        onConflict: "user_id,book_id",
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (!error && data) {
      setProgress(data);
    }

    return { data, error };
  }, [user, bookId]);

  // Start time tracking
  const startTimeTracking = useCallback(() => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      timeTrackingRef.current += 1;
    }, 1000);
  }, []);

  // Stop time tracking and save
  const stopTimeTracking = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Save the accumulated time
    if (user && bookId && progress) {
      await supabase
        .from("reading_progress")
        .update({ 
          time_spent_seconds: timeTrackingRef.current,
          last_read_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .eq("book_id", bookId);
    }
  }, [user, bookId, progress]);

  // Get progress for a specific book
  const getProgressForBook = useCallback((targetBookId: string) => {
    return allProgress.find(p => p.book_id === targetBookId);
  }, [allProgress]);

  useEffect(() => {
    if (bookId) {
      fetchProgress();
    } else {
      fetchAllProgress();
    }
  }, [bookId, fetchProgress, fetchAllProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    progress,
    allProgress,
    stats,
    loading,
    updateProgress,
    startTimeTracking,
    stopTimeTracking,
    getProgressForBook,
    refetch: bookId ? fetchProgress : fetchAllProgress,
  };
};

// Helper to format time
export const formatReadingTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};
