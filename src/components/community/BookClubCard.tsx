import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Lock, BookOpen, UserPlus, LogOut } from 'lucide-react';
import { BookClub } from '@/hooks/useBookClubs';

interface BookClubCardProps {
  club: BookClub;
  onJoin: (clubId: string) => void;
  onLeave: (clubId: string) => void;
  onView: (clubId: string) => void;
  isOwner: boolean;
}

export const BookClubCard = ({
  club,
  onJoin,
  onLeave,
  onView,
  isOwner,
}: BookClubCardProps) => {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-lg truncate">{club.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {club.description || 'No description'}
              </p>
            </div>
            {club.is_private && (
              <Badge variant="secondary" className="shrink-0">
                <Lock className="h-3 w-3 mr-1" />
                Private
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {club.members_count} member{club.members_count !== 1 ? 's' : ''}
            </span>
            <span>by {club.owner_username}</span>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(club.id)}
              className="flex-1"
            >
              View Club
            </Button>
            {!isOwner && (
              <>
                {club.is_member ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLeave(club.id)}
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Leave
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onJoin(club.id)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Join
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
