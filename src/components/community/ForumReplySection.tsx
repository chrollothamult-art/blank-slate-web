import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Reply, Trash2, Loader2, ThumbsUp, Edit2, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MentionInput } from './MentionInput';

export interface ForumReply {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_reply_id: string | null;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    username: string;
    avatar_url: string | null;
  };
  replies?: ForumReply[];
}

interface ForumReplySectionProps {
  postId: string;
  replies: ForumReply[];
  loading: boolean;
  onRefresh: () => void;
}

interface ReplyItemProps {
  reply: ForumReply;
  postId: string;
  onReply: (parentId: string, authorName: string) => void;
  onDelete: (replyId: string) => void;
  onEdit: (replyId: string, newContent: string) => void;
  onRefresh: () => void;
  depth?: number;
}

// Render content with highlighted mentions
const renderContentWithMentions = (content: string) => {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      return (
        <span key={index} className="text-primary font-medium hover:underline cursor-pointer">
          {part}
        </span>
      );
    }
    return part;
  });
};

const ReplyItem = ({
  reply,
  postId,
  onReply,
  onDelete,
  onEdit,
  onRefresh,
  depth = 0,
}: ReplyItemProps) => {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(reply.likes_count);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [isSaving, setIsSaving] = useState(false);
  const canModify = user?.id === reply.author_id;
  const isEdited = reply.created_at !== reply.updated_at;

  const handleLike = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like replies',
        variant: 'destructive',
      });
      return;
    }

    setIsLiking(true);
    try {
      setLocalLikesCount(prev => prev + 1);
      toast({
        title: 'Liked!',
        description: 'You liked this reply',
      });
    } catch (err) {
      console.error('Error liking reply:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent === reply.content) {
      setIsEditing(false);
      setEditContent(reply.content);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('forum_replies')
        .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
        .eq('id', reply.id)
        .eq('author_id', user?.id);

      if (error) throw error;

      onEdit(reply.id, editContent.trim());
      setIsEditing(false);
      onRefresh();
      toast({
        title: 'Updated',
        description: 'Your reply has been updated',
      });
    } catch (err) {
      console.error('Error updating reply:', err);
      toast({
        title: 'Error',
        description: 'Failed to update reply',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(reply.content);
  };

  return (
    <div className={cn('space-y-3', depth > 0 && 'ml-6 md:ml-8 pl-4 border-l-2 border-muted')}>
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage src={reply.author?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-accent/10 text-accent">
            {reply.author?.username?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm text-foreground">
              {reply.author?.username || 'Anonymous'}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(reply.created_at), 'MMM d, yyyy • h:mm a')}
            </span>
            {isEdited && (
              <span className="text-xs text-muted-foreground italic">(edited)</span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <MentionInput
                value={editContent}
                onChange={setEditContent}
                placeholder="Edit your reply..."
                rows={2}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editContent.trim()}
                  className="h-7 gap-1"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-7 gap-1"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
              {renderContentWithMentions(reply.content)}
            </p>
          )}

          {!isEditing && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={handleLike}
                disabled={isLiking}
              >
                <ThumbsUp className="w-3 h-3" />
                {localLikesCount > 0 && <span>{localLikesCount}</span>}
              </Button>
              
              {depth < 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => onReply(reply.id, reply.author?.username || 'Anonymous')}
                >
                  <Reply className="w-3 h-3 mr-1" />
                  Reply
                </Button>
              )}
              
              {canModify && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={() => onDelete(reply.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {reply.replies && reply.replies.length > 0 && (
        <div className="space-y-3 mt-3">
          {reply.replies.map((nestedReply) => (
            <ReplyItem
              key={nestedReply.id}
              reply={nestedReply}
              postId={postId}
              onReply={onReply}
              onDelete={onDelete}
              onEdit={onEdit}
              onRefresh={onRefresh}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ForumReplySection = ({
  postId,
  replies,
  loading,
  onRefresh,
}: ForumReplySectionProps) => {
  const { user } = useAuth();
  const [newReply, setNewReply] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReply = async () => {
    if (!newReply.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('forum_replies').insert({
        post_id: postId,
        author_id: user.id,
        content: newReply.trim(),
        parent_reply_id: null,
      });

      if (error) throw error;

      // TODO: Send notifications to mentioned users
      if (mentions.length > 0) {
        console.log('Mentioned users:', mentions);
      }

      setNewReply('');
      setMentions([]);
      onRefresh();
      toast({
        title: 'Reply posted',
        description: 'Your reply has been added to the discussion',
      });
    } catch (err: any) {
      console.error('Error posting reply:', err);
      toast({
        title: 'Error',
        description: 'Failed to post reply',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitNestedReply = async () => {
    if (!replyContent.trim() || !replyingTo || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('forum_replies').insert({
        post_id: postId,
        author_id: user.id,
        content: replyContent.trim(),
        parent_reply_id: replyingTo.id,
      });

      if (error) throw error;

      setReplyContent('');
      setReplyingTo(null);
      onRefresh();
      toast({
        title: 'Reply posted',
        description: 'Your reply has been added',
      });
    } catch (err: any) {
      console.error('Error posting nested reply:', err);
      toast({
        title: 'Error',
        description: 'Failed to post reply',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (parentId: string, authorName: string) => {
    setReplyingTo({ id: parentId, authorName });
    setReplyContent(`@${authorName} `);
  };

  const handleDelete = async (replyId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('forum_replies')
        .delete()
        .eq('id', replyId)
        .eq('author_id', user.id);

      if (error) throw error;

      onRefresh();
      toast({
        title: 'Deleted',
        description: 'Reply has been deleted',
      });
    } catch (err) {
      console.error('Error deleting reply:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete reply',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (replyId: string, newContent: string) => {
    // This is called after successful edit - the refresh will update the UI
    console.log('Reply edited:', replyId);
  };

  const flattenedCount = replies.reduce((acc, reply) => {
    return acc + 1 + (reply.replies?.length || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Replies</h3>
        <span className="text-sm text-muted-foreground">({flattenedCount})</span>
      </div>

      {/* Reply to Post Form with Mentions */}
      {user ? (
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-xs bg-accent/10 text-accent">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <MentionInput
              value={newReply}
              onChange={setNewReply}
              onMentionsChange={setMentions}
              placeholder="Share your thoughts... Type @ to mention someone"
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitReply}
                disabled={!newReply.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Reply'
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Please sign in to reply to this discussion
        </p>
      )}

      <Separator />

      {/* Reply to Reply Form */}
      {replyingTo && (
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Replying to <span className="text-primary">@{replyingTo.authorName}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              Cancel
            </Button>
          </div>
          <MentionInput
            value={replyContent}
            onChange={setReplyContent}
            placeholder="Write your reply..."
            rows={2}
            autoFocus
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitNestedReply}
              disabled={!replyContent.trim() || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Reply'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Replies List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : replies.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No replies yet. Be the first to reply!
        </p>
      ) : (
        <div className="space-y-6">
          {replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              postId={postId}
              onReply={handleReply}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
};
