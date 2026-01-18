import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Eye,
  Clock,
  Palette,
  MessageSquare,
  Star,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Submission } from '@/hooks/useSubmissions';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface SubmissionCardProps {
  submission: Submission;
  onLike: (id: string) => void;
  onDelete?: (id: string) => void;
  showStatus?: boolean;
}

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

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  approved: 'bg-green-500/10 text-green-600 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export const SubmissionCard = ({
  submission,
  onLike,
  onDelete,
  showStatus = false,
}: SubmissionCardProps) => {
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);

  const Icon = contentTypeIcons[submission.content_type];
  const isOwner = user?.id === submission.user_id;

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const url = `${window.location.origin}/community/${submission.id}`;
      await navigator.clipboard.writeText(url);
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
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Card className="group overflow-hidden rounded-2xl border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.02] bg-card/80 backdrop-blur-sm">
      {/* Image Section */}
      {submission.image_url && (
        <Link to={`/community/${submission.id}`} className="block">
          <div className="relative aspect-[4/3] overflow-hidden bg-muted/50 rounded-t-2xl">
            <img
              src={submission.image_url}
              alt={submission.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Badge
                variant="outline"
                className={cn('border backdrop-blur-md rounded-full px-3', contentTypeColors[submission.content_type])}
              >
                <Icon className="w-3 h-3 mr-1" />
                {submission.content_type}
              </Badge>
              <Button size="sm" variant="secondary" className="gap-1 rounded-full shadow-lg">
                <Eye className="w-3 h-3" />
                View
              </Button>
            </div>
          </div>
        </Link>
      )}

      <CardContent className={cn('p-5', !submission.image_url && 'pt-5')}>
        {/* Header with Type Badge (shown when no image) */}
        {!submission.image_url && (
          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant="outline"
              className={cn('border rounded-full px-3', contentTypeColors[submission.content_type])}
            >
              <Icon className="w-3 h-3 mr-1" />
              {submission.content_type}
            </Badge>
            {showStatus && (
              <Badge variant="outline" className={cn('border rounded-full px-3', statusColors[submission.status])}>
                {submission.status}
              </Badge>
            )}
          </div>
        )}

        {/* Title */}
        <Link to={`/community/${submission.id}`}>
          <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 mb-2">
            {submission.title}
          </h3>
        </Link>

        {/* Description Preview */}
        {submission.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {submission.description}
          </p>
        )}

        {/* Tags */}
        {submission.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {submission.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs px-2.5 py-1 rounded-full font-normal"
              >
                {tag.tag_name}
              </Badge>
            ))}
            {submission.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs px-2.5 py-1 rounded-full font-normal">
                +{submission.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Author & Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-3 border-t border-border/50">
          <Avatar className="w-6 h-6 ring-2 ring-background">
            <AvatarImage src={submission.author?.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {submission.author?.username?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">
            {submission.author?.username || 'Anonymous'}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3" />
            {format(new Date(submission.created_at), 'MMM d, yyyy')}
          </span>
        </div>
      </CardContent>

      <CardFooter className="px-5 pb-5 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Like Button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-1.5 px-3 rounded-full hover:bg-red-500/10',
              submission.user_has_liked && 'text-red-500 bg-red-500/10'
            )}
            onClick={() => onLike(submission.id)}
          >
            <Heart
              className={cn('w-4 h-4', submission.user_has_liked && 'fill-current')}
            />
            <span>{submission.likes_count}</span>
          </Button>

          {/* Comments */}
          <Link to={`/community/${submission.id}`}>
            <Button variant="ghost" size="sm" className="gap-1.5 px-3 rounded-full hover:bg-primary/10">
              <MessageCircle className="w-4 h-4" />
              <span>{submission.comments_count}</span>
            </Button>
          </Link>

          {/* Share */}
          <Button
            variant="ghost"
            size="sm"
            className="px-3 rounded-full hover:bg-primary/10"
            onClick={handleShare}
            disabled={isSharing}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {/* More Options */}
        {isOwner && onDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2 rounded-full hover:bg-muted">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem
                className="text-destructive rounded-lg"
                onClick={() => onDelete(submission.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardFooter>
    </Card>
  );
};
