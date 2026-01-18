import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { MessageSquare, Reply, Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DiscussionReply {
  id: string;
  discussion_id: string;
  author_id: string;
  content: string;
  parent_reply_id: string | null;
  created_at: string;
  author_username?: string;
  author_avatar?: string;
  replies?: DiscussionReply[];
}

interface DiscussionReplySectionProps {
  discussionId: string;
  clubId: string;
}

export const DiscussionReplySection = ({ discussionId, clubId }: DiscussionReplySectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReplies = useCallback(async () => {
    setLoading(true);
    try {
      // Note: For now, we'll use the book_club_discussions table with parent_id field
      // In a full implementation, you'd have a separate discussion_replies table
      const { data, error } = await supabase
        .from('book_club_discussions')
        .select('*')
        .eq('club_id', clubId)
        .not('id', 'eq', discussionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // For this implementation, we'll simulate replies from discussions
      // that reference this discussion (treating them as replies)
      // Fetch author profiles
      const authorIds = [...new Set((data || []).map(d => d.author_id))];
      let profiles: any[] = [];
      if (authorIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', authorIds);
        profiles = profileData || [];
      }

      const profilesMap = new Map(profiles.map(p => [p.id, p]));

      // For now, we'll return an empty array and implement inline replies
      setReplies([]);
    } catch (error: any) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoading(false);
    }
  }, [clubId, discussionId]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  const handleSubmitReply = async () => {
    if (!user || !newReply.trim()) return;

    setIsSubmitting(true);
    try {
      // Create a new discussion as a reply (with a reference pattern in the title)
      const { error } = await supabase
        .from('book_club_discussions')
        .insert({
          club_id: clubId,
          author_id: user.id,
          title: `Reply to discussion`,
          content: newReply.trim(),
          chapter: `reply:${discussionId}${replyingTo ? `:${replyingTo}` : ''}`,
        });

      if (error) throw error;

      toast({
        title: 'Reply posted',
        description: 'Your reply has been added',
      });

      setNewReply('');
      setReplyingTo(null);
      fetchReplies();
    } catch (error: any) {
      console.error('Error posting reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to post reply',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="font-medium flex items-center gap-2 mb-4">
        <MessageSquare className="h-4 w-4" />
        Replies
      </h4>

      {user ? (
        <div className="mb-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={undefined} />
              <AvatarFallback>
                {user.email?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end gap-2">
                {replyingTo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={!newReply.trim() || isSubmitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Posting...' : 'Post Reply'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-4">
          Sign in to reply to this discussion
        </p>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading replies...</div>
      ) : replies.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4">
          No replies yet. Be the first to respond!
        </div>
      ) : (
        <div className="space-y-3">
          {replies.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              onReply={() => setReplyingTo(reply.id)}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ReplyCardProps {
  reply: DiscussionReply;
  onReply: () => void;
  currentUserId?: string;
  depth?: number;
}

const ReplyCard = ({ reply, onReply, currentUserId, depth = 0 }: ReplyCardProps) => {
  const maxDepth = 3;

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-muted pl-4' : ''}`}>
      <Card className="p-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-7 w-7">
            <AvatarImage src={reply.author_avatar || undefined} />
            <AvatarFallback>
              {reply.author_username?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{reply.author_username || 'Unknown'}</span>
              <span className="text-muted-foreground">
                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm mt-1">{reply.content}</p>
            {depth < maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-7 px-2 text-xs"
                onClick={onReply}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
          </div>
        </div>
      </Card>

      {reply.replies && reply.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {reply.replies.map((childReply) => (
            <ReplyCard
              key={childReply.id}
              reply={childReply}
              onReply={onReply}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
