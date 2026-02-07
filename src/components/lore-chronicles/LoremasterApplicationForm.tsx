import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Send, Check, Clock, X, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLoremasterApplications } from "@/hooks/useLoremasterApplications";
import { useAuth } from "@/contexts/AuthContext";

export const LoremasterApplicationForm = () => {
  const { user } = useAuth();
  const { myApplication, isLoremaster, loading, submitApplication } = useLoremasterApplications();
  const [motivation, setMotivation] = useState("");
  const [experience, setExperience] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!motivation.trim() || !experience.trim()) return;

    setSubmitting(true);
    await submitApplication(motivation.trim(), experience.trim());
    setSubmitting(false);
    setMotivation("");
    setExperience("");
  };

  if (!user) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
          <p className="text-muted-foreground">
            Please sign in to apply for Loremaster status.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-48" />
      </Card>
    );
  }

  // Already a Loremaster
  if (isLoremaster) {
    return (
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">You are a Loremaster!</h3>
          <p className="text-muted-foreground max-w-md">
            You have the power to review lore proposals and shape the universe.
            Visit the Loremaster Dashboard to review submissions.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Has pending application
  if (myApplication?.status === "pending") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Application Pending
            </CardTitle>
            <Badge variant="outline" className="text-yellow-600 border-yellow-500">
              Under Review
            </Badge>
          </div>
          <CardDescription>
            Your application was submitted and is awaiting review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Your Motivation</p>
              <p className="mt-1">{myApplication.motivation}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Your Experience</p>
              <p className="mt-1">{myApplication.experience}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Has rejected application
  if (myApplication?.status === "rejected") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-destructive" />
              Application Not Accepted
            </CardTitle>
            <Badge variant="destructive">
              Rejected
            </Badge>
          </div>
          <CardDescription>
            Your previous application was not accepted at this time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myApplication.reviewer_notes && (
            <div className="p-4 bg-muted rounded-lg mb-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Reviewer Notes</p>
              <p className="text-sm">{myApplication.reviewer_notes}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            You may reapply with an updated application.
          </p>
          
          {/* Show form again for reapplication */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivation">Why do you want to become a Loremaster?</Label>
              <Textarea
                id="motivation"
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Describe your passion for the ThouArt universe and what drives you to help curate its lore..."
                rows={4}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="experience">What relevant experience do you have?</Label>
              <Textarea
                id="experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Share your experience with world-building, writing, moderation, or similar activities..."
                rows={4}
                required
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full gap-2">
              <Send className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit New Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Show application form
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Apply to Become a Loremaster
          </CardTitle>
          <CardDescription>
            Loremasters are trusted guardians of the ThouArt universe. They review community 
            lore submissions and ensure consistency with established canon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Loremaster Responsibilities:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Review and approve/reject community lore proposals</li>
              <li>• Ensure new lore fits within the ThouArt universe</li>
              <li>• Provide constructive feedback to submitters</li>
              <li>• Help maintain consistency across all lore entries</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivation">Why do you want to become a Loremaster? *</Label>
              <Textarea
                id="motivation"
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Describe your passion for the ThouArt universe and what drives you to help curate its lore..."
                rows={4}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="experience">What relevant experience do you have? *</Label>
              <Textarea
                id="experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Share your experience with world-building, writing, moderation, or similar activities..."
                rows={4}
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={submitting || !motivation.trim() || !experience.trim()} 
              className="w-full gap-2"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Submitting Application..." : "Submit Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};
