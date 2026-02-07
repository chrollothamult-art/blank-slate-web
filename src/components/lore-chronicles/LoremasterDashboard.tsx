import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Check, X, Eye, Clock, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useLoreProposals, LoreProposal } from "@/hooks/useLoreProposals";
import { format } from "date-fns";

const CATEGORY_LABELS: Record<string, string> = {
  race: "Race",
  location: "Location",
  item: "Item",
  faction: "Faction",
  ability: "Ability",
  concept: "Concept",
};

export const LoremasterDashboard = () => {
  const { proposals, pendingCount, loading, reviewProposal, isLoremaster } = useLoreProposals();
  const [selectedProposal, setSelectedProposal] = useState<LoreProposal | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const handleReview = async (status: "approved" | "rejected") => {
    if (!selectedProposal) return;
    
    setReviewing(true);
    await reviewProposal(selectedProposal.id, status, reviewNotes);
    setReviewing(false);
    setSelectedProposal(null);
    setReviewNotes("");
  };

  if (!isLoremaster) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loremaster Access Required</h3>
          <p className="text-muted-foreground">
            Only appointed Loremasters can review lore proposals.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Loremaster Dashboard</CardTitle>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {pendingCount} Pending
            </Badge>
          </div>
          <CardDescription>
            Review and approve community lore submissions
          </CardDescription>
        </CardHeader>
      </Card>

      {proposals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">
              No pending proposals to review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal, index) => (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={proposal.user?.avatar_url || ""} />
                      <AvatarFallback>
                        {proposal.user?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{proposal.title}</h3>
                        <Badge variant="outline">{CATEGORY_LABELS[proposal.category]}</Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        by {proposal.user?.username || "Unknown"} • {format(new Date(proposal.created_at), "MMM d, yyyy")}
                      </p>
                      
                      <p className="text-sm">
                        <strong>{proposal.content.name}:</strong> {proposal.content.description}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedProposal(proposal)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedProposal} onOpenChange={() => setSelectedProposal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProposal?.title}</DialogTitle>
            <DialogDescription>
              <Badge variant="outline" className="mt-1">
                {selectedProposal && CATEGORY_LABELS[selectedProposal.category]}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          {selectedProposal && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedProposal.user?.avatar_url || ""} />
                  <AvatarFallback>
                    {selectedProposal.user?.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedProposal.user?.username || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">
                    Submitted {format(new Date(selectedProposal.created_at), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">{selectedProposal.content.name}</h4>
                <p className="text-muted-foreground">{selectedProposal.content.description}</p>
              </div>

              {selectedProposal.content.details && (
                <div>
                  <h4 className="font-semibold mb-2">Detailed Lore</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedProposal.content.details}</p>
                </div>
              )}

              {/* Category-specific fields */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedProposal.content.homeland && (
                  <div>
                    <span className="text-muted-foreground">Homeland:</span>{" "}
                    {selectedProposal.content.homeland}
                  </div>
                )}
                {selectedProposal.content.location_type && (
                  <div>
                    <span className="text-muted-foreground">Type:</span>{" "}
                    {selectedProposal.content.location_type}
                  </div>
                )}
                {selectedProposal.content.item_type && (
                  <div>
                    <span className="text-muted-foreground">Item Type:</span>{" "}
                    {selectedProposal.content.item_type}
                  </div>
                )}
                {selectedProposal.content.rarity && (
                  <div>
                    <span className="text-muted-foreground">Rarity:</span>{" "}
                    {selectedProposal.content.rarity}
                  </div>
                )}
                {selectedProposal.content.effect && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Effect:</span>{" "}
                    {selectedProposal.content.effect}
                  </div>
                )}
              </div>

              {selectedProposal.content.image_url && (
                <div>
                  <h4 className="font-semibold mb-2">Reference Image</h4>
                  <img 
                    src={selectedProposal.content.image_url} 
                    alt={selectedProposal.content.name}
                    className="max-h-48 rounded-lg object-cover"
                  />
                </div>
              )}

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Review Notes (Optional)</h4>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add feedback for the submitter..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => handleReview("rejected")}
              disabled={reviewing}
              className="gap-1"
            >
              <X className="h-4 w-4" />
              Reject
            </Button>
            <Button
              onClick={() => handleReview("approved")}
              disabled={reviewing}
              className="gap-1"
            >
              <Check className="h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
