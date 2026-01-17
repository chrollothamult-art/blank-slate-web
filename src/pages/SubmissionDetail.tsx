import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  MessageCircle,
  Share2,
  ArrowLeft,
  Calendar,
  Palette,
  MessageSquare,
  Star,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubmissionComments } from '@/hooks/useSubmissions';
import { CommentSection } from '@/components/community/CommentSection';
import { Footer } from '@/components/Footer';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Submission, SubmissionTag } from '@/hooks/useSubmissions';

const contentTypeIcons = {
  art: Palette,
  discussion: MessageSquare,
  review: Star,
};

const contentTypeColors = {
  art: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  discussion: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  review: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
};

export const SubmissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const {
    comments,
    loading: commentsLoading,
    addComment,
    deleteComment,
  } = useSubmissionComments(id || '');

  useEffect(() => {
    if (!id) return;

    const fetchSubmission = async () => {
      setLoading(true);
      try {
        // Fetch submission
        const { data: subData, error: subError } = await supabase
          .from('user_submissions')
          .select('*')
          .eq('id', id)
          .single();

        if (subError) throw subError;

        // Fetch author profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', subData.user_id)
          .single();

        // Fetch tags
        const { data: tagsData } = await supabase
          .from('submission_tags')
          .select('*')
          .eq('submission_id', id);

        const tags: SubmissionTag[] = tagsData?.map(t => ({
          id: t.id,
          tag_id: t.tag_id,
          tag_name: t.tag_name,
          tag_type: t.tag_type,
        })) || [];

        // Get likes count
        const { data: likesData } = await supabase.rpc('get_submission_likes_count', {
          submission_uuid: id,
        });

        // Get comments count
        const { data: commentsData } = await supabase.rpc('get_submission_comments_count', {
          submission_uuid: id,
        });

        // Check if user has liked
        let userLiked = false;
        if (user) {
          const { data: hasLiked } = await supabase.rpc('user_has_liked', {
            submission_uuid: id,
            checking_user_id: user.id,
          });
          userLiked = hasLiked || false;
        }

        const enrichedSubmission: Submission = {
          ...subData,
          author: profile ? {
            username: profile.username,
            avatar_url: profile.avatar_url,
          } : undefined,
          likes_count: likesData || 0,
          comments_count: commentsData || 0,
          user_has_liked: userLiked,
          tags,
        };

        setSubmission(enrichedSubmission);
        setLiked(userLiked);
        setLikesCount(likesData || 0);
      } catch (err: any) {
        console.error('Error fetching submission:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [id, user]);

  const handleLike = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like content',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (liked) {
        await supabase
          .from('submission_likes')
          .delete()
          .eq('submission_id', id)
          .eq('user_id', user.id);
        setLiked(false);
        setLikesCount((prev) => prev - 1);
      } else {
        await supabase
          .from('submission_likes')
          .insert({
            submission_id: id,
            user_id: user.id,
          });
        setLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied!',
        description: 'Share link has been copied to clipboard',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!user || !submission) return;

    try {
      const { error } = await supabase
        .from('user_submissions')
        .delete()
        .eq('id', submission.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Deleted',
        description: 'Your submission has been deleted',
      });
      navigate('/community');
    } catch (err: any) {
      console.error('Error deleting:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete submission',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-video w-full rounded-lg mb-6" />
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div>
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Submission Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This submission may have been removed or is awaiting approval.
          </p>
          <Button onClick={() => navigate('/community')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Gallery
          </Button>
        </div>
      </div>
    );
  }

  const Icon = contentTypeIcons[submission.content_type];
  const isOwner = user?.id === submission.user_id;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/community')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Gallery
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            {submission.image_url && (
              <div className="rounded-lg overflow-hidden bg-muted">
                <img
                  src={submission.image_url}
                  alt={submission.title}
                  className="w-full h-auto max-h-[600px] object-contain"
                />
              </div>
            )}

            {/* Title & Description */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge
                  variant="outline"
                  className={cn('border', contentTypeColors[submission.content_type])}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {submission.content_type}
                </Badge>
                {submission.content_type === 'review' && submission.rating && (
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < submission.rating! ? 'fill-current' : ''
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-heading font-bold mb-4">
                {submission.title}
              </h1>

              {submission.description && (
                <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {submission.description}
                </p>
              )}
            </div>

            {/* Tags */}
            {submission.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {submission.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.tag_name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 py-4 border-y">
              <Button
                variant={liked ? 'default' : 'outline'}
                className="gap-2"
                onClick={handleLike}
              >
                <Heart className={cn('w-4 h-4', liked && 'fill-current')} />
                {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
              </Button>

              <Button variant="outline" className="gap-2" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
                Share
              </Button>

              {isOwner && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2 ml-auto">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. Your submission and all its comments will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Comments */}
            <CommentSection
              comments={comments}
              loading={commentsLoading}
              onAddComment={addComment}
              onDeleteComment={deleteComment}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Created by
                </h3>
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={submission.author?.avatar_url || undefined} />
                    <AvatarFallback>
                      {submission.author?.username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {submission.author?.username || 'Anonymous'}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(submission.created_at), 'MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Engagement
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Heart className="w-5 h-5 mx-auto mb-1 text-red-500" />
                    <div className="text-xl font-bold">{likesCount}</div>
                    <div className="text-xs text-muted-foreground">Likes</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <MessageCircle className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <div className="text-xl font-bold">{comments.length}</div>
                    <div className="text-xs text-muted-foreground">Comments</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SubmissionDetail;
