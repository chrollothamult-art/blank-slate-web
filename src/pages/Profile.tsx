import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAchievements } from "@/hooks/useAchievements";
import { useStreaks } from "@/hooks/useStreaks";
import { useWishlist } from "@/hooks/useWishlist";
import { useBooks } from "@/contexts/BooksContext";

import { Footer } from "@/components/Footer";
import { FollowButton } from "@/components/FollowButton";
import { AchievementsDisplay } from "@/components/AchievementsDisplay";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Trophy,
  Users,
  Heart,
  MessageSquare,
  Star,
  Calendar,
  Flame,
  Settings,
  Edit,
} from "lucide-react";
import { formatReadingTime } from "@/hooks/useReadingProgress";
import { formatDistanceToNow } from "date-fns";

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { profile, stats, activities, loading, isOwnProfile } = useUserProfile(userId);
  const { achievements, definitions } = useAchievements();
  const { streak } = useStreaks();
  const { wishlist } = useWishlist();
  const { books } = useBooks();

  // If no userId provided, show current user's profile
  const targetUserId = userId || currentUser?.id;

  if (!targetUserId && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const getInitials = (name: string | null, username: string) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return username.slice(0, 2).toUpperCase();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "review": return <Star className="h-4 w-4 text-yellow-500" />;
      case "reading_progress": return <BookOpen className="h-4 w-4 text-blue-500" />;
      case "forum_post": return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "achievement": return <Trophy className="h-4 w-4 text-amber-500" />;
      case "book_purchase": return <Heart className="h-4 w-4 text-pink-500" />;
      default: return <BookOpen className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityText = (activity: { activity_type: string; metadata: Record<string, unknown> }) => {
    const meta = activity.metadata as Record<string, string>;
    switch (activity.activity_type) {
      case "review":
        return `Reviewed "${meta.book_title || "a book"}"`;
      case "reading_progress":
        return `Reading "${meta.book_title || "a book"}" - ${meta.progress || 0}% complete`;
      case "forum_post":
        return `Posted in forum: "${meta.title || "New discussion"}"`;
      case "achievement":
        return `Earned achievement: ${meta.achievement_name || "New badge"}`;
      case "book_purchase":
        return `Purchased "${meta.book_title || "a book"}"`;
      default:
        return "Recent activity";
    }
  };

  const wishlistBooks = books.filter(book => wishlist.some(w => w.book_id === book.id));

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <ProfileSkeleton />
        ) : profile ? (
          <>
            {/* Profile Header */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <Avatar className="h-24 w-24 md:h-32 md:w-32">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl md:text-3xl bg-primary/10 text-primary">
                      {getInitials(profile.full_name, profile.username)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold">
                        {profile.full_name || profile.username}
                      </h1>
                      {streak && streak.current_streak > 0 && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Flame className="h-4 w-4 text-orange-500" />
                          {streak.current_streak} day streak
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-3">@{profile.username}</p>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {stats.followersCount} followers
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {stats.followingCount} following
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        {stats.achievementsCount} achievements
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className="flex justify-center md:justify-start gap-2">
                      {isOwnProfile ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Profile
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => navigate("/settings")}>
                            <Settings className="h-4 w-4 mr-1" />
                            Settings
                          </Button>
                        </>
                      ) : (
                        <FollowButton targetUserId={profile.id} size="default" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Books Started</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBooksStarted}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBooksCompleted}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Time Reading</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatReadingTime(stats.totalTimeSpentSeconds)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.averageProgress.toFixed(0)}%
                  </div>
                  <Progress value={stats.averageProgress} className="mt-2 h-2" />
                </CardContent>
              </Card>
            </div>

            {/* Tabbed Content */}
            <Tabs defaultValue="activity" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      {isOwnProfile ? "Your" : `${profile.username}'s`} recent reading activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      {activities.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="font-medium">No activity yet</p>
                          <p className="text-sm mt-1">Start reading to build your activity history!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activities.map((activity) => (
                            <div
                              key={activity.id}
                              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                            >
                              <div className="mt-1">
                                {getActivityIcon(activity.activity_type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                  {getActivityText(activity)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievements">
                <AchievementsDisplay showLocked={isOwnProfile} />
              </TabsContent>

              <TabsContent value="favorites">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Wishlist & Favorites
                    </CardTitle>
                    <CardDescription>
                      {isOwnProfile ? "Books you've saved" : "This user's favorite books"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isOwnProfile ? (
                      wishlistBooks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="font-medium">No favorites yet</p>
                          <p className="text-sm mt-1">Browse books and add them to your wishlist!</p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => navigate("/books")}
                          >
                            Browse Books
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {wishlistBooks.slice(0, 8).map((book) => (
                            <div
                              key={book.id}
                              className="group cursor-pointer"
                              onClick={() => navigate(`/books?search=${encodeURIComponent(book.title)}`)}
                            >
                              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
                                <img
                                  src={book.cover}
                                  alt={book.title}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                              </div>
                              <p className="text-sm font-medium line-clamp-2">{book.title}</p>
                              <p className="text-xs text-muted-foreground">{book.author}</p>
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">Favorites are private</p>
                        <p className="text-sm mt-1">This user's favorites are not publicly visible</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Reviews
                    </CardTitle>
                    <CardDescription>
                      Book reviews written by {isOwnProfile ? "you" : profile.username}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activities.filter(a => a.activity_type === "review").length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No reviews yet</p>
                        <p className="text-sm mt-1">
                          {isOwnProfile 
                            ? "Share your thoughts on books you've read!" 
                            : "This user hasn't written any reviews yet"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activities
                          .filter(a => a.activity_type === "review")
                          .map((activity) => {
                            const meta = activity.metadata as Record<string, unknown>;
                            return (
                              <div
                                key={activity.id}
                                className="p-4 rounded-lg border bg-card"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold">{String(meta.book_title || "Book Review")}</h4>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < Number(meta.rating || 0)
                                            ? "text-yellow-500 fill-yellow-500"
                                            : "text-muted-foreground"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {String(meta.content || "No review content")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">User not found</h1>
            <p className="text-muted-foreground mb-4">This profile doesn't exist or has been removed.</p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

const ProfileSkeleton = () => (
  <div className="space-y-8">
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default ProfilePage;
