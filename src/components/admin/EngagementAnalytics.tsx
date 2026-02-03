import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3,
  Users,
  Eye,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  BookOpen,
  MessageSquare,
  Heart,
  Star,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface DailyStats {
  date: string;
  submissions: number;
  comments: number;
  likes: number;
  reviews: number;
  pageViews: number;
}

interface UserEngagement {
  userId: string;
  username: string;
  avatarUrl: string | null;
  submissions: number;
  comments: number;
  lastActive: string;
}

interface ContentMetrics {
  totalSubmissions: number;
  totalComments: number;
  totalLikes: number;
  totalReviews: number;
  averageRating: number;
  topContentTypes: { type: string; count: number }[];
}

export const EngagementAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<"7" | "30" | "90">("30");
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [topUsers, setTopUsers] = useState<UserEngagement[]>([]);
  const [contentMetrics, setContentMetrics] = useState<ContentMetrics>({
    totalSubmissions: 0,
    totalComments: 0,
    totalLikes: 0,
    totalReviews: 0,
    averageRating: 0,
    topContentTypes: [],
  });

  const fetchAnalytics = async () => {
    try {
      const days = parseInt(dateRange);
      const startDate = subDays(new Date(), days);
      const endDate = new Date();

      // Fetch submissions in date range
      const { data: submissions } = await supabase
        .from("user_submissions")
        .select("id, user_id, content_type, created_at, status")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      // Fetch all submission comments
      const { data: comments } = await supabase
        .from("submission_comments")
        .select("id, user_id, created_at")
        .gte("created_at", startDate.toISOString());

      // Fetch reviews
      const { data: reviews } = await supabase
        .from("reviews")
        .select("id, user_id, rating, created_at")
        .gte("created_at", startDate.toISOString());

      // Fetch profiles for top users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, updated_at");

      // Calculate daily stats
      const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });
      const dailyData: DailyStats[] = dateInterval.map((date) => {
        const dayStart = startOfDay(date).toISOString();
        const dayEnd = endOfDay(date).toISOString();

        const daySubmissions = submissions?.filter(
          (s) => s.created_at >= dayStart && s.created_at <= dayEnd
        ).length || 0;

        const dayComments = comments?.filter(
          (c) => c.created_at >= dayStart && c.created_at <= dayEnd
        ).length || 0;

        const dayReviews = reviews?.filter(
          (r) => r.created_at >= dayStart && r.created_at <= dayEnd
        ).length || 0;

        return {
          date: format(date, "MMM dd"),
          submissions: daySubmissions,
          comments: dayComments,
          likes: 0, // Would need likes table
          reviews: dayReviews,
          pageViews: Math.floor(Math.random() * 100) + 50, // Placeholder
        };
      });

      setDailyStats(dailyData);

      // Calculate content metrics
      const contentTypeCounts = new Map<string, number>();
      submissions?.forEach((s) => {
        const count = contentTypeCounts.get(s.content_type) || 0;
        contentTypeCounts.set(s.content_type, count + 1);
      });

      const topContentTypes = Array.from(contentTypeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      const avgRating =
        reviews && reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
          : 0;

      setContentMetrics({
        totalSubmissions: submissions?.length || 0,
        totalComments: comments?.length || 0,
        totalLikes: 0,
        totalReviews: reviews?.length || 0,
        averageRating: avgRating,
        topContentTypes,
      });

      // Calculate top users
      const userActivity = new Map<string, { submissions: number; comments: number }>();
      submissions?.forEach((s) => {
        const current = userActivity.get(s.user_id) || { submissions: 0, comments: 0 };
        current.submissions++;
        userActivity.set(s.user_id, current);
      });
      comments?.forEach((c) => {
        const current = userActivity.get(c.user_id) || { submissions: 0, comments: 0 };
        current.comments++;
        userActivity.set(c.user_id, current);
      });

      const topUserData: UserEngagement[] = Array.from(userActivity.entries())
        .map(([userId, activity]) => {
          const profile = profiles?.find((p) => p.id === userId);
          return {
            userId,
            username: profile?.username || "Unknown",
            avatarUrl: profile?.avatar_url,
            submissions: activity.submissions,
            comments: activity.comments,
            lastActive: profile?.updated_at || "",
          };
        })
        .sort((a, b) => b.submissions + b.comments - (a.submissions + a.comments))
        .slice(0, 10);

      setTopUsers(topUserData);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const maxDaily = Math.max(...dailyStats.map((d) => d.submissions + d.comments + d.reviews), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">User Engagement Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Track user activity and content performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentMetrics.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              In the last {dateRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentMetrics.totalComments}</div>
            <p className="text-xs text-muted-foreground">Community discussions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentMetrics.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              Avg rating: {contentMetrics.averageRating.toFixed(1)} ⭐
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topUsers.length}</div>
            <p className="text-xs text-muted-foreground">Contributing members</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Daily Activity</TabsTrigger>
          <TabsTrigger value="content">Content Types</TabsTrigger>
          <TabsTrigger value="users">Top Contributors</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Daily Activity Chart
              </CardTitle>
              <CardDescription>Submissions, comments, and reviews over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dailyStats.slice(-14).map((day, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-16 text-xs text-muted-foreground">{day.date}</div>
                    <div className="flex-1 flex items-center gap-1">
                      <div
                        className="h-4 bg-primary rounded-sm transition-all"
                        style={{
                          width: `${(day.submissions / maxDaily) * 100}%`,
                          minWidth: day.submissions > 0 ? "4px" : "0",
                        }}
                        title={`${day.submissions} submissions`}
                      />
                      <div
                        className="h-4 bg-accent rounded-sm transition-all"
                        style={{
                          width: `${(day.comments / maxDaily) * 100}%`,
                          minWidth: day.comments > 0 ? "4px" : "0",
                        }}
                        title={`${day.comments} comments`}
                      />
                      <div
                        className="h-4 bg-secondary rounded-sm transition-all"
                        style={{
                          width: `${(day.reviews / maxDaily) * 100}%`,
                          minWidth: day.reviews > 0 ? "4px" : "0",
                        }}
                        title={`${day.reviews} reviews`}
                      />
                    </div>
                    <div className="w-20 text-xs text-right">
                      {day.submissions + day.comments + day.reviews} total
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-sm" />
                  Submissions
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-accent rounded-sm" />
                  Comments
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-secondary rounded-sm" />
                  Reviews
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Breakdown</CardTitle>
              <CardDescription>Distribution of content types</CardDescription>
            </CardHeader>
            <CardContent>
              {contentMetrics.topContentTypes.length > 0 ? (
                <div className="space-y-4">
                  {contentMetrics.topContentTypes.map((item, index) => (
                    <div key={item.type} className="flex items-center gap-4">
                      <Badge variant="outline" className="w-24 justify-center capitalize">
                        {item.type}
                      </Badge>
                      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{
                            width: `${(item.count / contentMetrics.totalSubmissions) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="w-16 text-right text-sm font-medium">
                        {item.count} ({((item.count / contentMetrics.totalSubmissions) * 100).toFixed(0)}%)
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No content data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Contributors
              </CardTitle>
              <CardDescription>Most active community members</CardDescription>
            </CardHeader>
            <CardContent>
              {topUsers.length > 0 ? (
                <div className="space-y-3">
                  {topUsers.map((user, index) => (
                    <div
                      key={user.userId}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{user.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.submissions} submissions • {user.comments} comments
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">
                          {user.submissions + user.comments} total
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No user activity data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
