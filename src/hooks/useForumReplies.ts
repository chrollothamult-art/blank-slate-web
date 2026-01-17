import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ForumReply } from '@/components/community/ForumReplySection';

export const useForumReplies = (postId: string | null) => {
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReplies = useCallback(async () => {
    if (!postId) return;

    setLoading(true);
    try {
      const { data: repliesData, error } = await supabase
        .from('forum_replies')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!repliesData || repliesData.length === 0) {
        setReplies([]);
        setLoading(false);
        return;
      }

      // Fetch author profiles
      const authorIds = [...new Set(repliesData.map(r => r.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Build reply tree
      const replyMap = new Map<string, ForumReply>();
      const rootReplies: ForumReply[] = [];

      repliesData.forEach(reply => {
        const profile = profileMap.get(reply.author_id);
        const enrichedReply: ForumReply = {
          id: reply.id,
          post_id: reply.post_id,
          author_id: reply.author_id,
          content: reply.content,
          parent_reply_id: reply.parent_reply_id,
          likes_count: reply.likes_count,
          created_at: reply.created_at,
          updated_at: reply.updated_at,
          author: profile ? {
            username: profile.username,
            avatar_url: profile.avatar_url,
          } : undefined,
          replies: [],
        };
        replyMap.set(reply.id, enrichedReply);
      });

      repliesData.forEach(reply => {
        const enrichedReply = replyMap.get(reply.id)!;
        if (reply.parent_reply_id) {
          const parent = replyMap.get(reply.parent_reply_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(enrichedReply);
          }
        } else {
          rootReplies.push(enrichedReply);
        }
      });

      setReplies(rootReplies);
    } catch (err: any) {
      console.error('Error fetching replies:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  return {
    replies,
    loading,
    refetch: fetchReplies,
  };
};
