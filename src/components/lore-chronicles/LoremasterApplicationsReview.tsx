import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Check, X, Eye, Clock, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useLoremasterApplications, LoremasterApplication } from "@/hooks/useLoremasterApplications";
import { format } from "date-fns";

export const LoremasterApplicationsReview = () => {
  const { applications, loading, isAdmin, reviewApplication } = useLoremasterApplications();
  const [selectedApp, setSelectedApp] = useState<LoremasterApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const handleReview = async (status: "approved" | "rejected") => {
    if (!selectedApp) return;
    
    setReviewing(true);
    await reviewApplication(selectedApp.id, status, reviewNotes);
    setReviewing(false);
    setSelectedApp(null);
    setReviewNotes("");
  };

  if (!isAdmin) {
    return null; // Don't render for non-admins
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Loremaster Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Loremaster Applications</CardTitle>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {applications.length} Pending
            </Badge>
          </div>
          <CardDescription>
            Review applications from users who want to become Loremasters
          </CardDescription>
        </CardHeader>
      </Card>

      {applications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Applications</h3>
            <p className="text-muted-foreground">
              All caught up! No applications waiting for review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={app.user?.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {app.user?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{app.user?.username || "Unknown User"}</h3>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        Applied {format(new Date(app.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                      
                      <p className="text-sm line-clamp-2">
                        <strong>Motivation:</strong> {app.motivation}
                      </p>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedApp(app)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loremaster Application</DialogTitle>
            <DialogDescription>
              Review this application for Loremaster status
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={selectedApp.user?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedApp.user?.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{selectedApp.user?.username || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">
                    Applied {format(new Date(selectedApp.created_at), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Why do they want to become a Loremaster?</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{selectedApp.motivation}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Relevant Experience</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{selectedApp.experience}</p>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Review Notes (Optional)</h4>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add feedback for the applicant..."
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
