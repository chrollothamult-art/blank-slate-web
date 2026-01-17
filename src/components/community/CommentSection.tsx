import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Reply, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import type { SubmissionComment } from '@/hooks/useSubmissions';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
  comments: SubmissionComment[];
  loading: boolean;
  onAddComment: (content: string, parentId?: string) => Promise<any>;
  onDeleteComment: (commentId: string) => Promise<boolean>;
}

interface CommentItemProps {
  comment: SubmissionComment;
  onReply: (parentId: string) => void;
  onDelete: (commentId: string) => void;
  isOwner: boolean;
  depth?: number;
}

const CommentItem = ({
  comment,
  onReply,
  onDelete,
  isOwner,
  depth = 0,
}: CommentItemProps) => {
  const { user } = useAuth();
  const canDelete = user?.id === comment.user_id;

  return (
    <div className={cn('space-y-3', depth > 0 && 'ml-8 pl-4 border-l-2 border-muted')}>
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.author?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {comment.author?.username?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-foreground">
              {comment.author?.username || 'Anonymous'}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(comment.created_at), 'MMM d, yyyy • h:mm a')}
            </span>
          </div>

          <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          <div className="flex items-center gap-2 mt-2">
            {depth < 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onReply(comment.id)}
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3 mt-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              isOwner={user?.id === reply.user_id}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentSection = ({
  comments,
  loading,
  onAddComment,
  onDeleteComment,
}: CommentSectionProps) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    const result = await onAddComment(newComment.trim());
    if (result) {
      setNewComment('');
    }
    setSubmitting(false);
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !replyingTo) return;

    setSubmitting(true);
    const result = await onAddComment(replyContent.trim(), replyingTo);
    if (result) {
      setReplyContent('');
      setReplyingTo(null);
    }
    setSubmitting(false);
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    setReplyContent('');
  };

  const handleDelete = async (commentId: string) => {
    await onDeleteComment(commentId);
  };

  const flattenedCommentCount = comments.reduce((acc, comment) => {
    return acc + 1 + (comment.replies?.length || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Comments</h3>
        <span className="text-sm text-muted-foreground">({flattenedCommentCount})</span>
      </div>

      {/* Add Comment Form */}
      {user ? (
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={undefined} />
            <AvatarFallback className="text-xs">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Comment'
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Please sign in to leave a comment
        </p>
      )}

      <Separator />

      {/* Reply Modal */}
      {replyingTo && (
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Replying to comment</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              Cancel
            </Button>
          </div>
          <Textarea
            placeholder="Write your reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={2}
            className="resize-none"
            autoFocus
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitReply}
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

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onDelete={handleDelete}
              isOwner={user?.id === comment.user_id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
