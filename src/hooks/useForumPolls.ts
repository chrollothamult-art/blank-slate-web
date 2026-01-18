import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PollOption {
  id: string;
  option_text: string;
  order_index: number;
  votes_count: number;
}

export interface Poll {
  id: string;
  post_id: string;
  question: string;
  ends_at: string | null;
  created_at: string;
  options: PollOption[];
  total_votes: number;
  user_vote_option_id: string | null;
}

export const useForumPolls = (postId: string | null, userId: string | null) => {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPoll = useCallback(async () => {
    if (!postId) return;

    setLoading(true);
    try {
      // Fetch poll for this post
      const { data: pollData, error: pollError } = await supabase
        .from('forum_polls')
        .select('*')
        .eq('post_id', postId)
        .maybeSingle();

      if (pollError) throw pollError;
      if (!pollData) {
        setPoll(null);
        return;
      }

      // Fetch options
      const { data: optionsData, error: optionsError } = await supabase
        .from('forum_poll_options')
        .select('*')
        .eq('poll_id', pollData.id)
        .order('order_index', { ascending: true });

      if (optionsError) throw optionsError;

      // Fetch all votes
      const { data: votesData, error: votesError } = await supabase
        .from('forum_poll_votes')
        .select('option_id, user_id')
        .eq('poll_id', pollData.id);

      if (votesError) throw votesError;

      // Count votes per option
      const voteCounts: Record<string, number> = {};
      let userVoteOptionId: string | null = null;

      (votesData || []).forEach((vote) => {
        voteCounts[vote.option_id] = (voteCounts[vote.option_id] || 0) + 1;
        if (userId && vote.user_id === userId) {
          userVoteOptionId = vote.option_id;
        }
      });

      const options: PollOption[] = (optionsData || []).map((opt) => ({
        id: opt.id,
        option_text: opt.option_text,
        order_index: opt.order_index,
        votes_count: voteCounts[opt.id] || 0,
      }));

      setPoll({
        id: pollData.id,
        post_id: pollData.post_id,
        question: pollData.question,
        ends_at: pollData.ends_at,
        created_at: pollData.created_at,
        options,
        total_votes: votesData?.length || 0,
        user_vote_option_id: userVoteOptionId,
      });
    } catch (error: any) {
      console.error('Error fetching poll:', error);
    } finally {
      setLoading(false);
    }
  }, [postId, userId]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  const vote = async (optionId: string) => {
    if (!poll || !userId) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to vote',
        variant: 'destructive',
      });
      return;
    }

    // Check if poll has ended
    if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
      toast({
        title: 'Poll ended',
        description: 'This poll is no longer accepting votes',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Remove existing vote if any
      if (poll.user_vote_option_id) {
        await supabase
          .from('forum_poll_votes')
          .delete()
          .eq('poll_id', poll.id)
          .eq('user_id', userId);
      }

      // Add new vote
      const { error } = await supabase
        .from('forum_poll_votes')
        .insert({
          poll_id: poll.id,
          option_id: optionId,
          user_id: userId,
        });

      if (error) throw error;

      fetchPoll();
    } catch (error: any) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit vote',
        variant: 'destructive',
      });
    }
  };

  const createPoll = async (
    postId: string,
    question: string,
    options: string[],
    endsAt?: Date
  ) => {
    if (!userId) return null;

    try {
      // Create poll
      const { data: pollData, error: pollError } = await supabase
        .from('forum_polls')
        .insert({
          post_id: postId,
          question,
          ends_at: endsAt?.toISOString() || null,
        })
        .select()
        .single();

      if (pollError) throw pollError;

      // Create options
      const optionsToInsert = options.map((opt, idx) => ({
        poll_id: pollData.id,
        option_text: opt,
        order_index: idx,
      }));

      const { error: optionsError } = await supabase
        .from('forum_poll_options')
        .insert(optionsToInsert);

      if (optionsError) throw optionsError;

      return pollData.id;
    } catch (error: any) {
      console.error('Error creating poll:', error);
      toast({
        title: 'Error',
        description: 'Failed to create poll',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    poll,
    loading,
    vote,
    createPoll,
    refetch: fetchPoll,
  };
};
