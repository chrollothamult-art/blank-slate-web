import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sword, Users, BookOpen, Sparkles, Plus, Play, Scroll, Crown, Book, Trophy, Shield, Flag, MessageCircle, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Footer } from "@/components/Footer";
import { CharacterList } from "@/components/lore-chronicles/CharacterList";
import { CampaignBrowser } from "@/components/lore-chronicles/CampaignBrowser";
import { ActiveSessions } from "@/components/lore-chronicles/ActiveSessions";
import { JoinSessionDialog } from "@/components/lore-chronicles/JoinSessionDialog";
import { CharacterShowcase } from "@/components/lore-chronicles/CharacterShowcase";
import { CommunityLoreAlmanac } from "@/components/lore-chronicles/CommunityLoreAlmanac";
import { CharacterLeaderboard } from "@/components/lore-chronicles/CharacterLeaderboard";
import { LoremasterDashboard } from "@/components/lore-chronicles/LoremasterDashboard";
import { FactionLeaderboard } from "@/components/lore-chronicles/FactionLeaderboard";
import { LoreAssistantPanel } from "@/components/lore-chronicles/LoreAssistantPanel";
import { CharacterGraveyard } from "@/components/lore-chronicles/CharacterGraveyard";
import { useLoreProposals } from "@/hooks/useLoreProposals";
 
 const LoreChronicles = () => {
   const navigate = useNavigate();
   const { user } = useAuth();
   const [activeTab, setActiveTab] = useState("campaigns");
   const [isLoreAssistantOpen, setIsLoreAssistantOpen] = useState(false);
 
   return (
     <div className="min-h-screen bg-background">
       {/* Hero Section */}
       <section className="relative py-16 md:py-24 px-4 overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
         <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
         
         <div className="container mx-auto relative z-10">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             className="text-center max-w-3xl mx-auto"
           >
             <div className="flex items-center justify-center gap-3 mb-6">
               <Sparkles className="h-8 w-8 text-primary" />
               <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                 Lore Chronicles
               </h1>
               <Sparkles className="h-8 w-8 text-primary" />
             </div>
             
             <p className="text-lg md:text-xl text-muted-foreground mb-8">
               Forge your destiny in the ThouArt universe. Create characters, embark on branching adventures, 
               and shape the lore through your choices.
             </p>
 
              <div className="flex flex-wrap justify-center gap-4">
                {user ? (
                  <>
                    <Button 
                      size="lg" 
                      onClick={() => navigate('/lore-chronicles/create-character')}
                      className="gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      Create Character
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => navigate('/lore-chronicles/create-campaign')}
                      className="gap-2"
                    >
                      <BookOpen className="h-5 w-5" />
                      Create Campaign
                    </Button>
                    <JoinSessionDialog 
                      trigger={
                        <Button size="lg" variant="secondary" className="gap-2">
                          <Users className="h-5 w-5" />
                          Join Session
                        </Button>
                      }
                    />
                    <Button 
                      size="lg" 
                      variant="ghost"
                      onClick={() => navigate('/lore-chronicles/lore-expansion')}
                      className="gap-2"
                    >
                      <Scroll className="h-5 w-5" />
                      Expand Lore
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/auth')}
                    className="gap-2"
                  >
                    Sign In to Play
                  </Button>
                )}
              </div>
           </motion.div>
         </div>
       </section>
 
       {/* Feature Cards */}
       <section className="py-12 px-4">
         <div className="container mx-auto">
           <div className="grid md:grid-cols-3 gap-6 mb-12">
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
             >
               <Card className="h-full border-primary/20 hover:border-primary/40 transition-colors">
                 <CardHeader>
                   <Sword className="h-10 w-10 text-primary mb-2" />
                   <CardTitle>Create Characters</CardTitle>
                   <CardDescription>
                     Choose from races in the Witness Almanac, allocate stats, and craft your backstory
                   </CardDescription>
                 </CardHeader>
               </Card>
             </motion.div>
 
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
             >
               <Card className="h-full border-primary/20 hover:border-primary/40 transition-colors">
                 <CardHeader>
                   <BookOpen className="h-10 w-10 text-primary mb-2" />
                   <CardTitle>Branching Adventures</CardTitle>
                   <CardDescription>
                     Explore user-created campaigns with meaningful choices that shape your story
                   </CardDescription>
                 </CardHeader>
               </Card>
             </motion.div>
 
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
             >
               <Card className="h-full border-primary/20 hover:border-primary/40 transition-colors">
                 <CardHeader>
                   <Users className="h-10 w-10 text-primary mb-2" />
                   <CardTitle>Expand the Lore</CardTitle>
                   <CardDescription>
                     Propose new races, locations, and items — moderated by Loremasters for consistency
                   </CardDescription>
                 </CardHeader>
               </Card>
             </motion.div>
           </div>
         </div>
       </section>
 
       {/* Main Content Tabs */}
       <section className="py-8 px-4">
         <div className="container mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
             <TabsList className="grid w-full max-w-5xl mx-auto grid-cols-9 mb-8">
                 <TabsTrigger value="campaigns" className="gap-2">
                   <BookOpen className="h-4 w-4" />
                   <span className="hidden sm:inline">Campaigns</span>
                 </TabsTrigger>
                 <TabsTrigger value="characters" className="gap-2">
                   <Sword className="h-4 w-4" />
                   <span className="hidden sm:inline">Characters</span>
                 </TabsTrigger>
                 <TabsTrigger value="sessions" className="gap-2">
                   <Play className="h-4 w-4" />
                   <span className="hidden sm:inline">Sessions</span>
                 </TabsTrigger>
                 <TabsTrigger value="showcase" className="gap-2">
                   <Crown className="h-4 w-4" />
                   <span className="hidden sm:inline">Showcase</span>
                 </TabsTrigger>
                 <TabsTrigger value="leaderboard" className="gap-2">
                   <Trophy className="h-4 w-4" />
                   <span className="hidden sm:inline">Leaderboard</span>
                 </TabsTrigger>
                 <TabsTrigger value="factions" className="gap-2">
                   <Flag className="h-4 w-4" />
                   <span className="hidden sm:inline">Factions</span>
                 </TabsTrigger>
                 <TabsTrigger value="graveyard" className="gap-2">
                   <Skull className="h-4 w-4" />
                   <span className="hidden sm:inline">Graveyard</span>
                 </TabsTrigger>
                 <TabsTrigger value="lore" className="gap-2">
                   <Book className="h-4 w-4" />
                   <span className="hidden sm:inline">Lore</span>
                 </TabsTrigger>
                 <TabsTrigger value="loremaster" className="gap-2">
                   <Shield className="h-4 w-4" />
                   <span className="hidden sm:inline">Loremaster</span>
                 </TabsTrigger>
               </TabsList>

               <TabsContent value="campaigns">
                 <CampaignBrowser />
               </TabsContent>

               <TabsContent value="characters">
                 <CharacterList />
               </TabsContent>

               <TabsContent value="sessions">
                 <ActiveSessions />
               </TabsContent>

               <TabsContent value="showcase">
                 <CharacterShowcase />
               </TabsContent>

               <TabsContent value="leaderboard">
                 <CharacterLeaderboard />
               </TabsContent>

                <TabsContent value="factions">
                  <FactionLeaderboard />
                </TabsContent>

                <TabsContent value="graveyard">
                  <CharacterGraveyard />
                </TabsContent>

                <TabsContent value="lore">
                  <CommunityLoreAlmanac />
                </TabsContent>

               <TabsContent value="loremaster">
                 <LoremasterDashboard />
               </TabsContent>
             </Tabs>
         </div>
        </section>
  
        {/* Floating Lore Assistant Button */}
        <Button
          onClick={() => setIsLoreAssistantOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-30"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>

        {/* Lore Assistant Panel */}
        <LoreAssistantPanel
          isOpen={isLoreAssistantOpen}
          onClose={() => setIsLoreAssistantOpen(false)}
        />

        <Footer />
      </div>
    );
  };
  
  export default LoreChronicles;