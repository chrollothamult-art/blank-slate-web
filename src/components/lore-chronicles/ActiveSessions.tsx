import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Clock, BookOpen, Trash2, User, RotateCcw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useLoreChronicles, RpSession } from "@/hooks/useLoreChronicles";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const ActiveSessions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessions, loading, refetchSessions } = useLoreChronicles();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sessionTab, setSessionTab] = useState("active");

  const handleDeleteSession = async () => {
    if (!deleteId) return;
    setDeleting(true);

    // Delete related data first
    await supabase.from("rp_character_progress").delete().eq("session_id", deleteId);
    await supabase.from("rp_session_participants").delete().eq("session_id", deleteId);
    
    const { error } = await supabase.from("rp_sessions").delete().eq("id", deleteId);
    
    if (error) {
      toast({ title: "Failed to delete session", variant: "destructive" });
    } else {
      toast({ title: "Session deleted" });
      refetchSessions();
    }
    
    setDeleting(false);
    setDeleteId(null);
  };

  if (!user) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
          <p className="text-muted-foreground mb-4">Sign in to view your active sessions</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-3/4 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const activeSessions = sessions.filter(s => s.status === "active");
  const completedSessions = sessions.filter(s => s.status === "completed");

  if (sessions.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Sessions Yet</h3>
          <p className="text-muted-foreground mb-4">Start a campaign to begin your adventure</p>
          <Button onClick={() => navigate('/lore-chronicles')} className="gap-2">
            <Plus className="h-4 w-4" />
            Browse Campaigns
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={() => navigate('/lore-chronicles')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Start New Adventure
        </Button>
      </div>

      {/* Session Tabs */}
      <Tabs value={sessionTab} onValueChange={setSessionTab}>
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <Play className="h-4 w-4" />
            Active ({activeSessions.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Completed ({completedSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeSessions.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <p className="text-muted-foreground">No active sessions. Start a new campaign!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {activeSessions.map((session, index) => (
                <SessionCard 
                  key={session.id} 
                  session={session} 
                  index={index} 
                  onDelete={() => setDeleteId(session.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedSessions.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <p className="text-muted-foreground">No completed sessions yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {completedSessions.map((session, index) => (
                <SessionCard 
                  key={session.id} 
                  session={session} 
                  index={index} 
                  onDelete={() => setDeleteId(session.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Session"
        description="Are you sure you want to delete this session? Your progress will be lost."
        confirmText={deleting ? "Deleting..." : "Delete"}
        variant="danger"
        onConfirm={handleDeleteSession}
      />
    </div>
  );
};

interface SessionCardProps {
  session: RpSession;
  index: number;
  onDelete: () => void;
}

const SessionCard = ({ session, index, onDelete }: SessionCardProps) => {
  const navigate = useNavigate();
  const isActive = session.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`${!isActive ? "opacity-80" : ""} hover:border-primary/40 transition-colors group`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {session.campaign?.title || "Unknown Campaign"}
                {isActive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                {session.campaign?.genre && (
                  <Badge variant="outline" className="text-xs">
                    {session.campaign.genre}
                  </Badge>
                )}
                <span className="capitalize">{session.mode} Mode</span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "In Progress" : "Completed"}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(session.last_played_at), { addSuffix: true })}
            </span>
            {session.completed_at && (
              <span className="text-primary">
                Completed {formatDistanceToNow(new Date(session.completed_at), { addSuffix: true })}
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          {isActive ? (
            <Button onClick={() => navigate(`/lore-chronicles/session/${session.id}`)}>
              <Play className="h-4 w-4 mr-2" />
              Continue Adventure
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate(`/lore-chronicles/session/${session.id}`)}>
                View Summary
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate(`/lore-chronicles/play/${session.campaign_id}`)}
                className="gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                Replay
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};
