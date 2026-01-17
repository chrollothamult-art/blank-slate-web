import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ContentType = Database['public']['Enums']['content_type'];
type ContentStatus = Database['public']['Enums']['content_status'];
type TagType = Database['public']['Enums']['tag_type'];

export interface Submission {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  content_type: ContentType;
  image_url: string | null;
  status: ContentStatus;
  rating: number | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    username: string;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
  tags: SubmissionTag[];
}

export interface SubmissionTag {
  id: string;
  tag_id: string;
  tag_name: string;
  tag_type: TagType;
}

export interface SubmissionComment {
  id: string;
  submission_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    username: string;
    avatar_url: string | null;
  };
  replies?: SubmissionComment[];
}

interface UseSubmissionsOptions {
  contentType?: ContentType | 'all';
  status?: ContentStatus | 'all';
  userId?: string;
  limit?: number;
}

export const useSubmissions = (options: UseSubmissionsOptions = {}) => {
  const { contentType = 'all', status = 'approved', userId, limit = 50 } = options;
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('user_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (contentType !== 'all') {
        query = query.eq('content_type', contentType);
      }

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: submissionsData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (!submissionsData || submissionsData.length === 0) {
        setSubmissions([]);
        setLoading(false);
        return;
      }

      // Fetch author profiles
      const userIds = [...new Set(submissionsData.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch tags for submissions
      const submissionIds = submissionsData.map(s => s.id);
      const { data: tagsData } = await supabase
        .from('submission_tags')
        .select('*')
        .in('submission_id', submissionIds);

      const tagsMap = new Map<string, SubmissionTag[]>();
      tagsData?.forEach(tag => {
        const existing = tagsMap.get(tag.submission_id) || [];
        existing.push({
          id: tag.id,
          tag_id: tag.tag_id,
          tag_name: tag.tag_name,
          tag_type: tag.tag_type,
        });
        tagsMap.set(tag.submission_id, existing);
      });

      // Build enriched submissions
      const enrichedSubmissions: Submission[] = await Promise.all(
        submissionsData.map(async (sub) => {
          const profile = profileMap.get(sub.user_id);
          
          // Get likes count
          const likesCount = await supabase.rpc('get_submission_likes_count', {
            submission_uuid: sub.id,
          });

          // Get comments count
          const commentsCount = await supabase.rpc('get_submission_comments_count', {
            submission_uuid: sub.id,
          });

          // Check if user has liked
          let userHasLiked = false;
          if (user) {
            const { data: hasLiked } = await supabase.rpc('user_has_liked', {
              submission_uuid: sub.id,
              checking_user_id: user.id,
            });
            userHasLiked = hasLiked || false;
          }

          return {
            ...sub,
            author: profile ? {
              username: profile.username,
              avatar_url: profile.avatar_url,
            } : undefined,
            likes_count: likesCount.data || 0,
            comments_count: commentsCount.data || 0,
            user_has_liked: userHasLiked,
            tags: tagsMap.get(sub.id) || [],
          };
        })
      );

      setSubmissions(enrichedSubmissions);
    } catch (err: any) {
      console.error('Error fetching submissions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [contentType, status, userId, limit, user]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const createSubmission = async (
    title: string,
    contentType: ContentType,
    description?: string,
    imageUrl?: string,
    rating?: number,
    tags?: { tag_id: string; tag_name: string; tag_type: TagType }[]
  ) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to submit content',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data: submission, error: insertError } = await supabase
        .from('user_submissions')
        .insert({
          user_id: user.id,
          title,
          content_type: contentType,
          description: description || null,
          image_url: imageUrl || null,
          rating: rating || null,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Insert tags
      if (tags && tags.length > 0 && submission) {
        const tagsToInsert = tags.map(tag => ({
          submission_id: submission.id,
          tag_id: tag.tag_id,
          tag_name: tag.tag_name,
          tag_type: tag.tag_type,
        }));

        await supabase.from('submission_tags').insert(tagsToInsert);
      }

      toast({
        title: 'Submission created',
        description: 'Your content has been submitted for review',
      });

      fetchSubmissions();
      return submission;
    } catch (err: any) {
      console.error('Error creating submission:', err);
      toast({
        title: 'Error',
        description: 'Failed to create submission',
        variant: 'destructive',
      });
      return null;
    }
  };

  const toggleLike = async (submissionId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like content',
        variant: 'destructive',
      });
      return;
    }

    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;

    try {
      if (submission.user_has_liked) {
        // Remove like
        await supabase
          .from('submission_likes')
          .delete()
          .eq('submission_id', submissionId)
          .eq('user_id', user.id);
      } else {
        // Add like
        await supabase
          .from('submission_likes')
          .insert({
            submission_id: submissionId,
            user_id: user.id,
          });
      }

      // Update local state
      setSubmissions(prev =>
        prev.map(s =>
          s.id === submissionId
            ? {
                ...s,
                user_has_liked: !s.user_has_liked,
                likes_count: s.user_has_liked ? s.likes_count - 1 : s.likes_count + 1,
              }
            : s
        )
      );
    } catch (err: any) {
      console.error('Error toggling like:', err);
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive',
      });
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_submissions')
        .delete()
        .eq('id', submissionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      toast({
        title: 'Deleted',
        description: 'Your submission has been deleted',
      });
      return true;
    } catch (err: any) {
      console.error('Error deleting submission:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete submission',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    submissions,
    loading,
    error,
    createSubmission,
    toggleLike,
    deleteSubmission,
    refetch: fetchSubmissions,
  };
};

export const useSubmissionComments = (submissionId: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<SubmissionComment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    if (!submissionId) return;

    setLoading(true);
    try {
      const { data: commentsData, error } = await supabase
        .from('submission_comments')
        .select('*')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      // Fetch author profiles
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Build comment tree
      const commentMap = new Map<string, SubmissionComment>();
      const rootComments: SubmissionComment[] = [];

      commentsData.forEach(comment => {
        const profile = profileMap.get(comment.user_id);
        const enrichedComment: SubmissionComment = {
          ...comment,
          author: profile ? {
            username: profile.username,
            avatar_url: profile.avatar_url,
          } : undefined,
          replies: [],
        };
        commentMap.set(comment.id, enrichedComment);
      });

      commentsData.forEach(comment => {
        const enrichedComment = commentMap.get(comment.id)!;
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(enrichedComment);
          }
        } else {
          rootComments.push(enrichedComment);
        }
      });

      setComments(rootComments);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content: string, parentId?: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to comment',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data: comment, error } = await supabase
        .from('submission_comments')
        .insert({
          submission_id: submissionId,
          user_id: user.id,
          content,
          parent_id: parentId || null,
        })
        .select()
        .single();

      if (error) throw error;

      fetchComments();
      return comment;
    } catch (err: any) {
      console.error('Error adding comment:', err);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('submission_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      fetchComments();
      return true;
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      return false;
    }
  };

  return {
    comments,
    loading,
    addComment,
    deleteComment,
    refetch: fetchComments,
  };
};
