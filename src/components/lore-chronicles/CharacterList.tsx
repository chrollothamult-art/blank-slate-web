 import { useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { motion } from "framer-motion";
import { Plus, Sword, Trash2, User, Sparkles, Eye } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import { useAuth } from "@/contexts/AuthContext";
 import { useLoreChronicles, CharacterStats } from "@/hooks/useLoreChronicles";
 import { ConfirmationDialog } from "@/components/ConfirmationDialog";
 
 const statIcons: Record<keyof CharacterStats, string> = {
   strength: "💪",
   magic: "✨",
   charisma: "💬",
   wisdom: "📚",
   agility: "⚡"
 };
 
 const xpForLevel = (level: number) => level * 100;
 
 export const CharacterList = () => {
   const navigate = useNavigate();
   const { user } = useAuth();
   const { characters, loading, deleteCharacter } = useLoreChronicles();
   const [deleteId, setDeleteId] = useState<string | null>(null);
 
   if (!user) {
     return (
       <Card className="text-center py-12">
         <CardContent>
           <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
           <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
           <p className="text-muted-foreground mb-4">Create an account to forge your characters</p>
           <Button onClick={() => navigate('/auth')}>Sign In</Button>
         </CardContent>
       </Card>
     );
   }
 
   if (loading) {
     return (
       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
         {[1, 2, 3].map(i => (
           <Card key={i} className="animate-pulse">
             <CardHeader>
               <div className="h-12 w-12 rounded-full bg-muted" />
               <div className="h-6 w-32 bg-muted rounded mt-2" />
             </CardHeader>
             <CardContent>
               <div className="h-4 w-full bg-muted rounded mb-2" />
               <div className="h-4 w-2/3 bg-muted rounded" />
             </CardContent>
           </Card>
         ))}
       </div>
     );
   }
 
   if (characters.length === 0) {
     return (
       <Card className="text-center py-12">
         <CardContent>
           <Sword className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
           <h3 className="text-xl font-semibold mb-2">No Characters Yet</h3>
           <p className="text-muted-foreground mb-4">Create your first character to begin your adventure</p>
           <Button onClick={() => navigate('/lore-chronicles/create-character')} className="gap-2">
             <Plus className="h-4 w-4" />
             Create Character
           </Button>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <>
       <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-bold">My Characters</h2>
         <Button onClick={() => navigate('/lore-chronicles/create-character')} className="gap-2">
           <Plus className="h-4 w-4" />
           New Character
         </Button>
       </div>
 
       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
         {characters.map((character, index) => {
           const xpProgress = (character.xp / xpForLevel(character.level)) * 100;
           
           return (
             <motion.div
               key={character.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: index * 0.1 }}
             >
               <Card className="h-full hover:border-primary/40 transition-colors group">
                 <CardHeader className="pb-3">
                   <div className="flex items-start justify-between">
                     <div className="flex items-center gap-3">
                       <Avatar className="h-12 w-12 border-2 border-primary/20">
                         <AvatarImage src={character.portrait_url || undefined} />
                         <AvatarFallback className="bg-primary/10 text-primary">
                           {character.name.slice(0, 2).toUpperCase()}
                         </AvatarFallback>
                       </Avatar>
                       <div>
                         <CardTitle className="text-lg">{character.name}</CardTitle>
                         <CardDescription>
                           {character.race?.name || "Unknown Race"}
                         </CardDescription>
                       </div>
                     </div>
                     <Button
                       variant="ghost"
                       size="icon"
                       className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                       onClick={() => setDeleteId(character.id)}
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                 </CardHeader>
                 
                 <CardContent className="space-y-4">
                   {/* Level & XP */}
                   <div className="space-y-1">
                     <div className="flex justify-between text-sm">
                       <span className="flex items-center gap-1">
                         <Sparkles className="h-3 w-3 text-primary" />
                         Level {character.level}
                       </span>
                       <span className="text-muted-foreground">
                         {character.xp} / {xpForLevel(character.level)} XP
                       </span>
                     </div>
                     <Progress value={xpProgress} className="h-2" />
                   </div>
 
                   {/* Stats */}
                   <div className="grid grid-cols-5 gap-1 text-center text-xs">
                     {Object.entries(character.stats).map(([stat, value]) => (
                       <div key={stat} className="flex flex-col items-center p-1 bg-muted/50 rounded">
                         <span>{statIcons[stat as keyof CharacterStats]}</span>
                         <span className="font-semibold">{value}</span>
                       </div>
                     ))}
                   </div>
 
                   {/* Status */}
                   <div className="flex items-center justify-between">
                     <Badge variant={character.is_active ? "default" : "secondary"}>
                       {character.is_active ? "Active" : "Inactive"}
                     </Badge>
                    {character.current_session_id && (
                      <Badge variant="outline" className="text-primary">
                        In Session
                      </Badge>
                    )}
                  </div>
 
                  {/* View Sheet Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/lore-chronicles/character/${character.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Character Sheet
                  </Button>
 
                   {/* Backstory Preview */}
                   {character.backstory && (
                     <p className="text-sm text-muted-foreground line-clamp-2">
                       {character.backstory}
                     </p>
                   )}
                 </CardContent>
               </Card>
             </motion.div>
           );
         })}
       </div>
 
       <ConfirmationDialog
         open={!!deleteId}
         onOpenChange={(open) => !open && setDeleteId(null)}
         title="Delete Character"
         description="Are you sure you want to delete this character? This action cannot be undone."
         confirmText="Delete"
         variant="danger"
         onConfirm={async () => {
           if (deleteId) {
             await deleteCharacter(deleteId);
             setDeleteId(null);
           }
         }}
       />
     </>
   );
 };