 import { useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { motion, AnimatePresence } from "framer-motion";
 import { ArrowLeft, ArrowRight, Check, Sparkles, User } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Progress } from "@/components/ui/progress";
 import { useAuth } from "@/contexts/AuthContext";
 import { useLoreChronicles, CharacterStats } from "@/hooks/useLoreChronicles";
 import { supabase } from "@/integrations/supabase/client";
 import { useEffect } from "react";
 
 interface Race {
   id: string;
   name: string;
   description: string;
   image_url: string | null;
 }
 
 const TOTAL_STAT_POINTS = 20;
 const DEFAULT_STATS: CharacterStats = {
   strength: 3,
   magic: 3,
   charisma: 3,
   wisdom: 3,
   agility: 3
 };
 
 const statLabels: Record<keyof CharacterStats, { label: string; icon: string; description: string }> = {
   strength: { label: "Strength", icon: "💪", description: "Physical power and combat prowess" },
   magic: { label: "Magic", icon: "✨", description: "Arcane ability and mystical knowledge" },
   charisma: { label: "Charisma", icon: "💬", description: "Persuasion and social influence" },
   wisdom: { label: "Wisdom", icon: "📚", description: "Insight and decision-making" },
   agility: { label: "Agility", icon: "⚡", description: "Speed and dexterity" }
 };
 
 const CharacterCreator = () => {
   const navigate = useNavigate();
   const { user } = useAuth();
   const { createCharacter } = useLoreChronicles();
   
   const [step, setStep] = useState(1);
   const [races, setRaces] = useState<Race[]>([]);
   const [loadingRaces, setLoadingRaces] = useState(true);
   
   const [selectedRace, setSelectedRace] = useState<Race | null>(null);
   const [stats, setStats] = useState<CharacterStats>(DEFAULT_STATS);
   const [name, setName] = useState("");
   const [backstory, setBackstory] = useState("");
   const [portraitUrl, setPortraitUrl] = useState("");
   const [creating, setCreating] = useState(false);
 
   useEffect(() => {
     const fetchRaces = async () => {
       const { data, error } = await supabase
         .from("almanac_races")
         .select("id, name, description, image_url")
         .eq("is_disabled", false)
         .order("name");
 
       if (!error && data) {
         setRaces(data);
       }
       setLoadingRaces(false);
     };
 
     fetchRaces();
   }, []);
 
   const usedPoints = Object.values(stats).reduce((a, b) => a + b, 0);
   const remainingPoints = TOTAL_STAT_POINTS - usedPoints;
 
   const updateStat = (stat: keyof CharacterStats, delta: number) => {
     const newValue = stats[stat] + delta;
     if (newValue < 1 || newValue > 10) return;
     if (delta > 0 && remainingPoints <= 0) return;
     
     setStats(prev => ({ ...prev, [stat]: newValue }));
   };
 
   const handleCreate = async () => {
     if (!name.trim()) return;
     
     setCreating(true);
     const result = await createCharacter({
       name: name.trim(),
       race_id: selectedRace?.id || null,
       stats,
       backstory: backstory.trim() || null,
       portrait_url: portraitUrl.trim() || null
     });
 
     setCreating(false);
     if (result) {
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
             <CardDescription>
               You need to sign in to create a character
             </CardDescription>
           </CardHeader>
           <CardContent>
             <Button onClick={() => navigate('/auth')}>Sign In</Button>
           </CardContent>
         </Card>
       </div>
     );
   }
 
   const steps = [
     { number: 1, title: "Choose Race" },
     { number: 2, title: "Allocate Stats" },
     { number: 3, title: "Details" },
     { number: 4, title: "Review" }
   ];
 
   return (
     <div className="min-h-screen bg-background py-8 px-4">
       <div className="container mx-auto max-w-4xl">
         {/* Header */}
         <div className="flex items-center gap-4 mb-8">
           <Button variant="ghost" size="icon" onClick={() => navigate('/lore-chronicles')}>
             <ArrowLeft className="h-5 w-5" />
           </Button>
           <div>
             <h1 className="text-2xl md:text-3xl font-bold">Create Character</h1>
             <p className="text-muted-foreground">Forge your hero for the adventures ahead</p>
           </div>
         </div>
 
         {/* Progress Steps */}
         <div className="flex items-center justify-between mb-8 max-w-lg mx-auto">
           {steps.map((s, i) => (
             <div key={s.number} className="flex items-center">
               <div className={`
                 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                 ${step >= s.number 
                   ? "bg-primary border-primary text-primary-foreground" 
                   : "border-muted-foreground/30 text-muted-foreground"}
               `}>
                 {step > s.number ? <Check className="h-5 w-5" /> : s.number}
               </div>
               {i < steps.length - 1 && (
                 <div className={`w-12 md:w-20 h-0.5 mx-2 ${step > s.number ? "bg-primary" : "bg-muted"}`} />
               )}
             </div>
           ))}
         </div>
 
         {/* Step Content */}
         <AnimatePresence mode="wait">
           <motion.div
             key={step}
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             transition={{ duration: 0.2 }}
           >
             {step === 1 && (
               <RaceSelection
                 races={races}
                 loading={loadingRaces}
                 selected={selectedRace}
                 onSelect={setSelectedRace}
               />
             )}
 
             {step === 2 && (
               <StatAllocation
                 stats={stats}
                 remainingPoints={remainingPoints}
                 onUpdate={updateStat}
               />
             )}
 
             {step === 3 && (
               <CharacterDetails
                 name={name}
                 backstory={backstory}
                 portraitUrl={portraitUrl}
                 onNameChange={setName}
                 onBackstoryChange={setBackstory}
                 onPortraitChange={setPortraitUrl}
               />
             )}
 
             {step === 4 && (
               <ReviewCharacter
                 race={selectedRace}
                 stats={stats}
                 name={name}
                 backstory={backstory}
                 portraitUrl={portraitUrl}
               />
             )}
           </motion.div>
         </AnimatePresence>
 
         {/* Navigation */}
         <div className="flex justify-between mt-8">
           <Button
             variant="outline"
             onClick={() => setStep(s => Math.max(1, s - 1))}
             disabled={step === 1}
           >
             <ArrowLeft className="h-4 w-4 mr-2" />
             Back
           </Button>
 
           {step < 4 ? (
             <Button
               onClick={() => setStep(s => Math.min(4, s + 1))}
               disabled={step === 3 && !name.trim()}
             >
               Next
               <ArrowRight className="h-4 w-4 ml-2" />
             </Button>
           ) : (
             <Button onClick={handleCreate} disabled={creating || !name.trim()}>
               {creating ? (
                 <>Creating...</>
               ) : (
                 <>
                   <Sparkles className="h-4 w-4 mr-2" />
                   Create Character
                 </>
               )}
             </Button>
           )}
         </div>
       </div>
     </div>
   );
 };
 
 // Step 1: Race Selection
 const RaceSelection = ({ races, loading, selected, onSelect }: {
   races: Race[];
   loading: boolean;
   selected: Race | null;
   onSelect: (race: Race | null) => void;
 }) => {
   if (loading) {
     return (
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
         {[1, 2, 3, 4, 5, 6].map(i => (
           <Card key={i} className="animate-pulse">
             <div className="h-32 bg-muted rounded-t-lg" />
             <CardHeader className="py-3">
               <div className="h-5 w-20 bg-muted rounded" />
             </CardHeader>
           </Card>
         ))}
       </div>
     );
   }
 
   return (
     <div>
       <h2 className="text-xl font-semibold mb-4">Choose Your Race</h2>
       <p className="text-muted-foreground mb-6">
         Select a race from the Witness Almanac. Each race has unique lore and heritage.
       </p>
 
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
         {/* No Race Option */}
         <Card
           className={`cursor-pointer transition-all ${
             selected === null 
               ? "ring-2 ring-primary border-primary" 
               : "hover:border-primary/40"
           }`}
           onClick={() => onSelect(null)}
         >
           <div className="h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
             <User className="h-12 w-12 text-muted-foreground" />
           </div>
           <CardHeader className="py-3">
             <CardTitle className="text-base">Custom Origin</CardTitle>
           </CardHeader>
         </Card>
 
         {races.map(race => (
           <Card
             key={race.id}
             className={`cursor-pointer transition-all ${
               selected?.id === race.id 
                 ? "ring-2 ring-primary border-primary" 
                 : "hover:border-primary/40"
             }`}
             onClick={() => onSelect(race)}
           >
             <div className="h-32 bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
               {race.image_url ? (
                 <img
                   src={race.image_url}
                   alt={race.name}
                   className="w-full h-full object-cover"
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center">
                   <Sparkles className="h-12 w-12 text-primary/30" />
                 </div>
               )}
             </div>
             <CardHeader className="py-3">
               <CardTitle className="text-base">{race.name}</CardTitle>
             </CardHeader>
           </Card>
         ))}
       </div>
 
       {selected && (
         <Card className="mt-6">
           <CardHeader>
             <CardTitle>{selected.name}</CardTitle>
             <CardDescription>{selected.description}</CardDescription>
           </CardHeader>
         </Card>
       )}
     </div>
   );
 };
 
 // Step 2: Stat Allocation
 const StatAllocation = ({ stats, remainingPoints, onUpdate }: {
   stats: CharacterStats;
   remainingPoints: number;
   onUpdate: (stat: keyof CharacterStats, delta: number) => void;
 }) => {
   return (
     <div>
       <div className="flex items-center justify-between mb-6">
         <div>
           <h2 className="text-xl font-semibold">Allocate Stats</h2>
           <p className="text-muted-foreground">
             Distribute your points wisely. Each stat affects different aspects of gameplay.
           </p>
         </div>
         <div className={`text-2xl font-bold ${remainingPoints === 0 ? "text-primary" : "text-muted-foreground"}`}>
           {remainingPoints} pts
         </div>
       </div>
 
       <div className="space-y-6">
         {(Object.keys(stats) as Array<keyof CharacterStats>).map(stat => (
           <div key={stat} className="space-y-2">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <span className="text-2xl">{statLabels[stat].icon}</span>
                 <div>
                   <Label className="text-base font-medium">{statLabels[stat].label}</Label>
                   <p className="text-xs text-muted-foreground">{statLabels[stat].description}</p>
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 <Button
                   variant="outline"
                   size="icon"
                   className="h-8 w-8"
                   onClick={() => onUpdate(stat, -1)}
                   disabled={stats[stat] <= 1}
                 >
                   -
                 </Button>
                 <span className="w-8 text-center font-bold text-lg">{stats[stat]}</span>
                 <Button
                   variant="outline"
                   size="icon"
                   className="h-8 w-8"
                   onClick={() => onUpdate(stat, 1)}
                   disabled={stats[stat] >= 10 || remainingPoints <= 0}
                 >
                   +
                 </Button>
               </div>
             </div>
             <Progress value={stats[stat] * 10} className="h-2" />
           </div>
         ))}
       </div>
     </div>
   );
 };
 
 // Step 3: Character Details
 const CharacterDetails = ({ name, backstory, portraitUrl, onNameChange, onBackstoryChange, onPortraitChange }: {
   name: string;
   backstory: string;
   portraitUrl: string;
   onNameChange: (value: string) => void;
   onBackstoryChange: (value: string) => void;
   onPortraitChange: (value: string) => void;
 }) => {
   return (
     <div className="space-y-6">
       <div>
         <h2 className="text-xl font-semibold mb-4">Character Details</h2>
         <p className="text-muted-foreground mb-6">
           Give your character a name and backstory to bring them to life.
         </p>
       </div>
 
       <div className="space-y-4">
         <div className="space-y-2">
           <Label htmlFor="name">Character Name *</Label>
           <Input
             id="name"
             value={name}
             onChange={(e) => onNameChange(e.target.value)}
             placeholder="Enter your character's name"
             maxLength={50}
           />
         </div>
 
         <div className="space-y-2">
           <Label htmlFor="portrait">Portrait URL (optional)</Label>
           <Input
             id="portrait"
             value={portraitUrl}
             onChange={(e) => onPortraitChange(e.target.value)}
             placeholder="https://example.com/portrait.jpg"
           />
           {portraitUrl && (
             <div className="flex justify-center mt-2">
               <Avatar className="h-24 w-24">
                 <AvatarImage src={portraitUrl} />
                 <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
               </Avatar>
             </div>
           )}
         </div>
 
         <div className="space-y-2">
           <Label htmlFor="backstory">Backstory (optional)</Label>
           <Textarea
             id="backstory"
             value={backstory}
             onChange={(e) => onBackstoryChange(e.target.value)}
             placeholder="Write your character's history, motivations, and personality..."
             rows={6}
             maxLength={2000}
           />
           <p className="text-xs text-muted-foreground text-right">
             {backstory.length}/2000
           </p>
         </div>
       </div>
     </div>
   );
 };
 
 // Step 4: Review
 const ReviewCharacter = ({ race, stats, name, backstory, portraitUrl }: {
   race: Race | null;
   stats: CharacterStats;
   name: string;
   backstory: string;
   portraitUrl: string;
 }) => {
   return (
     <div>
       <h2 className="text-xl font-semibold mb-6">Review Your Character</h2>
 
       <Card>
         <CardHeader>
           <div className="flex items-center gap-4">
             <Avatar className="h-20 w-20">
               <AvatarImage src={portraitUrl || undefined} />
               <AvatarFallback className="text-2xl">
                 {name.slice(0, 2).toUpperCase()}
               </AvatarFallback>
             </Avatar>
             <div>
               <CardTitle className="text-2xl">{name || "Unnamed Hero"}</CardTitle>
               <CardDescription className="text-base">
                 {race?.name || "Custom Origin"}
               </CardDescription>
             </div>
           </div>
         </CardHeader>
         
         <CardContent className="space-y-6">
           {/* Stats */}
           <div>
             <h3 className="font-semibold mb-3">Stats</h3>
             <div className="grid grid-cols-5 gap-4">
               {(Object.entries(stats) as Array<[keyof CharacterStats, number]>).map(([stat, value]) => (
                 <div key={stat} className="text-center p-3 bg-muted/50 rounded-lg">
                   <div className="text-2xl mb-1">{statLabels[stat].icon}</div>
                   <div className="font-bold text-lg">{value}</div>
                   <div className="text-xs text-muted-foreground">{statLabels[stat].label}</div>
                 </div>
               ))}
             </div>
           </div>
 
           {/* Backstory */}
           {backstory && (
             <div>
               <h3 className="font-semibold mb-2">Backstory</h3>
               <p className="text-muted-foreground whitespace-pre-wrap">{backstory}</p>
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 };
 
 export default CharacterCreator;