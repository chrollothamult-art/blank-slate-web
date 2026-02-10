import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sword, Users, BookOpen, Sparkles, Plus, Play, Scroll, Crown, Book, Trophy, Shield, Flag, MessageCircle, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { QuickResumeBanner } from "@/components/lore-chronicles/QuickResumeBanner";

type TabGroup = "play" | "community" | "govern";

const tabGroups: Record<TabGroup, { label: string; tabs: { value: string; icon: React.ReactNode; label: string }[] }> = {
  play: {
    label: "Play",
    tabs: [
      { value: "campaigns", icon: <BookOpen className="h-4 w-4" />, label: "Campaigns" },
      { value: "characters", icon: <Sword className="h-4 w-4" />, label: "Characters" },
      { value: "sessions", icon: <Play className="h-4 w-4" />, label: "Sessions" },
    ],
  },
  community: {
    label: "Community",
    tabs: [
      { value: "showcase", icon: <Crown className="h-4 w-4" />, label: "Showcase" },
      { value: "leaderboard", icon: <Trophy className="h-4 w-4" />, label: "Leaderboard" },
      { value: "factions", icon: <Flag className="h-4 w-4" />, label: "Factions" },
      { value: "graveyard", icon: <Skull className="h-4 w-4" />, label: "Graveyard" },
    ],
  },
  govern: {
    label: "Govern",
    tabs: [
      { value: "lore", icon: <Book className="h-4 w-4" />, label: "Lore" },
      { value: "loremaster", icon: <Shield className="h-4 w-4" />, label: "Loremaster" },
    ],
  },
};

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
                  <Button size="lg" onClick={() => navigate('/lore-chronicles/create-character')} className="gap-2">
                    <Plus className="h-5 w-5" /> Create Character
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/lore-chronicles/create-campaign')} className="gap-2">
                    <BookOpen className="h-5 w-5" /> Create Campaign
                  </Button>
                  <JoinSessionDialog
                    trigger={
                      <Button size="lg" variant="secondary" className="gap-2">
                        <Users className="h-5 w-5" /> Join Session
                      </Button>
                    }
                  />
                  <Button size="lg" variant="ghost" onClick={() => navigate('/lore-chronicles/lore-expansion')} className="gap-2">
                    <Scroll className="h-5 w-5" /> Expand Lore
                  </Button>
                  <Button size="lg" variant="ghost" onClick={() => navigate('/lore-chronicles/community-lore')} className="gap-2">
                    <Book className="h-5 w-5" /> Community Lore
                  </Button>
                </>
              ) : (
                <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
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
            {[
              { icon: <Sword className="h-10 w-10 text-primary mb-2" />, title: "Create Characters", desc: "Choose from races in the Witness Almanac, allocate stats, and craft your backstory" },
              { icon: <BookOpen className="h-10 w-10 text-primary mb-2" />, title: "Branching Adventures", desc: "Explore user-created campaigns with meaningful choices that shape your story" },
              { icon: <Users className="h-10 w-10 text-primary mb-2" />, title: "Expand the Lore", desc: "Propose new races, locations, and items — moderated by Loremasters for consistency" },
            ].map((card, i) => (
              <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (i + 1) }}>
                <Card className="h-full border-primary/20 hover:border-primary/40 transition-colors">
                  <CardHeader>
                    {card.icon}
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Resume Banner */}
      <section className="px-4">
        <div className="container mx-auto">
          <QuickResumeBanner />
        </div>
      </section>

      {/* Main Content — Grouped Tabs */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          {/* Group Selector */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex bg-muted rounded-lg p-1 gap-1">
              {(Object.entries(tabGroups) as [TabGroup, typeof tabGroups[TabGroup]][]).map(([key, group]) => (
                <button
                  key={key}
                  onClick={() => handleGroupChange(key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeGroup === key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full max-w-2xl mx-auto mb-8`} style={{ gridTemplateColumns: `repeat(${tabGroups[activeGroup].tabs.length}, 1fr)` }}>
              {tabGroups[activeGroup].tabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
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
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-30"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      <LoreAssistantPanel isOpen={isLoreAssistantOpen} onClose={() => setIsLoreAssistantOpen(false)} />
      <Footer />
    </div>
  );
};

export default LoreChronicles;
