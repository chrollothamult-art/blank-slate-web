import { useNavigate } from 'react-router-dom';
import { useSubmissions, Submission } from '@/hooks/useSubmissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Palette,
  MessageSquare,
  Star,
  Heart,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserSubmissionsListProps {
  userId: string;
  isOwnProfile: boolean;
  username: string;
}

const contentTypeIcons = {
  art: Palette,
  discussion: MessageSquare,
  review: Star,
};

const statusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  approved: { icon: CheckCircle, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  rejected: { icon: XCircle, color: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

export const UserSubmissionsList = ({ userId, isOwnProfile, username }: UserSubmissionsListProps) => {
  const navigate = useNavigate();
  const { submissions, loading } = useSubmissions({
    userId,
    status: isOwnProfile ? 'all' : 'approved',
    limit: 20,
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-16 w-16 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Submissions
        </CardTitle>
        <CardDescription>
          {isOwnProfile ? 'Your submitted content' : `Content submitted by ${username}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Palette className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No submissions yet</p>
            <p className="text-sm mt-1">
              {isOwnProfile
                ? 'Share your art, reviews, or discussions with the community!'
                : 'This user hasn\'t submitted any content yet'}
            </p>
            {isOwnProfile && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/community')}
              >
                Submit Content
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {submissions.map((submission) => {
                const TypeIcon = contentTypeIcons[submission.content_type];
                const statusInfo = statusConfig[submission.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={submission.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/community/submission/${submission.id}`)}
                  >
                    {submission.image_url ? (
                      <img
                        src={submission.image_url}
                        alt=""
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                        <TypeIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm line-clamp-1">{submission.title}</h4>
                        <Badge variant="outline" className="gap-1 shrink-0">
                          <TypeIcon className="h-3 w-3" />
                          {submission.content_type}
                        </Badge>
                        {isOwnProfile && (
                          <Badge variant="outline" className={`gap-1 shrink-0 ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {submission.status}
                          </Badge>
                        )}
                      </div>

                      {submission.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {submission.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {submission.likes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {submission.comments_count}
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
