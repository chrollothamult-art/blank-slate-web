import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLoreChronicles, RpCharacter } from "@/hooks/useLoreChronicles";
import { toast } from "@/hooks/use-toast";

interface JoinSessionDialogProps {
  trigger?: React.ReactNode;
}

export const JoinSessionDialog = ({ trigger }: JoinSessionDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { characters } = useLoreChronicles();
  const [open, setOpen] = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState<RpCharacter | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"code" | "character">("code");
  const [foundSession, setFoundSession] = useState<any>(null);

  const handleCodeSubmit = async () => {
    if (!sessionCode.trim() || sessionCode.length !== 6) {
      toast({ title: "Please enter a valid 6-character code", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    const { data: session, error } = await supabase
      .from("rp_sessions")
      .select(`
        *,
        campaign:rp_campaigns(title, description, genre)
      `)
      .eq("session_code", sessionCode.toUpperCase())
      .eq("status", "active")
      .single();

    if (error || !session) {
      toast({ title: "Session not found or no longer active", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Check if already in session
    const { data: existingParticipant } = await supabase
      .from("rp_session_participants")
      .select("*")
      .eq("session_id", session.id)
      .in("character_id", characters.map(c => c.id));

    if (existingParticipant && existingParticipant.length > 0) {
      // Already in session, just navigate
      navigate(`/lore-chronicles/session/${session.id}`);
      setOpen(false);
      return;
    }

    // Check max players
    const { data: currentParticipants } = await supabase
      .from("rp_session_participants")
      .select("id")
      .eq("session_id", session.id);

    if ((currentParticipants?.length || 0) >= (session.max_players || 4)) {
      toast({ title: "Session is full", variant: "destructive" });
      setLoading(false);
      return;
    }

    setFoundSession(session);
    setStep("character");
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!selectedCharacter || !foundSession || !user) return;
    
    setLoading(true);

    // Add participant
    const { error: participantError } = await supabase
      .from("rp_session_participants")
      .insert({
        session_id: foundSession.id,
        character_id: selectedCharacter.id
      });

    if (participantError) {
      toast({ title: "Failed to join session", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Create progress
    await supabase.from("rp_character_progress").insert({
      session_id: foundSession.id,
      character_id: selectedCharacter.id,
      current_node_id: foundSession.current_node_id,
      stats_snapshot: selectedCharacter.stats as unknown as Record<string, number>,
      nodes_visited: foundSession.current_node_id ? [foundSession.current_node_id] : []
    });

    // Add system message
    await supabase.from("rp_session_messages").insert({
      session_id: foundSession.id,
      user_id: user.id,
      message_type: "system",
      content: `${selectedCharacter.name} has joined the adventure!`
    });

    toast({ title: "Joined session!", description: `Welcome to the adventure, ${selectedCharacter.name}!` });
    navigate(`/lore-chronicles/session/${foundSession.id}`);
    setOpen(false);
  };

  const resetDialog = () => {
    setStep("code");
    setSessionCode("");
    setSelectedCharacter(null);
    setFoundSession(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            Join Session
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "code" ? "Join a Session" : "Select Your Character"}
          </DialogTitle>
          <DialogDescription>
            {step === "code" 
              ? "Enter the 6-character session code shared by the host"
              : `Joining: ${foundSession?.campaign?.title}`
            }
          </DialogDescription>
        </DialogHeader>

        {step === "code" ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="ABC123"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase().slice(0, 6))}
                className="text-center text-xl font-mono tracking-widest"
                maxLength={6}
              />
              <Button onClick={handleCodeSubmit} disabled={loading || sessionCode.length !== 6}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {characters.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">You need a character to join</p>
                <Button onClick={() => navigate('/lore-chronicles/create-character')}>
                  Create Character
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-3 max-h-60 overflow-y-auto">
                  {characters.map((char) => (
                    <Card 
                      key={char.id}
                      className={`cursor-pointer transition-colors ${
                        selectedCharacter?.id === char.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedCharacter(char)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={char.portrait_url || undefined} />
                          <AvatarFallback>{char.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{char.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Level {char.level} {char.race?.name || "Unknown Race"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("code")} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={handleJoin} 
                    disabled={!selectedCharacter || loading}
                    className="flex-1"
                  >
                    {loading ? "Joining..." : "Join Session"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
