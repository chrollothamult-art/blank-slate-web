import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ActionOutcomeDisplay } from "./ActionOutcomeDisplay";
import { useFreeTextInterpreter, ActionResult } from "@/hooks/useFreeTextInterpreter";

interface FreeTextInputProps {
  prompt?: string;
  onSubmit: (text: string) => void;
  disabled?: boolean;
  maxLength?: number;
  // AI interpretation props
  enableAI?: boolean;
  sessionId?: string;
  characterId?: string;
  nodeId?: string;
  onAIResult?: (result: ActionResult) => void;
}

export const FreeTextInput = ({
  prompt,
  onSubmit,
  disabled,
  maxLength = 500,
  enableAI = false,
  sessionId,
  characterId,
  nodeId,
  onAIResult,
}: FreeTextInputProps) => {
  const [text, setText] = useState("");
  const [showOutcome, setShowOutcome] = useState(false);
  const { interpretAction, loading, lastResult, clearResult } = useFreeTextInterpreter();

  const handleSubmit = async () => {
    if (!text.trim()) return;
    const userText = text.trim();
    setText("");

    // If AI is enabled and we have the required context, interpret the action
    if (enableAI && sessionId && characterId && nodeId) {
      const result = await interpretAction(sessionId, characterId, nodeId, userText);
      if (result) {
        setShowOutcome(true);
        onAIResult?.(result);
      }
    } else {
      // Fallback to regular submit
      onSubmit(userText);
    }
  };

  const handleDismissOutcome = () => {
    setShowOutcome(false);
    clearResult();
    // Also call regular onSubmit to continue the flow
    if (lastResult) {
      onSubmit(lastResult.outcome_narration);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      {/* Show outcome display if we have an AI result */}
      <AnimatePresence>
        {showOutcome && lastResult && (
          <ActionOutcomeDisplay result={lastResult} onDismiss={handleDismissOutcome} />
        )}
      </AnimatePresence>

      {/* Input card - hide when showing outcome */}
      {!showOutcome && (
        <Card className="border-primary/30">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>{prompt || "What do you do?"}</span>
              {enableAI && (
                <span className="ml-auto flex items-center gap-1 text-xs text-primary">
                  <Wand2 className="h-3 w-3" />
                  AI-Interpreted
                </span>
              )}
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, maxLength))}
              placeholder={
                enableAI
                  ? "Describe your action... (e.g., 'I try to pick the lock quietly')"
                  : "Type your response..."
              }
              rows={3}
              disabled={disabled || loading}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey && !disabled && text.trim()) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {text.length}/{maxLength}
                {enableAI && <span className="ml-2">Ctrl+Enter to submit</span>}
              </span>
              <Button
                onClick={handleSubmit}
                disabled={disabled || loading || !text.trim()}
                size="sm"
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    The DM considers...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {enableAI ? "Perform Action" : "Respond"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};
