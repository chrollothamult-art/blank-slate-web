import { useState, useEffect } from "react";
import { Plus, Trash2, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CampaignNPC {
  id: string;
  campaign_id: string;
  name: string;
  description: string | null;
  portrait_url: string | null;
  expressions: Record<string, string> | null;
}

interface NPCPortraitManagerProps {
  campaignId: string;
}

export const NPCPortraitManager = ({ campaignId }: NPCPortraitManagerProps) => {
  const [npcs, setNpcs] = useState<CampaignNPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<CampaignNPC | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    portrait_url: "",
    expressions: {} as Record<string, string>,
  });

  useEffect(() => {
    fetchNPCs();
  }, [campaignId]);

  const fetchNPCs = async () => {
    const { data } = await supabase
      .from("rp_campaign_npcs")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("name");

    setNpcs((data || []).map(d => ({
      ...d,
      expressions: d.expressions as Record<string, string> | null,
    })));
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", portrait_url: "", expressions: {} });
    setShowDialog(true);
  };

  const openEdit = (npc: CampaignNPC) => {
    setEditing(npc);
    setForm({
      name: npc.name,
      description: npc.description || "",
      portrait_url: npc.portrait_url || "",
      expressions: npc.expressions || {},
    });
    setShowDialog(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "NPC name is required", variant: "destructive" });
      return;
    }

    const payload = {
      campaign_id: campaignId,
      name: form.name,
      description: form.description || null,
      portrait_url: form.portrait_url || null,
      expressions: Object.keys(form.expressions).length > 0 ? form.expressions : null,
    };

    if (editing) {
      const { error } = await supabase
        .from("rp_campaign_npcs")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast({ title: "Failed to update NPC", variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from("rp_campaign_npcs")
        .insert(payload);
      if (error) {
        toast({ title: "Failed to create NPC", variant: "destructive" });
        return;
      }
    }

    setShowDialog(false);
    fetchNPCs();
    toast({ title: editing ? "NPC updated" : "NPC created" });
  };

  const deleteNPC = async (id: string) => {
    await supabase.from("rp_campaign_npcs").delete().eq("id", id);
    setNpcs(npcs.filter(n => n.id !== id));
    toast({ title: "NPC deleted" });
  };

  const updateExpression = (expr: string, url: string) => {
    setForm(prev => ({
      ...prev,
      expressions: { ...prev.expressions, [expr]: url },
    }));
  };

  const removeExpression = (expr: string) => {
    setForm(prev => {
      const next = { ...prev.expressions };
      delete next[expr];
      return { ...prev, expressions: next };
    });
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">Loading NPCs...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            NPC Portraits
          </h3>
          <p className="text-sm text-muted-foreground">Define NPCs with portraits and expression variants</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add NPC
        </Button>
      </div>

      {npcs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No NPCs defined yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Add NPCs with portraits to enhance story nodes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {npcs.map(npc => (
            <Card key={npc.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => openEdit(npc)}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 ring-2 ring-border">
                    <AvatarImage src={npc.portrait_url || undefined} alt={npc.name} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {npc.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{npc.name}</p>
                    {npc.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{npc.description}</p>
                    )}
                    {npc.expressions && Object.keys(npc.expressions).length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {Object.keys(npc.expressions).map(expr => (
                          <Badge key={expr} variant="outline" className="text-xs">{expr}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); deleteNPC(npc.id); }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* NPC Editor Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit NPC" : "New NPC"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="NPC name" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." rows={2} />
            </div>
            <div>
              <Label>Default Portrait URL</Label>
              <Input value={form.portrait_url} onChange={e => setForm(p => ({ ...p, portrait_url: e.target.value }))} placeholder="https://..." />
              {form.portrait_url && (
                <Avatar className="h-16 w-16 mt-2">
                  <AvatarImage src={form.portrait_url} />
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Expression Variants */}
            <div>
              <Label>Expression Variants</Label>
              <p className="text-xs text-muted-foreground mb-2">Add portrait URLs for different expressions</p>
              {["happy", "angry", "sad"].map(expr => (
                <div key={expr} className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="w-16 justify-center text-xs">{expr}</Badge>
                  <Input
                    value={form.expressions[expr] || ""}
                    onChange={e => updateExpression(expr, e.target.value)}
                    placeholder={`URL for ${expr} expression`}
                    className="flex-1"
                  />
                  {form.expressions[expr] && (
                    <Button variant="ghost" size="icon" onClick={() => removeExpression(expr)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
