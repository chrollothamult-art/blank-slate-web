import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, Clock, Sword } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface ActiveSessionInfo {
  id: string;
  campaign_title: string;
  campaign_genre: string;
  character_name: string;
  character_portrait: string | null;
  last_played_at: string;
}

export const QuickResumeBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ActiveSessionInfo[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchActiveSessions = async () => {
      const { data: sessionData } = await supabase
        .from("rp_sessions")
        .select(`
          id,
          last_played_at,
          campaign:rp_campaigns(title, genre)
        `)
        .eq("created_by", user.id)
        .eq("status", "active")
        .order("last_played_at", { ascending: false })
        .limit(3);

      if (!sessionData || sessionData.length === 0) return;

      // Fetch participant characters for these sessions
      const sessionIds = sessionData.map(s => s.id);
      const { data: participants } = await supabase
        .from("rp_session_participants")
        .select(`
          session_id,
          character:rp_characters(name, portrait_url)
        `)
        .in("session_id", sessionIds);

      const participantMap = new Map<string, { name: string; portrait_url: string | null }>();
      participants?.forEach(p => {
        const char = p.character as unknown as { name: string; portrait_url: string | null } | null;
        if (char && !participantMap.has(p.session_id)) {
          participantMap.set(p.session_id, char);
        }
      });

      const mapped: ActiveSessionInfo[] = sessionData.map(s => {
        const campaign = s.campaign as unknown as { title: string; genre: string } | null;
        const char = participantMap.get(s.id);
        return {
          id: s.id,
          campaign_title: campaign?.title || "Unknown Campaign",
          campaign_genre: campaign?.genre || "adventure",
          character_name: char?.name || "Your Character",
          character_portrait: char?.portrait_url || null,
          last_played_at: s.last_played_at,
        };
      });

      setSessions(mapped);
    };

    fetchActiveSessions();
  }, [user]);

  if (!user || sessions.length === 0 || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={() => setDismissed(true)}
        >
          <X className="h-3 w-3" />
        </Button>

        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-primary">
          <Play className="h-4 w-4" />
          Continue Your Adventure
        </div>

        <div className="space-y-2">
          {sessions.map(session => (
            <motion.div
              key={session.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer group"
              onClick={() => navigate(`/lore-chronicles/play/${session.id}`)}
              whileHover={{ x: 4 }}
            >
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={session.character_portrait || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Sword className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{session.campaign_title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{session.character_name}</span>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {session.campaign_genre}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(session.last_played_at), { addSuffix: true })}
                </span>
                <Button
                  size="sm"
                  className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="h-3 w-3" />
                  Continue
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
