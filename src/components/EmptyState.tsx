import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Users, 
  MessageSquare, 
  Search, 
  FileText, 
  Heart,
  Image,
  Bell,
  Bookmark,
  Star
} from "lucide-react";

type EmptyStateType = 
  | "books" 
  | "community" 
  | "messages" 
  | "search" 
  | "submissions"
  | "wishlist"
  | "gallery"
  | "notifications"
  | "bookmarks"
  | "reviews"
  | "generic";

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  className?: string;
}

const typeConfig: Record<EmptyStateType, { icon: ReactNode; title: string; description: string }> = {
  books: {
    icon: <BookOpen className="h-12 w-12" />,
    title: "No books yet",
    description: "Start your reading journey by exploring our collection.",
  },
  community: {
    icon: <Users className="h-12 w-12" />,
    title: "No community posts",
    description: "Be the first to share something with the community!",
  },
  messages: {
    icon: <MessageSquare className="h-12 w-12" />,
    title: "No messages",
    description: "Start a conversation with other readers.",
  },
  search: {
    icon: <Search className="h-12 w-12" />,
    title: "No results found",
    description: "Try adjusting your search or filters.",
  },
  submissions: {
    icon: <FileText className="h-12 w-12" />,
    title: "No submissions yet",
    description: "Share your fan art, theories, or stories with the community.",
  },
  wishlist: {
    icon: <Heart className="h-12 w-12" />,
    title: "Your wishlist is empty",
    description: "Save books you'd like to read later.",
  },
  gallery: {
    icon: <Image className="h-12 w-12" />,
    title: "No images",
    description: "Upload images to create a gallery.",
  },
  notifications: {
    icon: <Bell className="h-12 w-12" />,
    title: "No notifications",
    description: "You're all caught up!",
  },
  bookmarks: {
    icon: <Bookmark className="h-12 w-12" />,
    title: "No bookmarks",
    description: "Save your favorite pages while reading.",
  },
  reviews: {
    icon: <Star className="h-12 w-12" />,
    title: "No reviews yet",
    description: "Be the first to share your thoughts on this book.",
  },
  generic: {
    icon: <FileText className="h-12 w-12" />,
    title: "Nothing here yet",
    description: "Content will appear here once available.",
  },
};

export const EmptyState = ({ 
  type = "generic",
  title,
  description,
  action,
  icon,
  className = ""
}: EmptyStateProps) => {
  const config = typeConfig[type];
  
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="relative mb-6">
        {/* Decorative background circle */}
        <div className="absolute inset-0 bg-primary/5 rounded-full scale-150 blur-xl" />
        
        {/* Icon container */}
        <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-muted/50 text-muted-foreground">
          {icon || config.icon}
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title || config.title}
      </h3>
      
      <p className="text-muted-foreground max-w-sm mb-6">
        {description || config.description}
      </p>
      
      {action && (
        <Button onClick={action.onClick} className="rounded-full">
          {action.label}
        </Button>
      )}
    </div>
  );
};
