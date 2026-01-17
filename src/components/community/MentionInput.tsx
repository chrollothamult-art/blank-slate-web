import { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange?: (mentions: string[]) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  autoFocus?: boolean;
}

export const MentionInput = ({
  value,
  onChange,
  onMentionsChange,
  placeholder = "Write something...",
  rows = 3,
  className,
  autoFocus,
}: MentionInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Extract mentions from text
  const extractMentions = useCallback((text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(m => m.slice(1)) : [];
  }, []);

  // Search for users
  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .limit(5);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    onChange(newValue);

    // Check for @ mentions
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setMentionStartIndex(textBeforeCursor.lastIndexOf('@'));
      setMentionQuery(atMatch[1]);
      setShowSuggestions(true);
      setSelectedIndex(0);
      searchUsers(atMatch[1]);
    } else {
      setShowSuggestions(false);
      setMentionQuery('');
    }

    // Update mentions list
    if (onMentionsChange) {
      onMentionsChange(extractMentions(newValue));
    }
  };

  // Handle selecting a suggestion
  const selectSuggestion = (user: User) => {
    if (mentionStartIndex === -1) return;

    const before = value.slice(0, mentionStartIndex);
    const after = value.slice(mentionStartIndex + mentionQuery.length + 1);
    const newValue = `${before}@${user.username} ${after}`;
    
    onChange(newValue);
    setShowSuggestions(false);
    setMentionQuery('');
    setMentionStartIndex(-1);

    // Focus and set cursor position
    if (textareaRef.current) {
      const newCursorPos = mentionStartIndex + user.username.length + 2;
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }

    // Update mentions list
    if (onMentionsChange) {
      onMentionsChange(extractMentions(newValue));
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        if (showSuggestions && suggestions[selectedIndex]) {
          e.preventDefault();
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={cn("resize-none", className)}
        autoFocus={autoFocus}
      />

      {/* Mention Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-64 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {loading ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Searching...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              {mentionQuery.length > 0 ? 'No users found' : 'Type to search users'}
            </div>
          ) : (
            <div className="py-1">
              {suggestions.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => selectSuggestion(user)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                    index === selectedIndex ? "bg-accent" : "hover:bg-muted"
                  )}
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {user.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">@{user.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground mt-1">
        Type @ to mention someone
      </p>
    </div>
  );
};
