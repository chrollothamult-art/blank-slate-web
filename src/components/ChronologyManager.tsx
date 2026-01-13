import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChronologyEvent {
  id: string;
  title: string;
  date: string;
  era: 'BGD' | 'GD' | 'AGD';
  description: string;
  article: string;
  order_index: number;
}

export const ChronologyManager = () => {
  const [events, setEvents] = useState<ChronologyEvent[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    date: string;
    era: 'BGD' | 'GD' | 'AGD';
    description: string;
    article: string;
  }>({
    title: "",
    date: "",
    era: "BGD",
    description: "",
    article: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("chronology_events")
      .select("*")
      .order("order_index", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch chronology events",
        variant: "destructive",
      });
      return;
    }

    setEvents(data as ChronologyEvent[] || []);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.date || !formData.description || !formData.article) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const orderIndex = editingId 
      ? events.find(e => e.id === editingId)?.order_index || 0
      : events.length;

    if (editingId) {
      const { error } = await supabase
        .from("chronology_events")
        .update({
          title: formData.title,
          date: formData.date,
          era: formData.era,
          description: formData.description,
          article: formData.article,
        })
        .eq("id", editingId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update event",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    } else {
      const { error } = await supabase
        .from("chronology_events")
        .insert({
          ...formData,
          order_index: orderIndex,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add event",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Event added successfully",
      });
    }

    resetForm();
    fetchEvents();
  };

  const handleEdit = (event: ChronologyEvent) => {
    setFormData({
      title: event.title,
      date: event.date,
      era: event.era,
      description: event.description,
      article: event.article,
    });
    setEditingId(event.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    const { error } = await supabase
      .from("chronology_events")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Event deleted successfully",
    });

    fetchEvents();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      date: "",
      era: "BGD",
      description: "",
      article: "",
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const getEraLabel = (era: string) => {
    switch (era) {
      case "BGD": return "Before Great Darkening";
      case "GD": return "Great Darkening";
      case "AGD": return "After Great Darkening";
      default: return era;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold">Chronology Events</h2>
          <p className="text-muted-foreground">Manage timeline events for the Realms</p>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      {isAdding && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {editingId ? "Edit Event" : "New Event"}
              </h3>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Event title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <Input
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  placeholder="e.g., 2700 BGD"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Era</label>
              <select
                value={formData.era}
                onChange={(e) => setFormData({ ...formData, era: e.target.value as 'BGD' | 'GD' | 'AGD' })}
                className="w-full border border-input bg-background px-3 py-2 rounded-md"
              >
                <option value="BGD">Before Great Darkening (BGD)</option>
                <option value="GD">Great Darkening (GD)</option>
                <option value="AGD">After Great Darkening (AGD)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Brief Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description shown on hover"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Full Article</label>
              <Textarea
                value={formData.article}
                onChange={(e) => setFormData({ ...formData, article: e.target.value })}
                placeholder="Full article content"
                rows={8}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                <Save className="h-4 w-4 mr-2" />
                {editingId ? "Update" : "Add"} Event
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Title</th>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Era</th>
                <th className="text-left p-4">Description</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b hover:bg-muted/50">
                  <td className="p-4 font-medium">{event.title}</td>
                  <td className="p-4">{event.date}</td>
                  <td className="p-4">
                    <Badge variant="outline">{getEraLabel(event.era)}</Badge>
                  </td>
                  <td className="p-4 max-w-md truncate">{event.description}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(event.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No events yet. Add your first chronology event!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
