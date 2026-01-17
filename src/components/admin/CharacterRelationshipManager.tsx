import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Save, X, Link, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Character {
  id: string;
  name: string;
  slug: string;
}

interface ChronologyEvent {
  id: string;
  title: string;
  date: string;
  era: string;
}

interface CharacterRelationship {
  id: string;
  character_id: string;
  related_character_id: string;
  relationship_type: string;
  description: string | null;
  character?: Character;
  related_character?: Character;
}

interface CharacterEventLink {
  id: string;
  character_id: string;
  event_id: string;
  role: string | null;
  description: string | null;
  character?: Character;
  event?: ChronologyEvent;
}

const RELATIONSHIP_TYPES = [
  // General relationships
  "ally",
  "enemy",
  "mentor",
  "student",
  "rival",
  "friend",
  "lover",
  "servant",
  "master",
  // Family relationships
  "parent",
  "child",
  "spouse",
  "sibling",
  "grandparent",
  "grandchild",
  "uncle_aunt",
  "nephew_niece",
  "cousin",
  "ancestor",
  "descendant",
];

const RELATIONSHIP_LABELS: Record<string, string> = {
  ally: "Ally",
  enemy: "Enemy",
  mentor: "Mentor",
  student: "Student",
  rival: "Rival",
  friend: "Friend",
  lover: "Lover",
  servant: "Servant",
  master: "Master",
  parent: "Parent",
  child: "Child",
  spouse: "Spouse",
  sibling: "Sibling",
  grandparent: "Grandparent",
  grandchild: "Grandchild",
  uncle_aunt: "Uncle/Aunt",
  nephew_niece: "Nephew/Niece",
  cousin: "Cousin",
  ancestor: "Ancestor",
  descendant: "Descendant",
};

export const CharacterRelationshipManager = () => {
  const [activeTab, setActiveTab] = useState("relationships");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [events, setEvents] = useState<ChronologyEvent[]>([]);
  const [relationships, setRelationships] = useState<CharacterRelationship[]>([]);
  const [eventLinks, setEventLinks] = useState<CharacterEventLink[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Relationship form
  const [relFormData, setRelFormData] = useState({
    character_id: "",
    related_character_id: "",
    relationship_type: "",
    description: "",
  });
  
  // Event link form
  const [linkFormData, setLinkFormData] = useState({
    character_id: "",
    event_id: "",
    role: "",
    description: "",
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchCharacters();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (activeTab === "relationships") {
      fetchRelationships();
    } else {
      fetchEventLinks();
    }
    resetForm();
  }, [activeTab]);

  const fetchCharacters = async () => {
    const { data, error } = await (supabase as any)
      .from("almanac_characters")
      .select("id, name, slug")
      .order("name");

    if (!error && data) {
      setCharacters(data as Character[]);
    }
  };

  const fetchEvents = async () => {
    const { data, error } = await (supabase as any)
      .from("chronology_events")
      .select("id, title, date, era")
      .order("order_index");

    if (!error && data) {
      setEvents(data as ChronologyEvent[]);
    }
  };

  const fetchRelationships = async () => {
    const { data, error } = await (supabase as any)
      .from("character_relationships")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch relationships",
        variant: "destructive",
      });
      return;
    }

    // Enrich with character names
    const enriched = (data || []).map((rel: any) => ({
      ...rel,
      character: characters.find((c) => c.id === rel.character_id),
      related_character: characters.find((c) => c.id === rel.related_character_id),
    }));

    setRelationships(enriched);
  };

  const fetchEventLinks = async () => {
    const { data, error } = await (supabase as any)
      .from("character_event_links")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch event links",
        variant: "destructive",
      });
      return;
    }

    // Enrich with character and event names
    const enriched = (data || []).map((link: any) => ({
      ...link,
      character: characters.find((c) => c.id === link.character_id),
      event: events.find((e) => e.id === link.event_id),
    }));

    setEventLinks(enriched);
  };

  // Re-fetch when characters/events load
  useEffect(() => {
    if (characters.length > 0) {
      if (activeTab === "relationships") {
        fetchRelationships();
      } else if (events.length > 0) {
        fetchEventLinks();
      }
    }
  }, [characters, events]);

  const handleRelationshipSubmit = async () => {
    if (!relFormData.character_id || !relFormData.related_character_id || !relFormData.relationship_type) {
      toast({
        title: "Error",
        description: "Please select both characters and a relationship type",
        variant: "destructive",
      });
      return;
    }

    if (relFormData.character_id === relFormData.related_character_id) {
      toast({
        title: "Error",
        description: "A character cannot have a relationship with themselves",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      character_id: relFormData.character_id,
      related_character_id: relFormData.related_character_id,
      relationship_type: relFormData.relationship_type,
      description: relFormData.description || null,
    };

    if (editingId) {
      const { error } = await (supabase as any)
        .from("character_relationships")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update relationship",
          variant: "destructive",
        });
        return;
      }
    } else {
      const { error } = await (supabase as any)
        .from("character_relationships")
        .insert(payload);

      if (error) {
        toast({
          title: "Error",
          description: error.message.includes("duplicate")
            ? "This relationship already exists"
            : "Failed to create relationship",
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Success",
      description: editingId ? "Relationship updated" : "Relationship created",
    });

    resetForm();
    fetchRelationships();
  };

  const handleEventLinkSubmit = async () => {
    if (!linkFormData.character_id || !linkFormData.event_id) {
      toast({
        title: "Error",
        description: "Please select both a character and an event",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      character_id: linkFormData.character_id,
      event_id: linkFormData.event_id,
      role: linkFormData.role || null,
      description: linkFormData.description || null,
    };

    if (editingId) {
      const { error } = await (supabase as any)
        .from("character_event_links")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update event link",
          variant: "destructive",
        });
        return;
      }
    } else {
      const { error } = await (supabase as any)
        .from("character_event_links")
        .insert(payload);

      if (error) {
        toast({
          title: "Error",
          description: error.message.includes("duplicate")
            ? "This character is already linked to this event"
            : "Failed to create event link",
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Success",
      description: editingId ? "Event link updated" : "Event link created",
    });

    resetForm();
    fetchEventLinks();
  };

  const handleEditRelationship = (rel: CharacterRelationship) => {
    setRelFormData({
      character_id: rel.character_id,
      related_character_id: rel.related_character_id,
      relationship_type: rel.relationship_type,
      description: rel.description || "",
    });
    setEditingId(rel.id);
    setIsAdding(true);
  };

  const handleEditEventLink = (link: CharacterEventLink) => {
    setLinkFormData({
      character_id: link.character_id,
      event_id: link.event_id,
      role: link.role || "",
      description: link.description || "",
    });
    setEditingId(link.id);
    setIsAdding(true);
  };

  const handleDeleteRelationship = async (id: string) => {
    if (!confirm("Delete this relationship?")) return;

    const { error } = await (supabase as any)
      .from("character_relationships")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete relationship",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Success", description: "Relationship deleted" });
    fetchRelationships();
  };

  const handleDeleteEventLink = async (id: string) => {
    if (!confirm("Delete this event link?")) return;

    const { error } = await (supabase as any)
      .from("character_event_links")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete event link",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Success", description: "Event link deleted" });
    fetchEventLinks();
  };

  const resetForm = () => {
    setRelFormData({
      character_id: "",
      related_character_id: "",
      relationship_type: "",
      description: "",
    });
    setLinkFormData({
      character_id: "",
      event_id: "",
      role: "",
      description: "",
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const getRelationshipColor = (type: string) => {
    const colors: Record<string, string> = {
      // General relationships
      ally: "bg-green-500/20 text-green-700 dark:text-green-400",
      enemy: "bg-red-500/20 text-red-700 dark:text-red-400",
      mentor: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
      student: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-400",
      rival: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
      friend: "bg-teal-500/20 text-teal-700 dark:text-teal-400",
      lover: "bg-pink-500/20 text-pink-700 dark:text-pink-400",
      servant: "bg-gray-500/20 text-gray-700 dark:text-gray-400",
      master: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
      // Family relationships
      parent: "bg-violet-500/20 text-violet-700 dark:text-violet-400",
      child: "bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-400",
      spouse: "bg-rose-500/20 text-rose-700 dark:text-rose-400",
      sibling: "bg-sky-500/20 text-sky-700 dark:text-sky-400",
      grandparent: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
      grandchild: "bg-lime-500/20 text-lime-700 dark:text-lime-400",
      uncle_aunt: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
      nephew_niece: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400",
      cousin: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
      ancestor: "bg-indigo-600/20 text-indigo-700 dark:text-indigo-400",
      descendant: "bg-purple-600/20 text-purple-700 dark:text-purple-400",
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Character Relationships & Event Links
        </h2>
        <p className="text-muted-foreground">
          Manage connections between characters and link them to chronology events
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="relationships" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Character Relationships
          </TabsTrigger>
          <TabsTrigger value="event-links" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Event Links
          </TabsTrigger>
        </TabsList>

        {/* Relationships Tab */}
        <TabsContent value="relationships" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
              <Plus className="h-4 w-4 mr-2" />
              Add Relationship
            </Button>
          </div>

          {isAdding && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">
                    {editingId ? "Edit Relationship" : "New Relationship"}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Character *</label>
                    <Select
                      value={relFormData.character_id}
                      onValueChange={(v) => setRelFormData({ ...relFormData, character_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select character" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-background border border-border shadow-lg max-h-[300px] overflow-y-auto">
                        {characters.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Relationship Type *</label>
                    <Select
                      value={relFormData.relationship_type}
                      onValueChange={(v) => setRelFormData({ ...relFormData, relationship_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-background border border-border shadow-lg max-h-[300px] overflow-y-auto">
                        {RELATIONSHIP_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {RELATIONSHIP_LABELS[type] || type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Related Character *</label>
                    <Select
                      value={relFormData.related_character_id}
                      onValueChange={(v) => setRelFormData({ ...relFormData, related_character_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select character" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-background border border-border shadow-lg max-h-[300px] overflow-y-auto">
                        {characters
                          .filter((c) => c.id !== relFormData.character_id)
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description (optional)</label>
                  <Textarea
                    value={relFormData.description}
                    onChange={(e) => setRelFormData({ ...relFormData, description: e.target.value })}
                    placeholder="Additional details about this relationship..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button onClick={handleRelationshipSubmit}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingId ? "Update" : "Create"} Relationship
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Character</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Related Character</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relationships.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No relationships defined yet
                    </TableCell>
                  </TableRow>
                ) : (
                  relationships.map((rel) => (
                    <TableRow key={rel.id}>
                      <TableCell className="font-medium">
                        {rel.character?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getRelationshipColor(rel.relationship_type)}>
                          {rel.relationship_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {rel.related_character?.name || "Unknown"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {rel.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditRelationship(rel)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRelationship(rel.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Event Links Tab */}
        <TabsContent value="event-links" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
              <Plus className="h-4 w-4 mr-2" />
              Link Character to Event
            </Button>
          </div>

          {isAdding && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">
                    {editingId ? "Edit Event Link" : "New Event Link"}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Character *</label>
                    <Select
                      value={linkFormData.character_id}
                      onValueChange={(v) => setLinkFormData({ ...linkFormData, character_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select character" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-background border border-border shadow-lg max-h-[300px] overflow-y-auto">
                        {characters.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Event *</label>
                    <Select
                      value={linkFormData.event_id}
                      onValueChange={(v) => setLinkFormData({ ...linkFormData, event_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-background border border-border shadow-lg max-h-[300px] overflow-y-auto">
                        {events.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.title} ({e.date})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Role (optional)</label>
                  <Input
                    value={linkFormData.role}
                    onChange={(e) => setLinkFormData({ ...linkFormData, role: e.target.value })}
                    placeholder="e.g., Protagonist, Witness, Instigator..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description (optional)</label>
                  <Textarea
                    value={linkFormData.description}
                    onChange={(e) => setLinkFormData({ ...linkFormData, description: e.target.value })}
                    placeholder="How this character was involved in the event..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button onClick={handleEventLinkSubmit}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingId ? "Update" : "Create"} Link
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Character</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventLinks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No event links defined yet
                    </TableCell>
                  </TableRow>
                ) : (
                  eventLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">
                        {link.character?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{link.event?.title || "Unknown"}</p>
                          {link.event && (
                            <p className="text-xs text-muted-foreground">
                              {link.event.date}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {link.role ? (
                          <Badge variant="secondary">{link.role}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {link.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditEventLink(link)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEventLink(link.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
