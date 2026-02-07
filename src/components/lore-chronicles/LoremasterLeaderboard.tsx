import { motion } from "framer-motion";
import { Trophy, Shield, Check, X, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLoremasterLeaderboard } from "@/hooks/useLoremasterLeaderboard";

const RANK_COLORS = ["text-yellow-500", "text-gray-400", "text-amber-700"];

export const LoremasterLeaderboard = () => {
  const { leaderboard, loading } = useLoremasterLeaderboard();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-20" />
          </Card>
        ))}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Loremasters Yet</h3>
          <p className="text-muted-foreground">
            Apply to become a Loremaster and start reviewing lore proposals.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <CardTitle>Loremaster Leaderboard</CardTitle>
          </div>
          <CardDescription>
            Recognizing our most active Loremasters by reviews completed
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {leaderboard.map((entry, index) => (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={index < 3 ? "border-primary/30" : ""}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="w-10 text-center">
                    {index < 3 ? (
                      <Award className={`h-6 w-6 mx-auto ${RANK_COLORS[index]}`} />
                    ) : (
                      <span className="text-lg font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {entry.username[0]?.toUpperCase() || "L"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{entry.username}</p>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Shield className="h-3 w-3" />
                        Loremaster
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.reviews_completed} reviews completed
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="h-4 w-4" />
                      <span>{entry.approved_count}</span>
                    </div>
                    <div className="flex items-center gap-1 text-destructive">
                      <X className="h-4 w-4" />
                      <span>{entry.rejected_count}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
