import { DynamicRelationshipMap } from "@/components/DynamicRelationshipMap";
import { AllEventsRelationshipMap } from "@/components/AllEventsRelationshipMap";
import { FamilyTreeMap } from "@/components/FamilyTreeMap";
import { InteractiveWorldMap } from "@/components/InteractiveWorldMap";
import { CharacterComparison } from "@/components/CharacterComparison";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, GitBranch, MapPin, Scale } from "lucide-react";

const RelationshipsMap = () => {
  return (
    <main className="min-h-screen bg-[hsl(var(--parchment-bg))]">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6 text-left">
          <h1 className="font-heading text-3xl font-bold text-[hsl(var(--parchment-brown))] mb-1">
            Relationships Map
          </h1>
          <p className="text-sm text-[hsl(var(--parchment-muted))]">
            Explore the connections between characters and events in the Thouart universe
          </p>
        </div>

        <Tabs defaultValue="characters" className="w-full">
          <TabsList className="mb-4 bg-[hsl(var(--parchment-card))] border border-[hsl(var(--parchment-border))] flex-wrap h-auto justify-start">
            <TabsTrigger 
              value="characters" 
              className="data-[state=active]:bg-[hsl(var(--parchment-gold))] data-[state=active]:text-[hsl(var(--parchment-brown))] text-sm"
            >
              <Users className="h-4 w-4 mr-1.5" />
              Characters
            </TabsTrigger>
            <TabsTrigger 
              value="family"
              className="data-[state=active]:bg-[hsl(var(--parchment-gold))] data-[state=active]:text-[hsl(var(--parchment-brown))] text-sm"
            >
              <GitBranch className="h-4 w-4 mr-1.5" />
              Family Tree
            </TabsTrigger>
            <TabsTrigger 
              value="events"
              className="data-[state=active]:bg-[hsl(var(--parchment-gold))] data-[state=active]:text-[hsl(var(--parchment-brown))] text-sm"
            >
              <Calendar className="h-4 w-4 mr-1.5" />
              Events
            </TabsTrigger>
            <TabsTrigger 
              value="world"
              className="data-[state=active]:bg-[hsl(var(--parchment-gold))] data-[state=active]:text-[hsl(var(--parchment-brown))] text-sm"
            >
              <MapPin className="h-4 w-4 mr-1.5" />
              World Map
            </TabsTrigger>
            <TabsTrigger 
              value="compare"
              className="data-[state=active]:bg-[hsl(var(--parchment-gold))] data-[state=active]:text-[hsl(var(--parchment-brown))] text-sm"
            >
              <Scale className="h-4 w-4 mr-1.5" />
              Compare
            </TabsTrigger>
          </TabsList>

          <TabsContent value="characters">
            <DynamicRelationshipMap />
          </TabsContent>

          <TabsContent value="family">
            <FamilyTreeMap />
          </TabsContent>

          <TabsContent value="events">
            <AllEventsRelationshipMap />
          </TabsContent>

          <TabsContent value="world">
            <InteractiveWorldMap />
          </TabsContent>

          <TabsContent value="compare">
            <CharacterComparison />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default RelationshipsMap;
