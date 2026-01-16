import { CharacterRelationshipMap } from "@/components/CharacterRelationshipMap";
import { AllEventsRelationshipMap } from "@/components/AllEventsRelationshipMap";
import { FamilyTreeMap } from "@/components/FamilyTreeMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, GitBranch } from "lucide-react";

const RelationshipsMap = () => {
  return (
    <main className="min-h-screen bg-[hsl(var(--parchment-bg))]">
      <div className="container mx-auto px-4 py-8">
        {/* Animated Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-4xl font-bold text-[hsl(var(--parchment-brown))] mb-2 animate-[fade-in_0.5s_ease-out]">
            Relationships Map
          </h1>
          <p className="text-[hsl(var(--parchment-muted))] animate-[fade-in_0.6s_ease-out_0.1s_both]">
            Explore the connections between characters and events in the Thouart universe
          </p>
        </div>

        <Tabs defaultValue="characters" className="w-full">
          {/* Animated Tab List */}
          <TabsList className="mb-6 bg-[hsl(var(--parchment-card))] border border-[hsl(var(--parchment-border))] animate-[fade-in_0.5s_ease-out_0.2s_both]">
            <TabsTrigger 
              value="characters" 
              className="data-[state=active]:bg-[hsl(var(--parchment-gold))] data-[state=active]:text-[hsl(var(--parchment-brown))] transition-all duration-300 hover:scale-105 data-[state=active]:shadow-md"
            >
              <Users className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-12" />
              Character Relationships
            </TabsTrigger>
            <TabsTrigger 
              value="family"
              className="data-[state=active]:bg-[hsl(var(--parchment-gold))] data-[state=active]:text-[hsl(var(--parchment-brown))] transition-all duration-300 hover:scale-105 data-[state=active]:shadow-md"
            >
              <GitBranch className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-12" />
              Family Tree
            </TabsTrigger>
            <TabsTrigger 
              value="events"
              className="data-[state=active]:bg-[hsl(var(--parchment-gold))] data-[state=active]:text-[hsl(var(--parchment-brown))] transition-all duration-300 hover:scale-105 data-[state=active]:shadow-md"
            >
              <Calendar className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-12" />
              Event Connections
            </TabsTrigger>
          </TabsList>

          {/* Animated Tab Content */}
          <TabsContent 
            value="characters" 
            className="animate-[fade-in_0.4s_ease-out] data-[state=inactive]:animate-[fade-out_0.2s_ease-out]"
          >
            <div className="animate-scale-in">
              <CharacterRelationshipMap />
            </div>
          </TabsContent>

          <TabsContent 
            value="family"
            className="animate-[fade-in_0.4s_ease-out] data-[state=inactive]:animate-[fade-out_0.2s_ease-out]"
          >
            <div className="animate-scale-in">
              <FamilyTreeMap />
            </div>
          </TabsContent>

          <TabsContent 
            value="events"
            className="animate-[fade-in_0.4s_ease-out] data-[state=inactive]:animate-[fade-out_0.2s_ease-out]"
          >
            <div className="animate-scale-in">
              <AllEventsRelationshipMap />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default RelationshipsMap;
