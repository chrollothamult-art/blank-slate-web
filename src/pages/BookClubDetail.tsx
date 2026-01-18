import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Users,
  BookOpen,
  MessageSquare,
  Plus,
  Crown,
  UserPlus,
  LogOut,
  Settings,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DiscussionReplySection } from '@/components/community/DiscussionReplySection';
import { useAuth } from '@/contexts/AuthContext';
import { useBookClubDetails } from '@/hooks/useBookClubs';
import { useBookClubs } from '@/hooks/useBookClubs';
import { Footer } from '@/components/Footer';
import { formatDistanceToNow } from 'date-fns';

export const BookClubDetail = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { club, members, discussions, loading, createDiscussion, refetch } = useBookClubDetails(clubId || null);
  const { joinClub, leaveClub, deleteClub } = useBookClubs();

  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newChapter, setNewChapter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedDiscussion, setExpandedDiscussion] = useState<string | null>(null);

  const isOwner = club?.owner_id === user?.id;
  const isMember = club?.is_member;

  const handleCreateDiscussion = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    await createDiscussion(newTitle.trim(), newContent.trim(), newChapter.trim() || undefined);
    setIsSubmitting(false);
    setShowNewDiscussion(false);
    setNewTitle('');
    setNewContent('');
    setNewChapter('');
  };

  const handleJoin = async () => {
    if (clubId) {
      await joinClub(clubId);
      refetch();
    }
  };

  const handleLeave = async () => {
    if (clubId && confirm('Are you sure you want to leave this club?')) {
      await leaveClub(clubId);
      navigate('/community');
    }
  };

  const handleDelete = async () => {
    if (clubId && confirm('Are you sure you want to delete this club? This cannot be undone.')) {
      await deleteClub(clubId);
      navigate('/community');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-48 w-full mb-6" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-64 md:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Club not found</h2>
          <p className="text-muted-foreground mb-4">This book club doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate('/community')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate('/community')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
                <BookOpen className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
                <p className="text-muted-foreground max-w-2xl">
                  {club.description || 'No description provided'}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {discussions.length} discussion{discussions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {!isMember && !isOwner && (
                    <Button onClick={handleJoin}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Club
                    </Button>
                  )}
                  {isMember && !isOwner && (
                    <Button variant="outline" onClick={handleLeave}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Leave
                    </Button>
                  )}
                  {isOwner && (
                    <Button variant="destructive" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Club
                    </Button>
                  )}
                </>
              ) : (
                <Button onClick={() => navigate('/auth')}>
                  Sign in to Join
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content - Discussions */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Discussions
              </h2>
              {isMember && (
                <Dialog open={showNewDiscussion} onOpenChange={setShowNewDiscussion}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Discussion
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start a Discussion</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          placeholder="Discussion title..."
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Chapter (optional)</label>
                        <Input
                          placeholder="e.g., Chapter 5"
                          value={newChapter}
                          onChange={(e) => setNewChapter(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Content</label>
                        <Textarea
                          placeholder="What do you want to discuss?"
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                          rows={5}
                        />
                      </div>
                      <Button
                        onClick={handleCreateDiscussion}
                        disabled={!newTitle.trim() || !newContent.trim() || isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? 'Posting...' : 'Post Discussion'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {discussions.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
                <p className="text-muted-foreground">
                  {isMember
                    ? 'Be the first to start a discussion!'
                    : 'Join this club to participate in discussions.'}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {discussions.filter(d => !d.chapter?.startsWith('reply:')).map((discussion, index) => (
                  <motion.div
                    key={discussion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={discussion.author_avatar || undefined} />
                          <AvatarFallback>
                            {discussion.author_username?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold">{discussion.title}</h3>
                              {discussion.chapter && !discussion.chapter.startsWith('reply:') && (
                                <Badge variant="secondary" className="mt-1">
                                  {discussion.chapter}
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedDiscussion(
                                expandedDiscussion === discussion.id ? null : discussion.id
                              )}
                            >
                              {expandedDiscussion === discussion.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                            {discussion.content}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span>{discussion.author_username}</span>
                            <span>
                              {formatDistanceToNow(new Date(discussion.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setExpandedDiscussion(
                                expandedDiscussion === discussion.id ? null : discussion.id
                              )}
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Reply
                            </Button>
                          </div>

                          {/* Reply Section */}
                          {expandedDiscussion === discussion.id && (
                            <DiscussionReplySection
                              discussionId={discussion.id}
                              clubId={clubId || ''}
                            />
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Members */}
          <div className="space-y-6">
            <Card className="p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Users className="h-5 w-5" />
                Members ({members.length})
              </h3>
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                    onClick={() => navigate(`/profile/${member.user_id}`)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.username?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.username}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                    </div>
                    {member.role === 'owner' && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Club Info */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">About This Club</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Created {formatDistanceToNow(new Date(club.created_at), { addSuffix: true })}</p>
                {club.is_private && (
                  <Badge variant="secondary">Private Club</Badge>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BookClubDetail;
