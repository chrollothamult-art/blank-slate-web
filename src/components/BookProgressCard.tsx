import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, Clock, CheckCircle } from "lucide-react";
import { ReadingProgress, formatReadingTime } from "@/hooks/useReadingProgress";
import { formatDistanceToNow } from "date-fns";

interface Purchase {
  id: string;
  book_id: string;
  book_title: string;
  book_author: string;
  book_cover_url: string | null;
  book_version: string;
  price: number;
  purchased_at: string;
  ebook_pdf_url?: string | null;
}

interface BookProgressCardProps {
  purchase: Purchase;
  progress?: ReadingProgress;
  onRead: () => void;
}

export const BookProgressCard = ({ purchase, progress, onRead }: BookProgressCardProps) => {
  const isEbook = purchase.book_version === "ebook" && purchase.ebook_pdf_url;
  const progressPercent = progress?.progress_percentage ?? 0;
  const isCompleted = progress?.completed ?? false;

  return (
    <Card 
      className={`overflow-hidden hover:shadow-lg transition-shadow ${isEbook ? 'cursor-pointer' : ''}`}
      onClick={() => isEbook && onRead()}
    >
      <div className="aspect-[2/3] relative bg-muted">
        {purchase.book_cover_url ? (
          <img
            src={purchase.book_cover_url}
            alt={purchase.book_title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        
        {/* Progress overlay for ebooks */}
        {isEbook && (
          <>
            {/* Completed badge */}
            {isCompleted && (
              <Badge className="absolute top-2 right-2 bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
            
            {/* Progress bar at bottom */}
            {progress && !isCompleted && (
              <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur px-2 py-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{progressPercent.toFixed(0)}% complete</span>
                  <span>Page {progress.current_page}/{progress.total_pages}</span>
                </div>
                <Progress value={progressPercent} className="h-1" />
              </div>
            )}
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
              <Button
                variant="secondary"
                size="sm"
                className="bg-background/90 backdrop-blur pointer-events-none"
              >
                <FileText className="h-4 w-4 mr-2" />
                {progress && progress.current_page > 1 ? 'Continue Reading' : 'Start Reading'}
              </Button>
            </div>
          </>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-2 text-base">{purchase.book_title}</CardTitle>
        <CardDescription>{purchase.book_author}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="capitalize">Version: {purchase.book_version}</p>
          
          {/* Reading stats for ebooks */}
          {isEbook && progress && (
            <div className="flex items-center gap-4 pt-2 border-t">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatReadingTime(progress.time_spent_seconds)}</span>
              </div>
              {progress.last_read_at && (
                <span className="text-xs">
                  Last read {formatDistanceToNow(new Date(progress.last_read_at), { addSuffix: true })}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
