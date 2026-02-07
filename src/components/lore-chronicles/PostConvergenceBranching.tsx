import { useState } from "react";
import { GitFork, ArrowRight, Shield, Swords, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ConvergenceNode } from "@/hooks/useConvergence";

interface PostConvergenceBranchingProps {
  convergenceNode: ConvergenceNode & {
    ally_node_id?: string | null;
    enemy_node_id?: string | null;
    neutral_node_id?: string | null;
  };
  storyNodes: Array<{ id: string; node_type: string; title?: string | null }>;
  onUpdate: () => void;
}

const RESULT_PATHS = [
  { key: "ally_node_id", label: "Allied Path", icon: Shield, color: "text-green-500", description: "Story branch when players become allies" },
  { key: "enemy_node_id", label: "Enemy Path", icon: Swords, color: "text-red-500", description: "Story branch when players become enemies" },
  { key: "neutral_node_id", label: "Neutral Path", icon: Minus, color: "text-muted-foreground", description: "Story branch when players are neutral" },
] as const;

export const PostConvergenceBranching = ({
  convergenceNode,
  storyNodes,
  onUpdate,
}: PostConvergenceBranchingProps) => {
  const [saving, setSaving] = useState(false);

  const handleSetPath = async (pathKey: string, nodeId: string | null) => {
    setSaving(true);
    const { error } = await supabase
      .from("rp_convergence_nodes")
      .update({ [pathKey]: nodeId })
      .eq("id", convergenceNode.id);

    if (error) {
      toast({ title: "Failed to update path", variant: "destructive" });
    } else {
      toast({ title: "Path updated!" });
      onUpdate();
    }
    setSaving(false);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GitFork className="h-4 w-4 text-primary" />
          Post-Convergence Branching
        </CardTitle>
        <CardDescription>
          Set different story paths based on convergence result
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {RESULT_PATHS.map(({ key, label, icon: Icon, color, description }) => {
          const currentNodeId = (convergenceNode as unknown as Record<string, unknown>)[key] as string | null;
          const currentNode = storyNodes.find((n) => n.id === currentNodeId);

          return (
            <div key={key} className="flex items-center gap-3">
              <Icon className={`h-5 w-5 ${color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select
                value={currentNodeId || "none"}
                onValueChange={(v) => handleSetPath(key, v === "none" ? null : v)}
                disabled={saving}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select node..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {storyNodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.title || `${node.node_type} - ${node.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
