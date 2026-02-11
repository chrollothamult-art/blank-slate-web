import { useState } from "react";
import { motion } from "framer-motion";
import { Scroll, FileText, Shield, Sparkles, ArrowLeft, UserPlus, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Footer } from "@/components/Footer";
import { LoreProposalForm } from "@/components/lore-chronicles/LoreProposalForm";
import { MyProposalsList } from "@/components/lore-chronicles/MyProposalsList";
import { LoremasterDashboard } from "@/components/lore-chronicles/LoremasterDashboard";
import { LoremasterApplicationForm } from "@/components/lore-chronicles/LoremasterApplicationForm";
import { LoremasterApplicationsReview } from "@/components/lore-chronicles/LoremasterApplicationsReview";
import { LoremasterLeaderboard } from "@/components/lore-chronicles/LoremasterLeaderboard";
import { useLoreProposals } from "@/hooks/useLoreProposals";
import { useLoremasterApplications } from "@/hooks/useLoremasterApplications";

const LoreExpansion = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pendingCount, isLoremaster } = useLoreProposals();
  const { applications, isAdmin } = useLoremasterApplications();
  const [activeTab, setActiveTab] = useState("submit");

  return (
    <div className="min-h-screen rpg-page">
      {/* Hero Section */}
      <section className="relative py-12 md:py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 rpg-hero-gradient" />
        
        <div className="container mx-auto relative z-10">
          <Button 
            variant="ghost" 
            className="mb-6 gap-2 hover:bg-accent/10"
            onClick={() => navigate("/lore-chronicles")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lore Chronicles
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Scroll className="h-8 w-8 text-accent rpg-pulse" />
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-accent via-amber-300 to-accent bg-clip-text text-transparent">
                Lore Expansion
              </h1>
              <Scroll className="h-8 w-8 text-accent rpg-pulse" />
            </div>
            
            <p className="text-lg text-muted-foreground">
              Contribute to the ThouArt universe. Propose new races, locations, items, and more — 
              all reviewed by Loremasters for canonical consistency.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full max-w-2xl mx-auto mb-8 ${isLoremaster || isAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
              <TabsTrigger value="submit" className="gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Submit</span>
              </TabsTrigger>
              <TabsTrigger value="my-proposals" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">My Proposals</span>
              </TabsTrigger>
              <TabsTrigger value="apply" className="gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Apply</span>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="gap-2">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Leaderboard</span>
              </TabsTrigger>
              {isLoremaster && (
                <TabsTrigger value="review" className="gap-2 relative">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Review</span>
                  {pendingCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="applications" className="gap-2 relative">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Apps</span>
                  {applications.length > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {applications.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="submit">
              <LoreProposalForm onSuccess={() => setActiveTab("my-proposals")} />
            </TabsContent>

            <TabsContent value="my-proposals">
              {user ? (
                <MyProposalsList />
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sign in to view your proposals</h3>
                  <Button onClick={() => navigate("/auth")}>Sign In</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="apply">
              <LoremasterApplicationForm />
            </TabsContent>

            <TabsContent value="leaderboard">
              <LoremasterLeaderboard />
            </TabsContent>

            {isLoremaster && (
              <TabsContent value="review">
                <LoremasterDashboard />
              </TabsContent>
            )}

            {isAdmin && (
              <TabsContent value="applications">
                <LoremasterApplicationsReview />
              </TabsContent>
            )}
          </Tabs>

          {/* Guidelines */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 p-6 bg-muted/50 rounded-xl"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Lore Submission Guidelines
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Consistency:</strong> Proposals must fit within the existing ThouArt universe lore</li>
              <li>• <strong>Originality:</strong> Avoid duplicating existing almanac entries</li>
              <li>• <strong>Detail:</strong> More detailed submissions are more likely to be approved</li>
              <li>• <strong>Balance:</strong> Items and abilities should not be overpowered</li>
              <li>• <strong>Tone:</strong> Match the medieval fantasy aesthetic of the ThouArt world</li>
            </ul>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LoreExpansion;
