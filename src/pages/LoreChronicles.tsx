import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Sword, Users, BookOpen, Sparkles, Plus, Play, Scroll, Crown, Book, 
  Trophy, Shield, Flag, MessageCircle, Skull, ChevronRight, Flame, GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
import { QuickResumeBanner } from "@/components/lore-chronicles/QuickResumeBanner";
import { OnboardingTour } from "@/components/lore-chronicles/OnboardingTour";

type TabGroup = "play" | "community" | "govern";

const tabGroups: Record<TabGroup, { label: string; icon: React.ReactNode; tabs: { value: string; icon: React.ReactNode; label: string }[] }> = {
  play: {
    label: "Play",
    icon: <Sword className="h-4 w-4" />,
    tabs: [
      { value: "campaigns", icon: <BookOpen className="h-4 w-4" />, label: "Campaigns" },
      { value: "characters", icon: <Sword className="h-4 w-4" />, label: "Characters" },
      { value: "sessions", icon: <Play className="h-4 w-4" />, label: "Sessions" },
    ],
  },
  community: {
    label: "Community",
    icon: <Users className="h-4 w-4" />,
    tabs: [
      { value: "showcase", icon: <Crown className="h-4 w-4" />, label: "Showcase" },
      { value: "leaderboard", icon: <Trophy className="h-4 w-4" />, label: "Leaderboard" },
      { value: "factions", icon: <Flag className="h-4 w-4" />, label: "Factions" },
      { value: "graveyard", icon: <Skull className="h-4 w-4" />, label: "Graveyard" },
    ],
  },
  govern: {
    label: "Govern",
    icon: <Shield className="h-4 w-4" />,
    tabs: [
      { value: "lore", icon: <Book className="h-4 w-4" />, label: "Lore" },
      { value: "loremaster", icon: <Shield className="h-4 w-4" />, label: "Loremaster" },
    ],
  },
};

const featureCards = [
  { 
    icon: Sword, 
    title: "Forge Heroes", 
    desc: "Choose from races in the Witness Almanac, allocate stats, and craft your backstory",
    color: "text-red-400"
  },
  { 
    icon: BookOpen, 
    title: "Shape Destiny", 
    desc: "Explore branching campaigns with meaningful choices that shape your story",
    color: "text-blue-400"
  },
  { 
    icon: Scroll, 
    title: "Expand the Lore", 
    desc: "Propose new races, locations, and items — moderated by Loremasters for consistency",
    color: "text-amber-400"
  },
];

const LoreChronicles = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeGroup, setActiveGroup] = useState<TabGroup>("play");
  const [activeTab, setActiveTab] = useState("campaigns");
  const [isLoreAssistantOpen, setIsLoreAssistantOpen] = useState(false);

  const handleGroupChange = (group: string) => {
    const g = group as TabGroup;
    setActiveGroup(g);
    setActiveTab(tabGroups[g].tabs[0].value);
  };

  return (
    <div className="min-h-screen rpg-page">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 rpg-hero-gradient" />
        
        {/* Floating ambient particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-accent/40"
              style={{ 
                left: `${15 + i * 18}%`, 
                top: `${20 + (i % 3) * 25}%` 
              }}
              animate={{ 
                y: [0, -20, 0], 
                opacity: [0.2, 0.6, 0.2] 
              }}
              transition={{ 
                duration: 3 + i * 0.5, 
                repeat: Infinity, 
                delay: i * 0.4 
              }}
            />
          ))}
        </div>

        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Title with glow */}
            <motion.div 
              className="flex items-center justify-center gap-4 mb-6"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Flame className="h-8 w-8 text-accent rpg-pulse" />
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-accent via-amber-300 to-accent bg-clip-text text-transparent rpg-glow">
                  Lore Chronicles
                </span>
              </h1>
              <Flame className="h-8 w-8 text-accent rpg-pulse" />
            </motion.div>
            
            <motion.p 
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Forge your destiny in the ThouArt universe. Create characters, embark on branching adventures, 
              and shape the lore through your choices.
            </motion.p>

            <motion.div 
              className="flex flex-wrap justify-center gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {user ? (
                <>
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/lore-chronicles/create-character')} 
                    className="gap-2 rpg-btn-primary text-primary-foreground border-0 font-semibold"
                  >
                    <Plus className="h-5 w-5" /> Create Character
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => navigate('/lore-chronicles/create-campaign')} 
                    className="gap-2 border-accent/30 hover:border-accent/60 hover:bg-accent/10"
                  >
                    <BookOpen className="h-5 w-5" /> Create Campaign
                  </Button>
                  <JoinSessionDialog
                    trigger={
                      <Button size="lg" variant="secondary" className="gap-2">
                        <Users className="h-5 w-5" /> Join Session
                      </Button>
                    }
                  />
                  <Button 
                    size="lg" 
                    variant="ghost" 
                    onClick={() => navigate('/lore-chronicles/lore-expansion')} 
                    className="gap-2 hover:bg-accent/10"
                  >
                    <Scroll className="h-5 w-5" /> Expand Lore
                  </Button>
                  <Button 
                    size="lg" 
                    variant="ghost" 
                    onClick={() => navigate('/lore-chronicles/tutorial')} 
                    className="gap-2 hover:bg-accent/10"
                  >
                    <GraduationCap className="h-5 w-5" /> Tutorial
                  </Button>
                  <Button 
                    size="lg" 
                    variant="ghost" 
                    onClick={() => navigate('/lore-chronicles/community-lore')} 
                    className="gap-2 hover:bg-accent/10"
                  >
                    <Book className="h-5 w-5" /> Community Lore
                  </Button>
                </>
              ) : (
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')} 
                  className="gap-2 rpg-btn-primary text-primary-foreground border-0 font-semibold"
                >
                  Sign In to Play
                </Button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {featureCards.map((card, i) => (
              <motion.div 
                key={card.title} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 * (i + 1), duration: 0.5 }}
              >
                <div className="rpg-card rounded-lg p-6 h-full">
                  <card.icon className={`h-10 w-10 ${card.color} mb-4`} />
                  <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Decorative divider */}
      <div className="container mx-auto px-4">
        <div className="rpg-divider" />
      </div>

      {/* Quick Resume Banner */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <QuickResumeBanner />
        </div>
      </section>

      {/* Main Content — Grouped Tabs */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          {/* Group Selector */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg p-1 gap-1">
              {(Object.entries(tabGroups) as [TabGroup, typeof tabGroups[TabGroup]][]).map(([key, group]) => (
                <button
                  key={key}
                  onClick={() => handleGroupChange(key)}
                  className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    activeGroup === key
                      ? "bg-accent/20 text-accent border border-accent/30 shadow-sm shadow-accent/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {group.icon}
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList 
              className="grid w-full max-w-2xl mx-auto mb-8 bg-card/60 backdrop-blur-sm border border-border/50"
              style={{ gridTemplateColumns: `repeat(${tabGroups[activeGroup].tabs.length}, 1fr)` }}
            >
              {tabGroups[activeGroup].tabs.map(tab => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value} 
                  className="gap-2 data-[state=active]:bg-accent/20 data-[state=active]:text-accent data-[state=active]:shadow-sm"
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="campaigns"><CampaignBrowser /></TabsContent>
            <TabsContent value="characters"><CharacterList /></TabsContent>
            <TabsContent value="sessions"><ActiveSessions /></TabsContent>
            <TabsContent value="showcase"><CharacterShowcase /></TabsContent>
            <TabsContent value="leaderboard"><CharacterLeaderboard /></TabsContent>
            <TabsContent value="factions"><FactionLeaderboard /></TabsContent>
            <TabsContent value="graveyard"><CharacterGraveyard /></TabsContent>
            <TabsContent value="lore"><CommunityLoreAlmanac /></TabsContent>
            <TabsContent value="loremaster"><LoremasterDashboard /></TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Floating Lore Assistant Button */}
      <Button
        onClick={() => setIsLoreAssistantOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-30 rpg-btn-primary border-0"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      <LoreAssistantPanel isOpen={isLoreAssistantOpen} onClose={() => setIsLoreAssistantOpen(false)} />
      <OnboardingTour />
      <Footer />
    </div>
  );
};

export default LoreChronicles;
