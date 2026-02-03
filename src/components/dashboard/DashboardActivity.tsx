import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActivityFeed, Activity } from "@/hooks/useActivityFeed";
import { Activity as ActivityIcon, BookOpen, Trophy, MessageSquare, Heart, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";

const activityIcons: Record<string, React.ElementType> = {
  book_started: BookOpen,
  book_completed: Trophy,
  reading_progress: BookOpen,
  review: MessageSquare,
  forum_post: MessageSquare,
  submission_created: MessageSquare,
  submission_liked: Heart,
  club_joined: Users,
  achievement: Trophy,
  book_purchase: BookOpen,
  default: ActivityIcon,
};

const activityColors: Record<string, string> = {
  book_started: "bg-blue-500/10 text-blue-500",
  book_completed: "bg-green-500/10 text-green-500",
  reading_progress: "bg-blue-500/10 text-blue-500",
  review: "bg-purple-500/10 text-purple-500",
  forum_post: "bg-purple-500/10 text-purple-500",
  submission_created: "bg-purple-500/10 text-purple-500",
  submission_liked: "bg-pink-500/10 text-pink-500",
  club_joined: "bg-indigo-500/10 text-indigo-500",
  achievement: "bg-yellow-500/10 text-yellow-500",
  book_purchase: "bg-teal-500/10 text-teal-500",
  default: "bg-muted text-muted-foreground",
};

export const DashboardActivity = () => {
  const { user } = useAuth();
  const { activities, loading } = useActivityFeed("all");

  const recentActivities = activities.slice(0, 10);

  const getActivityMessage = (activity: Activity) => {
    const metadata = activity.metadata || {};
    switch (activity.activityType) {
      case "reading_progress":
        return `Made progress on "${metadata.book_title || "a book"}"`;
      case "review":
        return `Left a review on "${metadata.book_title || "a book"}"`;
      case "forum_post":
        return `Posted in the forum`;
      case "achievement":
        return `Earned the "${metadata.achievement_name || "Achievement"}" badge`;
      case "book_purchase":
        return `Purchased "${metadata.book_title || "a book"}"`;
      default:
        return "Had some activity";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/4 bg-muted rounded" />
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
          <ActivityIcon className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentActivities.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Start reading, join discussions, or create submissions to see your activity here"
            type="generic"
          />
        ) : (
          <div className="space-y-4">
            {recentActivities.map((activity, index) => {
              const Icon = activityIcons[activity.activityType] || activityIcons.default;
              const colorClass = activityColors[activity.activityType] || activityColors.default;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      {getActivityMessage(activity)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
