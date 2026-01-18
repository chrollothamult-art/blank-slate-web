import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Crown,
  Heart,
  MessageCircle,
  Palette,
  MessageSquare,
  Star,
} from 'lucide-react';

interface FeaturedSubmission {
  id: string;
  title: string;
  description: string | null;
  content_type: 'art' | 'discussion' | 'review';
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  author: {
    username: string;
    avatar_url: string | null;
  } | null;
}

const contentTypeIcons = {
  art: Palette,
  discussion: MessageSquare,
  review: Star,
};

export const FeaturedSubmissions = () => {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<FeaturedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFeatured, setHasFeatured] = useState(false);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // Only get actually featured submissions - no fallback
        const { data: submissions, error } = await supabase
          .from('user_submissions')
          .select('id, title, description, content_type, image_url, user_id')
          .eq('status', 'approved')
          .eq('is_featured', true)
          .order('featured_at', { ascending: false })
          .limit(4);

        if (error) throw error;

        if (!submissions || submissions.length === 0) {
          setFeatured([]);
          setHasFeatured(false);
          setLoading(false);
          return;
        }

        setHasFeatured(true);
        await enrichSubmissions(submissions);
      } catch (error) {
        console.error('Error fetching featured:', error);
        setFeatured([]);
        setHasFeatured(false);
      } finally {
        setLoading(false);
      }
    };

    const enrichSubmissions = async (submissions: any[]) => {
      const userIds = [...new Set(submissions.map(s => s.user_id))];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enriched = await Promise.all(
        submissions.map(async (sub) => {
          const likesCount = await supabase.rpc('get_submission_likes_count', {
            submission_uuid: sub.id,
          });
          const commentsCount = await supabase.rpc('get_submission_comments_count', {
            submission_uuid: sub.id,
          });

          const profile = profileMap.get(sub.user_id);
          return {
            id: sub.id,
            title: sub.title,
            description: sub.description,
            content_type: sub.content_type as 'art' | 'discussion' | 'review',
            image_url: sub.image_url,
            likes_count: likesCount.data || 0,
            comments_count: commentsCount.data || 0,
            author: profile ? {
              username: profile.username,
              avatar_url: profile.avatar_url,
            } : null,
          };
        })
      );

      setFeatured(enriched);
    };

    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-1/2 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Don't render anything if no featured items
  if (!hasFeatured || featured.length === 0) {
    return null;
  }

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-amber-500/10">
          <Crown className="h-5 w-5 text-amber-500" />
        </div>
        <h2 className="text-xl font-semibold">Featured Creations</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {featured.map((submission) => {
          const TypeIcon = contentTypeIcons[submission.content_type];
          
          return (
            <Card
              key={submission.id}
              className="group cursor-pointer overflow-hidden rounded-2xl border-2 border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300"
              onClick={() => navigate(`/community/submission/${submission.id}`)}
            >
              {submission.image_url ? (
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={submission.image_url}
                    alt={submission.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 rounded-full px-3 shadow-lg">
                      <Crown className="h-3 w-3" />
                      Featured
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center relative rounded-t-2xl">
                  <TypeIcon className="h-12 w-12 text-muted-foreground/50" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 rounded-full px-3 shadow-lg">
                      <Crown className="h-3 w-3" />
                      Featured
                    </Badge>
                  </div>
                </div>
              )}
              
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="gap-1 text-xs rounded-full px-3 py-1">
                    <TypeIcon className="h-3 w-3" />
                    {submission.content_type}
                  </Badge>
                </div>
                
                <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors text-base">
                  {submission.title}
                </h3>
                
                {submission.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                    {submission.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  {submission.author && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 ring-2 ring-background">
                        <AvatarImage src={submission.author.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {submission.author.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground font-medium">
                        {submission.author.username}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" />
                      {submission.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {submission.comments_count}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
