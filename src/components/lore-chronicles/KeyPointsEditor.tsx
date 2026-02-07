import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Flag, Plus, Trash2, Link2, ArrowRight, GripVertical, 
  Star, CircleDot, Edit, Save, X 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useKeyPoints, KeyPoint, KeyPointPath } from "@/hooks/useKeyPoints";

interface Props {
  campaignId: string;
  storyNodes: Array<{ id: string; title: string | null }>;
}

export const KeyPointsEditor = ({ campaignId, storyNodes }: Props) => {
  const { keyPoints, paths, loading, fetchKeyPoints, createKeyPoint, updateKeyPoint, deleteKeyPoint, createPath, deletePath } = useKeyPoints(campaignId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPathDialog, setShowPathDialog] = useState(false);
  const [editingKP, setEditingKP] = useState<KeyPoint | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [pathSource, setPathSource] = useState("");
  const [pathTarget, setPathTarget] = useState("");
  const [pathType, setPathType] = useState<KeyPointPath["path_type"]>("linear");

  useEffect(() => {
    fetchKeyPoints();
  }, [fetchKeyPoints]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createKeyPoint(newTitle.trim(), newDescription.trim() || undefined);
    setNewTitle("");
    setNewDescription("");
    setShowCreateDialog(false);
  };

  const handleCreatePath = async () => {
    if (!pathSource || !pathTarget || pathSource === pathTarget) return;
    await createPath(pathSource, pathTarget, pathType);
    setPathSource("");
    setPathTarget("");
    setPathType("linear");
    setShowPathDialog(false);
  };

  const handleUpdateKP = async () => {
    if (!editingKP) return;
    await updateKeyPoint(editingKP.id, editingKP);
    setEditingKP(null);
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-48" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" />
              <CardTitle>Key Points</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPathDialog(true)} disabled={keyPoints.length < 2}>
                <Link2 className="h-4 w-4 mr-1" />
                Connect
              </Button>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Key Point
              </Button>
            </div>
          </div>
          <CardDescription>
            Define major story milestones that anchor your narrative arc
          </CardDescription>
        </CardHeader>
      </Card>

      {keyPoints.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Flag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Key Points Yet</h3>
            <p className="text-muted-foreground mb-4">
              Key points are major milestones in your campaign's story.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Key Point
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {keyPoints.map((kp, index) => {
            const outgoingPaths = paths.filter((p) => p.source_key_point_id === kp.id);
            const incomingPaths = paths.filter((p) => p.target_key_point_id === kp.id);

            return (
              <motion.div
                key={kp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-1 text-muted-foreground pt-1">
                        <GripVertical className="h-4 w-4" />
                        <span className="text-sm font-mono">{index + 1}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CircleDot className={`h-4 w-4 ${kp.is_required ? "text-primary" : "text-muted-foreground"}`} />
                          <h4 className="font-semibold">{kp.title}</h4>
                          {kp.is_required && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Required
                            </Badge>
                          )}
                          {kp.node_id && (
                            <Badge variant="secondary" className="text-xs">
                              Linked to node
                            </Badge>
                          )}
                        </div>

                        {kp.description && (
                          <p className="text-sm text-muted-foreground mb-2">{kp.description}</p>
                        )}

                        {/* Paths */}
                        {outgoingPaths.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {outgoingPaths.map((path) => {
                              const target = keyPoints.find((k) => k.id === path.target_key_point_id);
                              return (
                                <div key={path.id} className="flex items-center gap-1">
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <ArrowRight className="h-3 w-3" />
                                    {target?.title || "Unknown"}
                                    <span className="text-muted-foreground">({path.path_type})</span>
                                    <button
                                      onClick={() => deletePath(path.id)}
                                      className="ml-1 hover:text-destructive"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingKP(kp)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteKeyPoint(kp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Key Point Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Key Point</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., The Great Betrayal"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What happens at this milestone?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Path Dialog */}
      <Dialog open={showPathDialog} onOpenChange={setShowPathDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Key Points</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>From</Label>
              <Select value={pathSource} onValueChange={setPathSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source key point" />
                </SelectTrigger>
                <SelectContent>
                  {keyPoints.map((kp) => (
                    <SelectItem key={kp.id} value={kp.id}>{kp.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Select value={pathTarget} onValueChange={setPathTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target key point" />
                </SelectTrigger>
                <SelectContent>
                  {keyPoints.filter((kp) => kp.id !== pathSource).map((kp) => (
                    <SelectItem key={kp.id} value={kp.id}>{kp.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Path Type</Label>
              <Select value={pathType} onValueChange={(v) => setPathType(v as KeyPointPath["path_type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear (always follows)</SelectItem>
                  <SelectItem value="conditional">Conditional (requires conditions)</SelectItem>
                  <SelectItem value="random">Random (probability-based)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPathDialog(false)}>Cancel</Button>
            <Button onClick={handleCreatePath} disabled={!pathSource || !pathTarget || pathSource === pathTarget}>
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Key Point Dialog */}
      <Dialog open={!!editingKP} onOpenChange={() => setEditingKP(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Key Point</DialogTitle>
          </DialogHeader>
          {editingKP && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingKP.title}
                  onChange={(e) => setEditingKP({ ...editingKP, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingKP.description || ""}
                  onChange={(e) => setEditingKP({ ...editingKP, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Required milestone</Label>
                <Switch
                  checked={editingKP.is_required}
                  onCheckedChange={(checked) => setEditingKP({ ...editingKP, is_required: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label>Link to Story Node</Label>
                <Select
                  value={editingKP.node_id || "none"}
                  onValueChange={(v) => setEditingKP({ ...editingKP, node_id: v === "none" ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a node" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {storyNodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.title || "Untitled Node"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingKP(null)}>Cancel</Button>
            <Button onClick={handleUpdateKP}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
