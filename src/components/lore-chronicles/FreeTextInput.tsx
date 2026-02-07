import { useState } from "react";
import { motion } from "framer-motion";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface FreeTextInputProps {
  prompt?: string;
  onSubmit: (text: string) => void;
  disabled?: boolean;
  maxLength?: number;
}

export const FreeTextInput = ({ prompt, onSubmit, disabled, maxLength = 500 }: FreeTextInputProps) => {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-primary/30">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>{prompt || "What do you do?"}</span>
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, maxLength))}
            placeholder="Type your response..."
            rows={3}
            disabled={disabled}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {text.length}/{maxLength}
            </span>
            <Button
              onClick={handleSubmit}
              disabled={disabled || !text.trim()}
              size="sm"
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Respond
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
