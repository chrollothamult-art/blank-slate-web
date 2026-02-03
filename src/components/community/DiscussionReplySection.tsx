import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { MessageSquare, Reply, Send, Trash2, Edit, X, Check } from 'lucide-react';
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
      const { data: repliesData, error } = await supabase
        .from('discussion_replies')
        .select('*')
        .eq('discussion_id', discussionId)
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
      const replyMap = new Map<string, DiscussionReply>();
      const rootReplies: DiscussionReply[] = [];

      repliesData.forEach(reply => {
        const profile = profileMap.get(reply.author_id);
        const enrichedReply: DiscussionReply = {
          id: reply.id,
          discussion_id: reply.discussion_id,
          author_id: reply.author_id,
          content: reply.content,
          parent_reply_id: reply.parent_reply_id,
          created_at: reply.created_at,
          author_username: profile?.username,
          author_avatar: profile?.avatar_url,
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
    } catch (error: any) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoading(false);
    }
  }, [discussionId]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  const handleSubmitReply = async () => {
    if (!user || !newReply.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('discussion_replies')
        .insert({
          discussion_id: discussionId,
          author_id: user.id,
          content: newReply.trim(),
          parent_reply_id: replyingTo,
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

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Delete this reply?')) return;
    
    try {
      const { error } = await supabase
        .from('discussion_replies')
        .delete()
        .eq('id', replyId);

      if (error) throw error;

      toast({ title: 'Reply deleted' });
      fetchReplies();
    } catch (error: any) {
      console.error('Error deleting reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete reply',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="font-medium flex items-center gap-2 mb-4">
        <MessageSquare className="h-4 w-4" />
        Replies ({replies.length})
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
              {replyingTo && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Reply className="h-3 w-3" />
                  Replying to a comment
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => setReplyingTo(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <Textarea
                placeholder="Write a reply..."
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end gap-2">
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
              onReply={(id) => setReplyingTo(id)}
              onDelete={handleDeleteReply}
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
  onReply: (id: string) => void;
  onDelete: (id: string) => void;
  currentUserId?: string;
  depth?: number;
}

const ReplyCard = ({ reply, onReply, onDelete, currentUserId, depth = 0 }: ReplyCardProps) => {
  const maxDepth = 3;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const { toast } = useToast();

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    
    try {
      const { error } = await supabase
        .from('discussion_replies')
        .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
        .eq('id', reply.id);

      if (error) throw error;

      reply.content = editContent.trim();
      setIsEditing(false);
      toast({ title: 'Reply updated' });
    } catch (error: any) {
      console.error('Error updating reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reply',
        variant: 'destructive',
      });
    }
  };

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
            
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm mt-1">{reply.content}</p>
            )}
            
            <div className="flex items-center gap-2 mt-1">
              {depth < maxDepth && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => onReply(reply.id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
              {currentUserId === reply.author_id && !isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive"
                    onClick={() => onDelete(reply.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>
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
              onDelete={onDelete}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
