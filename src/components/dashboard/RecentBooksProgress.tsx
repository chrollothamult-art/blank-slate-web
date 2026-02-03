import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useReadingProgress, formatReadingTime } from "@/hooks/useReadingProgress";
import { useBooks } from "@/contexts/BooksContext";
import { BookOpen, Clock, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";

export const RecentBooksProgress = () => {
  const { allProgress, loading } = useReadingProgress();
  const { books } = useBooks();

  const recentProgress = allProgress.slice(0, 5);

  const getBookDetails = (bookId: string) => {
    return books.find((b) => b.id === bookId);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Recent Reading
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-20 w-14 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                  <div className="h-2 w-full bg-muted rounded" />
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Recent Reading
        </CardTitle>
        <Link to="/my-books">
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {recentProgress.length === 0 ? (
          <EmptyState
            title="No reading progress yet"
            description="Start reading a book to track your progress here"
            type="books"
            action={{
              label: "Browse Books",
              onClick: () => window.location.href = "/books"
            }}
          />
        ) : (
          <div className="space-y-4">
            {recentProgress.map((progress, index) => {
              const book = getBookDetails(progress.book_id);
              if (!book) return null;

              const coverUrl = book.cover;

              return (
                <motion.div
                  key={progress.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  {/* Book Cover */}
                  <div className="h-20 w-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={book.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                      {book.title}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {book.author}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Page {progress.current_page} of {progress.total_pages}</span>
                        <span>{Math.round(progress.progress_percentage)}%</span>
                      </div>
                      <Progress 
                        value={progress.progress_percentage} 
                        className="h-2"
                      />
                    </div>

                    {/* Meta Info */}
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatReadingTime(progress.time_spent_seconds)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(progress.last_read_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>

                  {/* Completion Badge */}
                  {progress.completed && (
                    <div className="flex-shrink-0">
                      <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-full">
                        Completed
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
