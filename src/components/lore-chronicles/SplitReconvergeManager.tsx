import { useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, RefreshCw, ArrowDown, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ConvergenceNode } from "@/hooks/useConvergence";

interface ExtendedConvergenceNode extends ConvergenceNode {
  is_reconvergence?: boolean;
  split_from_convergence_id?: string | null;
  reconverge_order?: number;
}

interface SplitReconvergeManagerProps {
  convergenceNodes: ExtendedConvergenceNode[];
  onUpdate: () => void;
}

export const SplitReconvergeManager = ({
  convergenceNodes,
  onUpdate,
}: SplitReconvergeManagerProps) => {
  const [saving, setSaving] = useState(false);

  const handleToggleReconvergence = async (nodeId: string, isReconvergence: boolean) => {
    setSaving(true);
    const { error } = await supabase
      .from("rp_convergence_nodes")
      .update({ is_reconvergence: isReconvergence })
      .eq("id", nodeId);

    if (error) {
      toast({ title: "Failed to update", variant: "destructive" });
    } else {
      onUpdate();
    }
    setSaving(false);
  };

  const handleSetSplitFrom = async (nodeId: string, splitFromId: string | null) => {
    setSaving(true);
    const { error } = await supabase
      .from("rp_convergence_nodes")
      .update({ split_from_convergence_id: splitFromId })
      .eq("id", nodeId);

    if (error) {
      toast({ title: "Failed to update", variant: "destructive" });
    } else {
      onUpdate();
    }
    setSaving(false);
  };

  const handleSetOrder = async (nodeId: string, order: number) => {
    setSaving(true);
    const { error } = await supabase
      .from("rp_convergence_nodes")
      .update({ reconverge_order: order })
      .eq("id", nodeId);

    if (error) {
      toast({ title: "Failed to update", variant: "destructive" });
    } else {
      onUpdate();
    }
    setSaving(false);
  };

  // Sort by reconverge_order
  const sorted = [...convergenceNodes].sort(
    (a, b) => (a.reconverge_order || 0) - (b.reconverge_order || 0)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          Split & Reconverge
        </CardTitle>
        <CardDescription>
          Allow paths to split and merge multiple times throughout the campaign
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sorted.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No convergence nodes to configure</p>
            <p className="text-sm">Create convergence nodes first</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((node, index) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border rounded-lg p-4 bg-card space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-muted-foreground">
                      #{(node.reconverge_order || 0) + 1}
                    </span>
                    <h4 className="font-medium">{node.name}</h4>
                    {node.is_reconvergence && (
                      <Badge variant="secondary" className="gap-1">
                        <RefreshCw className="h-3 w-3" />
                        Reconvergence
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={node.is_reconvergence || false}
                      onCheckedChange={(v) => handleToggleReconvergence(node.id, v)}
                      disabled={saving}
                    />
                    <Label className="text-sm">Is Reconvergence</Label>
                  </div>

                  {node.is_reconvergence && (
                    <div>
                      <Label className="text-xs">Split From</Label>
                      <Select
                        value={node.split_from_convergence_id || "none"}
                        onValueChange={(v) => handleSetSplitFrom(node.id, v === "none" ? null : v)}
                        disabled={saving}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— None —</SelectItem>
                          {convergenceNodes
                            .filter((n) => n.id !== node.id)
                            .map((n) => (
                              <SelectItem key={n.id} value={n.id}>
                                {n.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs">Order</Label>
                    <Select
                      value={String(node.reconverge_order || 0)}
                      onValueChange={(v) => handleSetOrder(node.id, parseInt(v))}
                      disabled={saving}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            Position {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {index < sorted.length - 1 && (
                  <div className="flex justify-center pt-2">
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
