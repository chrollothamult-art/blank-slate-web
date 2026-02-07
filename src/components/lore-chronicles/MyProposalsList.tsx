import { motion } from "framer-motion";
import { Clock, CheckCircle, XCircle, Trash2, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLoreProposals, LoreProposal } from "@/hooks/useLoreProposals";
import { format } from "date-fns";

const STATUS_CONFIG = {
  pending: { icon: Clock, label: "Pending Review", variant: "secondary" as const },
  approved: { icon: CheckCircle, label: "Approved", variant: "default" as const },
  rejected: { icon: XCircle, label: "Rejected", variant: "destructive" as const },
};

const CATEGORY_LABELS: Record<string, string> = {
  race: "Race",
  location: "Location",
  item: "Item",
  faction: "Faction",
  ability: "Ability",
  concept: "Concept",
};

export const MyProposalsList = () => {
  const { myProposals, loading, deleteProposal } = useLoreProposals();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    );
  }

  if (myProposals.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Proposals Yet</h3>
          <p className="text-muted-foreground">
            Submit your first lore proposal to contribute to the ThouArt universe.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {myProposals.map((proposal, index) => {
        const StatusIcon = STATUS_CONFIG[proposal.status].icon;
        
        return (
          <motion.div
            key={proposal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{proposal.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{CATEGORY_LABELS[proposal.category]}</Badge>
                      <span>•</span>
                      <span>{format(new Date(proposal.created_at), "MMM d, yyyy")}</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_CONFIG[proposal.status].variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {STATUS_CONFIG[proposal.status].label}
                    </Badge>
                    {proposal.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteProposal(proposal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  <strong>{proposal.content.name}:</strong> {proposal.content.description}
                </p>

                {proposal.status === "rejected" && proposal.reviewer_notes && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-3">
                    <p className="text-sm">
                      <strong>Reviewer Notes:</strong> {proposal.reviewer_notes}
                    </p>
                  </div>
                )}

                {proposal.status === "approved" && proposal.reviewed_at && (
                  <p className="text-xs text-muted-foreground">
                    Approved on {format(new Date(proposal.reviewed_at), "MMM d, yyyy")}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
