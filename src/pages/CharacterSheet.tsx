import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Sword, Shield, Sparkles, Heart, 
  BookOpen, Award, Scroll, User, Edit2, Trash2,
  Zap, Users, Eye, EyeOff, Globe, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RpCharacter, CharacterStats, useLoreChronicles } from "@/hooks/useLoreChronicles";
import { useCharacterShowcase } from "@/hooks/useCharacterShowcase";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { toast } from "@/hooks/use-toast";
import { ProgressionDisplay } from "@/components/lore-chronicles/ProgressionDisplay";
import { AbilitiesPanel } from "@/components/lore-chronicles/AbilitiesPanel";
import { FactionsPanel } from "@/components/lore-chronicles/FactionsPanel";
import { InventoryPanel } from "@/components/lore-chronicles/InventoryPanel";
 
 const statDetails: Record<keyof CharacterStats, { 
   label: string; 
   icon: string; 
   color: string;
   description: string;
 }> = {
   strength: { 
     label: "Strength", 
     icon: "💪", 
     color: "bg-red-500",
     description: "Physical power, melee combat prowess, and carrying capacity"
   },
   magic: { 
     label: "Magic", 
     icon: "✨", 
     color: "bg-purple-500",
     description: "Arcane ability, spell potency, and mystical knowledge"
   },
   charisma: { 
     label: "Charisma", 
     icon: "💬", 
     color: "bg-pink-500",
     description: "Persuasion, social influence, and leadership ability"
   },
   wisdom: { 
     label: "Wisdom", 
     icon: "📚", 
     color: "bg-blue-500",
     description: "Insight, perception, and decision-making ability"
   },
   agility: { 
     label: "Agility", 
     icon: "⚡", 
     color: "bg-yellow-500",
     description: "Speed, dexterity, and evasion capability"
   }
 };
 
 const xpForLevel = (level: number) => level * 100;
 
const CharacterSheet = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deleteCharacter } = useLoreChronicles();
  const { toggleCharacterVisibility } = useCharacterShowcase();
  
  const [character, setCharacter] = useState<(RpCharacter & { ability_slots?: number; is_public?: boolean; inventory_slots?: number }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("stats");
  const [isPublic, setIsPublic] = useState(false);
 
   useEffect(() => {
     const fetchCharacter = async () => {
       if (!characterId) return;
 
       const { data, error } = await supabase
         .from("rp_characters")
         .select(`
           *,
           race:almanac_races(id, name, image_url, description)
         `)
         .eq("id", characterId)
         .single();
 
       if (error || !data) {
         toast({ title: "Character not found", variant: "destructive" });
         navigate('/lore-chronicles');
         return;
       }
 
       const rawStats = data.stats as unknown;
       const stats: CharacterStats = 
         rawStats && typeof rawStats === 'object' && !Array.isArray(rawStats)
           ? rawStats as CharacterStats
           : { strength: 3, magic: 3, charisma: 3, wisdom: 3, agility: 3 };
 
        const charWithPublic = {
          ...data,
          stats,
          race: data.race as RpCharacter["race"],
          ability_slots: data.ability_slots || 3,
          is_public: (data as { is_public?: boolean }).is_public ?? false
        };
        setCharacter(charWithPublic);
        setIsPublic(charWithPublic.is_public);
 
       // Fetch session history
       const { data: sessions } = await supabase
         .from("rp_session_participants")
         .select(`
           session:rp_sessions(
             id, status, started_at, completed_at,
             campaign:rp_campaigns(title)
           )
         `)
         .eq("character_id", characterId)
         .order("joined_at", { ascending: false })
         .limit(5);
 
       setSessionHistory(sessions?.map(s => s.session) || []);
       setLoading(false);
     };
 
     fetchCharacter();
   }, [characterId, navigate]);
 
   const handleDelete = async () => {
     if (!character) return;
     const success = await deleteCharacter(character.id);
     if (success) {
       navigate('/lore-chronicles');
     }
   };
 
   if (!user) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center p-4">
         <Card className="max-w-md w-full text-center">
           <CardHeader>
             <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
             <CardTitle>Sign In Required</CardTitle>
             <CardDescription>Sign in to view character sheets</CardDescription>
           </CardHeader>
           <CardContent>
             <Button onClick={() => navigate('/auth')}>Sign In</Button>
           </CardContent>
         </Card>
       </div>
     );
   }
 
   if (loading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <div className="animate-pulse text-center">
           <Scroll className="h-16 w-16 text-primary mx-auto mb-4" />
           <p className="text-muted-foreground">Loading character sheet...</p>
         </div>
       </div>
     );
   }
 
   if (!character) return null;
 
   const xpProgress = (character.xp / xpForLevel(character.level)) * 100;
   const totalStats = Object.values(character.stats).reduce((a, b) => a + b, 0);
   const isOwner = user.id === character.user_id;
 
   return (
     <div className="min-h-screen bg-background py-8 px-4">
       <div className="container mx-auto max-w-4xl">
         {/* Header */}
         <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate('/lore-chronicles')}>
               <ArrowLeft className="h-5 w-5" />
             </Button>
             <h1 className="text-2xl md:text-3xl font-bold">Character Sheet</h1>
           </div>
           {isOwner && (
             <Button 
               variant="destructive" 
               size="sm"
               onClick={() => setShowDeleteDialog(true)}
             >
               <Trash2 className="h-4 w-4 mr-2" />
               Delete
             </Button>
           )}
         </div>
 
         <div className="grid lg:grid-cols-3 gap-6">
           {/* Main Info Card */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="lg:col-span-1"
           >
             <Card className="overflow-hidden">
               {/* Portrait */}
               <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20">
                 {character.portrait_url ? (
                   <img 
                     src={character.portrait_url} 
                     alt={character.name}
                     className="w-full h-full object-cover"
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center">
                     <Avatar className="h-24 w-24 border-4 border-background">
                       <AvatarFallback className="text-3xl bg-primary/20">
                         {character.name.slice(0, 2).toUpperCase()}
                       </AvatarFallback>
                     </Avatar>
                   </div>
                 )}
                 <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent h-16" />
               </div>
 
               <CardHeader className="text-center -mt-8 relative">
                 <CardTitle className="text-2xl">{character.name}</CardTitle>
                 <CardDescription className="text-base">
                   {character.race?.name || "Unknown Origin"}
                 </CardDescription>
               </CardHeader>
 
               <CardContent className="space-y-4">
                 {/* Level & XP */}
                 <div className="bg-muted/50 rounded-lg p-4">
                   <div className="flex items-center justify-between mb-2">
                     <span className="flex items-center gap-2 font-semibold">
                       <Sparkles className="h-4 w-4 text-primary" />
                       Level {character.level}
                     </span>
                     <span className="text-sm text-muted-foreground">
                       {character.xp} / {xpForLevel(character.level)} XP
                     </span>
                   </div>
                   <Progress value={xpProgress} className="h-3" />
                 </div>
 
                {/* Status */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <Badge variant={character.is_active ? "default" : "secondary"}>
                    {character.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {character.current_session_id && (
                    <Badge variant="outline" className="border-primary text-primary">
                      In Adventure
                    </Badge>
                  )}
                  {isPublic && (
                    <Badge variant="outline" className="border-green-500 text-green-600">
                      <Globe className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                  )}
                </div>

                {/* Showcase Toggle - Owner Only */}
                {isOwner && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isPublic ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                        <Label htmlFor="public-toggle" className="text-sm font-medium">
                          Public Showcase
                        </Label>
                      </div>
                      <Switch
                        id="public-toggle"
                        checked={isPublic}
                        onCheckedChange={async (checked) => {
                          const success = await toggleCharacterVisibility(character.id, checked);
                          if (success) {
                            setIsPublic(checked);
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {isPublic 
                        ? "Your character is visible in the public showcase" 
                        : "Make your character visible to other players"}
                    </p>
                  </>
                )}
 
                 {/* Race Info */}
                 {character.race && (
                   <>
                     <Separator />
                     <div className="text-center">
                       <h4 className="font-semibold text-sm mb-2">Race Lore</h4>
                       <p className="text-sm text-muted-foreground line-clamp-3">
                         {character.race.description}
                       </p>
                     </div>
                   </>
                 )}
               </CardContent>
             </Card>
           </motion.div>
 
            {/* Stats & Details with Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-6"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                   <TabsTrigger value="stats" className="gap-1">
                     <Shield className="h-4 w-4" />
                     <span className="hidden sm:inline">Stats</span>
                   </TabsTrigger>
                   <TabsTrigger value="abilities" className="gap-1">
                     <Zap className="h-4 w-4" />
                     <span className="hidden sm:inline">Abilities</span>
                   </TabsTrigger>
                   <TabsTrigger value="inventory" className="gap-1">
                     <Package className="h-4 w-4" />
                     <span className="hidden sm:inline">Inventory</span>
                   </TabsTrigger>
                   <TabsTrigger value="factions" className="gap-1">
                     <Users className="h-4 w-4" />
                     <span className="hidden sm:inline">Factions</span>
                   </TabsTrigger>
                   <TabsTrigger value="history" className="gap-1">
                     <Award className="h-4 w-4" />
                     <span className="hidden sm:inline">History</span>
                   </TabsTrigger>
                 </TabsList>

                <TabsContent value="stats" className="space-y-6 mt-6">
                  {/* Progression Display */}
                  <ProgressionDisplay 
                    characterId={character.id}
                    currentXp={character.xp}
                    currentLevel={character.level}
                  />

                  {/* Stats Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          Attributes
                        </CardTitle>
                        <Badge variant="outline">
                          Total: {totalStats} pts
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(Object.entries(character.stats) as Array<[keyof CharacterStats, number]>).map(([stat, value]) => (
                          <div 
                            key={stat} 
                            className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="flex items-center gap-2">
                                <span className="text-xl">{statDetails[stat].icon}</span>
                                <span className="font-medium">{statDetails[stat].label}</span>
                              </span>
                              <span className="text-2xl font-bold">{value}</span>
                            </div>
                            <Progress 
                              value={value * 10} 
                              className="h-2 mb-2"
                            />
                            <p className="text-xs text-muted-foreground">
                              {statDetails[stat].description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Backstory Card */}
                  {character.backstory && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          Backstory
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {character.backstory}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="abilities" className="mt-6">
                  <AbilitiesPanel 
                    characterId={character.id}
                    abilitySlots={character.ability_slots || 3}
                  />
                </TabsContent>

                <TabsContent value="inventory" className="mt-6">
                   <InventoryPanel 
                     characterId={character.id}
                     inventorySlots={character.inventory_slots || 10}
                     editable={isOwner}
                   />
                 </TabsContent>

                <TabsContent value="factions" className="mt-6">
                   <FactionsPanel characterId={character.id} />
                 </TabsContent>

                <TabsContent value="history" className="mt-6">
                  {/* Session History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        Adventure History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sessionHistory.length > 0 ? (
                        <div className="space-y-3">
                          {sessionHistory.map((session, i) => (
                            <div 
                              key={session?.id || i}
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                            >
                              <div>
                                <p className="font-medium">
                                  {session?.campaign?.title || "Unknown Campaign"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {session?.started_at 
                                    ? new Date(session.started_at).toLocaleDateString()
                                    : "Unknown date"
                                  }
                                </p>
                              </div>
                              <Badge variant={session?.status === "completed" ? "default" : "outline"}>
                                {session?.status || "unknown"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          No adventures yet. Start a campaign to begin!
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
 
         {/* Delete Confirmation */}
         <ConfirmationDialog
           open={showDeleteDialog}
           onOpenChange={setShowDeleteDialog}
           title="Delete Character"
           description={`Are you sure you want to delete ${character.name}? This action cannot be undone.`}
           confirmText="Delete"
           variant="danger"
           onConfirm={handleDelete}
         />
       </div>
     </div>
   );
 };
 
 export default CharacterSheet;