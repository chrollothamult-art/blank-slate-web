import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Check, Clock } from 'lucide-react';
import { Poll } from '@/hooks/useForumPolls';
import { formatDistanceToNow } from 'date-fns';

interface PollDisplayProps {
  poll: Poll;
  onVote: (optionId: string) => void;
  canVote: boolean;
}

export const PollDisplay = ({ poll, onVote, canVote }: PollDisplayProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const hasVoted = poll.user_vote_option_id !== null;
  const isExpired = poll.ends_at && new Date(poll.ends_at) < new Date();
  const showResults = hasVoted || isExpired;

  const handleVote = () => {
    if (selectedOption) {
      onVote(selectedOption);
    }
  };

  return (
    <Card className="p-4 bg-muted/30 border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h4 className="font-semibold">{poll.question}</h4>
        {isExpired && (
          <Badge variant="secondary" className="ml-auto">
            <Clock className="h-3 w-3 mr-1" />
            Ended
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage =
            poll.total_votes > 0
              ? Math.round((option.votes_count / poll.total_votes) * 100)
              : 0;
          const isSelected = selectedOption === option.id;
          const isUserVote = poll.user_vote_option_id === option.id;

          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: option.order_index * 0.1 }}
            >
              {showResults ? (
                <div className="relative">
                  <div
                    className={`p-3 rounded-lg border transition-all ${
                      isUserVote
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium flex items-center gap-2">
                        {option.option_text}
                        {isUserVote && <Check className="h-4 w-4 text-primary" />}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {percentage}% ({option.votes_count})
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedOption(option.id)}
                  disabled={!canVote}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background hover:border-primary/50'
                  } ${!canVote ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="font-medium">{option.option_text}</span>
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <span className="text-sm text-muted-foreground">
          {poll.total_votes} vote{poll.total_votes !== 1 ? 's' : ''}
          {poll.ends_at && !isExpired && (
            <span className="ml-2">
              · Ends {formatDistanceToNow(new Date(poll.ends_at), { addSuffix: true })}
            </span>
          )}
        </span>

        {!showResults && canVote && (
          <Button onClick={handleVote} disabled={!selectedOption} size="sm">
            Vote
          </Button>
        )}
      </div>
    </Card>
  );
};
