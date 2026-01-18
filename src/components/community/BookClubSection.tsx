import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Plus, Users, BookOpen, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBookClubs } from '@/hooks/useBookClubs';
import { BookClubCard } from './BookClubCard';

export const BookClubSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clubs, myClubs, loading, createClub, joinClub, leaveClub } = useBookClubs();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  // Create club form
  const [newClubName, setNewClubName] = useState('');
  const [newClubDescription, setNewClubDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateClub = async () => {
    if (!newClubName.trim()) return;

    setIsCreating(true);
    const clubId = await createClub(newClubName.trim(), newClubDescription.trim(), isPrivate);
    setIsCreating(false);

    if (clubId) {
      setShowCreateDialog(false);
      setNewClubName('');
      setNewClubDescription('');
      setIsPrivate(false);
    }
  };

  const filteredClubs = (activeTab === 'my' ? myClubs : clubs).filter(
    (club) =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewClub = (clubId: string) => {
    navigate(`/community/club/${clubId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Book Clubs
          </h2>
          <p className="text-muted-foreground">
            Join a club or create your own to discuss books with fellow readers
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                if (!user) {
                  navigate('/auth');
                  return;
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Club
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a Book Club</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="club-name">Club Name</Label>
                <Input
                  id="club-name"
                  placeholder="e.g., Fantasy Book Lovers"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="club-description">Description</Label>
                <Textarea
                  id="club-description"
                  placeholder="What's your club about?"
                  value={newClubDescription}
                  onChange={(e) => setNewClubDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="private-toggle">Private Club</Label>
                  <p className="text-sm text-muted-foreground">
                    Only visible to members
                  </p>
                </div>
                <Switch
                  id="private-toggle"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
              </div>
              <Button
                onClick={handleCreateClub}
                disabled={!newClubName.trim() || isCreating}
                className="w-full"
              >
                {isCreating ? 'Creating...' : 'Create Club'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'all' | 'my')}
          className="w-full md:w-auto"
        >
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <BookOpen className="h-4 w-4" />
              All Clubs ({clubs.length})
            </TabsTrigger>
            <TabsTrigger value="my" className="gap-2">
              <Users className="h-4 w-4" />
              My Clubs ({myClubs.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clubs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Clubs Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredClubs.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold mb-2">
            {activeTab === 'my' ? 'No clubs joined yet' : 'No clubs found'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {activeTab === 'my'
              ? 'Join a book club to start discussing with other readers'
              : 'Be the first to create a book club!'}
          </p>
          {activeTab === 'my' && (
            <Button variant="outline" onClick={() => setActiveTab('all')}>
              Browse Clubs
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClubs.map((club, index) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <BookClubCard
                club={club}
                onJoin={joinClub}
                onLeave={leaveClub}
                onView={handleViewClub}
                isOwner={club.owner_id === user?.id}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
