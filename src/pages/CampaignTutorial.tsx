import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, BookOpen, Sparkles, Globe, Scroll,
  GitBranch, MessageSquare, Zap, Shield, Bot, Users, ChevronRight,
  Lightbulb, Target, Flame, Play, Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";

interface TutorialStep {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  details: string[];
  tip?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "basics",
    title: "Campaign Basics",
    icon: <BookOpen className="h-6 w-6" />,
    description: "Every campaign starts with a title, genre, and difficulty. These help players discover your adventure.",
    details: [
      "Choose a compelling title that hints at the adventure",
      "Pick a genre (Adventure, Mystery, Horror, Romance, Fantasy, Political)",
      "Set difficulty — Easy is forgiving, Nightmare enables permadeath",
      "Write a description that hooks players without spoiling the story",
      "Optionally add a cover image to make your campaign stand out"
    ],
    tip: "Start with 'Normal' difficulty for your first campaign — you can always adjust later."
  },
  {
    id: "universe",
    title: "Universe Mode",
    icon: <Globe className="h-6 w-6" />,
    description: "Choose between the official ThouArt universe or build your own from scratch.",
    details: [
      "ThouArt Variation — uses official races, magic, relics, and lore from the Witness Almanac",
      "Original Universe — create custom races, magic systems, factions, and world rules",
      "ThouArt mode auto-links lore references to the Almanac",
      "Original mode gives you the Custom World Builder for full creative freedom",
      "You can define custom stats, beliefs, weapons, and titles in Original mode"
    ],
    tip: "If this is your first campaign, try ThouArt mode — you'll have ready-made lore to work with."
  },
  {
    id: "nodes",
    title: "Story Nodes",
    icon: <GitBranch className="h-6 w-6" />,
    description: "Your story is built from interconnected nodes — each one is a scene, choice, or event.",
    details: [
      "Narrative nodes — pure story text with a 'Continue' button",
      "Choice nodes — present 2-4 options that branch to different nodes",
      "Stat Check nodes — pass/fail based on the player's character stats",
      "Ending nodes — conclude the campaign with an outcome summary",
      "Each node can have header images, audio, and NPC portraits",
      "Connect nodes by setting target_node_id on each choice"
    ],
    tip: "Start with a simple linear story (5-6 nodes), then add branches once you're comfortable."
  },
  {
    id: "choices",
    title: "Choices & Stat Requirements",
    icon: <MessageSquare className="h-6 w-6" />,
    description: "Make choices meaningful by gating them behind stats, items, or story flags.",
    details: [
      "Add stat requirements to choices (e.g., Charisma ≥ 4 to persuade)",
      "Define stat effects — choices can boost or reduce player stats",
      "Set item requirements — some paths need specific inventory items",
      "Item rewards — grant items upon choosing a path",
      "XP rewards per node — ending nodes typically give more XP"
    ],
    tip: "Always provide at least one ungated option so players never get stuck."
  },
  {
    id: "keypoints",
    title: "Key Points & Dynamic Paths",
    icon: <Target className="h-6 w-6" />,
    description: "Anchor your narrative with major milestones connected by flexible player-driven paths.",
    details: [
      "Key Points are major story milestones that anchor the arc",
      "Between key points, paths can be linear, conditional, or random",
      "Conditional paths activate based on player stats, flags, or items",
      "Players navigate dynamically between key points via authored choices",
      "Key Point branching — which milestones occur depends on prior actions"
    ],
    tip: "Think of Key Points as 'checkpoints' — the journey between them is where player freedom lives."
  },
  {
    id: "triggers",
    title: "Event Triggers & Random Events",
    icon: <Zap className="h-6 w-6" />,
    description: "Create dynamic events that fire when specific conditions are met.",
    details: [
      "Triggers: stat threshold, item possessed, flag set, faction reputation",
      "Combine triggers with AND/OR logic for complex conditions",
      "Random Events fire with a % probability when conditions match",
      "Random events add replayability — ambushes, discoveries, weather changes",
      "Cooldowns prevent the same random event from firing too frequently"
    ],
    tip: "Use random events sparingly — 2-3 per campaign section keeps things exciting without feeling chaotic."
  },
  {
    id: "ai",
    title: "AI Dungeon Master",
    icon: <Bot className="h-6 w-6" />,
    description: "Let AI narrate transitions between your authored nodes for a richer experience.",
    details: [
      "Toggle AI narration per node — some scenes are better hand-crafted",
      "Write DM Instructions to set tone, constraints, and NPC personalities",
      "Inject Almanac lore context so the AI references real world entries",
      "Enable free-text input on select nodes — AI interprets player actions",
      "Set guardrails: PG-13 only, no romance, no real-world references, etc."
    ],
    tip: "Give the AI specific DM instructions like 'dark and foreboding tone, never kill the player outright.'"
  },
  {
    id: "multiplayer",
    title: "Multiplayer & Convergence",
    icon: <Users className="h-6 w-6" />,
    description: "Create campaigns where multiple players start separately and paths eventually merge.",
    details: [
      "Define multiple entry points — each player/faction starts differently",
      "Convergence nodes merge player paths at dramatic moments",
      "Alliance/Enemy resolution based on prior faction choices",
      "Post-convergence branching continues differently for allied vs enemy groups",
      "Session codes let players join the same campaign together"
    ],
    tip: "Multiplayer convergence is advanced — master single-player campaigns first."
  },
  {
    id: "publish",
    title: "Testing & Publishing",
    icon: <Play className="h-6 w-6" />,
    description: "Test your campaign thoroughly, then publish for the world to play.",
    details: [
      "Your campaign stays as a draft until you explicitly publish it",
      "Use the 'Preview' option in the editor to playtest your story",
      "Check all node connections — dead ends frustrate players",
      "Verify stat checks are balanced (not too easy or impossible)",
      "Once published, players can discover and play your campaign",
      "You can unpublish anytime to make edits without affecting new players"
    ],
    tip: "Play through your campaign yourself at least twice — once following hints, once ignoring them."
  }
];

const CampaignTutorial = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const step = tutorialSteps[currentStep];
  const progress = ((completedSteps.size) / tutorialSteps.length) * 100;

  const markComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToStep = (index: number) => {
    setCurrentStep(index);
  };

  return (
    <div className="min-h-screen rpg-page py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/lore-chronicles')} className="hover:bg-accent/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-accent to-amber-300 bg-clip-text text-transparent">
              My First Campaign
            </h1>
            <p className="text-muted-foreground">A step-by-step guide to creating your adventure</p>
          </div>
          {user && (
            <Button
              onClick={() => navigate('/lore-chronicles/create-campaign')}
              className="rpg-btn-primary text-primary-foreground border-0 gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Start Creating
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {completedSteps.size} of {tutorialSteps.length} steps reviewed
            </span>
            <span className="text-sm font-medium text-accent">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Step Navigation Sidebar */}
          <div className="space-y-1">
            {tutorialSteps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goToStep(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm transition-all ${
                  i === currentStep
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : completedSteps.has(i)
                    ? "bg-muted/30 text-foreground hover:bg-muted/50"
                    : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                }`}
              >
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  completedSteps.has(i)
                    ? "bg-green-500/20 text-green-500"
                    : i === currentStep
                    ? "bg-accent/20 text-accent"
                    : "bg-muted/50 text-muted-foreground"
                }`}>
                  {completedSteps.has(i) ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="rpg-card border-border/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-accent/10 text-accent">
                      {step.icon}
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-1 text-xs">
                        Step {currentStep + 1} of {tutorialSteps.length}
                      </Badge>
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>

                  <div className="space-y-3">
                    {step.details.map((detail, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/20"
                      >
                        <ChevronRight className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{detail}</span>
                      </motion.div>
                    ))}
                  </div>

                  {step.tip && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/5 border border-accent/20">
                      <Lightbulb className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-accent">Pro Tip</span>
                        <p className="text-sm text-muted-foreground mt-1">{step.tip}</p>
                      </div>
                    </div>
                  )}

                  {/* Interactive Demo Button */}
                  {(step.id === "basics" || step.id === "universe" || step.id === "nodes") && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <Compass className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-sm font-medium">Try it yourself!</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Open the campaign creator with an interactive guided walkthrough
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate('/lore-chronicles/create-campaign?tour=true')}
                        className="rpg-btn-primary text-primary-foreground border-0 gap-1.5"
                      >
                        <Play className="h-3 w-3" />
                        Demo
                      </Button>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      disabled={currentStep === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    
                    <div className="flex gap-2">
                      {!completedSteps.has(currentStep) && (
                        <Button variant="outline" onClick={markComplete} className="gap-2">
                          <Check className="h-4 w-4" />
                          Mark as Read
                        </Button>
                      )}
                      {currentStep < tutorialSteps.length - 1 ? (
                        <Button onClick={() => { markComplete(); }} className="rpg-btn-primary text-primary-foreground border-0 gap-2">
                          Next Step
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          onClick={() => navigate('/lore-chronicles/create-campaign')}
                          className="rpg-btn-primary text-primary-foreground border-0 gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          Create Your Campaign
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CampaignTutorial;
