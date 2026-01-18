import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, BarChart3 } from 'lucide-react';

interface PollCreatorProps {
  onPollDataChange: (data: {
    enabled: boolean;
    question: string;
    options: string[];
    endsAt?: Date;
  }) => void;
}

export const PollCreator = ({ onPollDataChange }: PollCreatorProps) => {
  const [enabled, setEnabled] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);

  const updateParent = (
    newEnabled: boolean,
    newQuestion: string,
    newOptions: string[],
    newHasExpiry: boolean,
    newExpiryDays: number
  ) => {
    const endsAt = newHasExpiry
      ? new Date(Date.now() + newExpiryDays * 24 * 60 * 60 * 1000)
      : undefined;
    onPollDataChange({
      enabled: newEnabled,
      question: newQuestion,
      options: newOptions.filter((o) => o.trim() !== ''),
      endsAt,
    });
  };

  const handleEnableChange = (value: boolean) => {
    setEnabled(value);
    updateParent(value, question, options, hasExpiry, expiryDays);
  };

  const handleQuestionChange = (value: string) => {
    setQuestion(value);
    updateParent(enabled, value, options, hasExpiry, expiryDays);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    updateParent(enabled, question, newOptions, hasExpiry, expiryDays);
  };

  const addOption = () => {
    if (options.length < 6) {
      const newOptions = [...options, ''];
      setOptions(newOptions);
      updateParent(enabled, question, newOptions, hasExpiry, expiryDays);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      updateParent(enabled, question, newOptions, hasExpiry, expiryDays);
    }
  };

  const handleExpiryChange = (value: boolean) => {
    setHasExpiry(value);
    updateParent(enabled, question, options, value, expiryDays);
  };

  const handleExpiryDaysChange = (value: number) => {
    setExpiryDays(value);
    updateParent(enabled, question, options, hasExpiry, value);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <Label htmlFor="poll-toggle" className="font-medium">
            Add a Poll
          </Label>
        </div>
        <Switch
          id="poll-toggle"
          checked={enabled}
          onCheckedChange={handleEnableChange}
        />
      </div>

      {enabled && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="poll-question">Poll Question</Label>
            <Input
              id="poll-question"
              placeholder="What do you want to ask?"
              value={question}
              onChange={(e) => handleQuestionChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Options</Label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="poll-expiry"
                checked={hasExpiry}
                onCheckedChange={handleExpiryChange}
              />
              <Label htmlFor="poll-expiry">Set expiry</Label>
            </div>
            {hasExpiry && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={expiryDays}
                  onChange={(e) => handleExpiryDaysChange(parseInt(e.target.value) || 7)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
