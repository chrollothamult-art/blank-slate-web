import { DynamicRelationshipMap } from "@/components/DynamicRelationshipMap";
import { AllEventsRelationshipMap } from "@/components/AllEventsRelationshipMap";
import { FamilyTreeMap } from "@/components/FamilyTreeMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, GitBranch } from "lucide-react";

const RelationshipsMap = () => {
  return (
    <main className="min-h-screen bg-[hsl(var(--parchment-bg))]">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[hsl(var(--parchment-brown))] mb-1 sm:mb-2">
            Relationships Map
          </h1>
          <p className="text-sm sm:text-base text-[hsl(var(--parchment-muted))]">
            Explore the connections between characters and events
          </p>
        </div>

        <Tabs defaultValue="characters" className="w-full">
          <TabsList className="mb-4 sm:mb-6 w-full grid grid-cols-3 h-auto bg-[hsl(var(--parchment-card))] border border-[hsl(var(--parchment-border))]">
            <TabsTrigger 
              value="characters" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-[hsl(var(--parchment-gold))] data-[state=active]:text-[hsl(var(--parchment-brown))]"
            >
              <Users className="h-4 w-4" />
              <span className="hidden xs:inline">Characters</span>
              <span className="xs:hidden">Chars</span>
            </TabsTrigger>
            <TabsTrigger 
              value="family"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-[hsl(var(--parchment-gold))] data-[state=active]:text-[hsl(var(--parchment-brown))]"
            >
              <GitBranch className="h-4 w-4" />
              <span className="hidden xs:inline">Family</span>
              <span className="xs:hidden">Tree</span>
            </TabsTrigger>
            <TabsTrigger 
              value="events"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-[hsl(var(--parchment-gold))] data-[state=active]:text-[hsl(var(--parchment-brown))]"
            >
              <Calendar className="h-4 w-4" />
              <span>Events</span>
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
        </Tabs>
      </div>
    </main>
  );
};

export default RelationshipsMap;
