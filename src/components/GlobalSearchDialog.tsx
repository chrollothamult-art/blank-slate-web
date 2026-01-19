import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Book, User, MapPin, Calendar, MessageSquare, Palette, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';
import { useDebounce } from '@/hooks/useDebounce';

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons: Record<SearchResult['type'], React.ReactNode> = {
  book: <Book className="h-4 w-4" />,
  character: <User className="h-4 w-4" />,
  location: <MapPin className="h-4 w-4" />,
  event: <Calendar className="h-4 w-4" />,
  submission: <Palette className="h-4 w-4" />,
  forum_post: <MessageSquare className="h-4 w-4" />,
};

const typeLabels: Record<SearchResult['type'], string> = {
  book: 'Book',
  character: 'Character',
  location: 'Location',
  event: 'Event',
  submission: 'Submission',
  forum_post: 'Forum Post',
};

const typeColors: Record<SearchResult['type'], string> = {
  book: 'bg-blue-500/10 text-blue-500',
  character: 'bg-purple-500/10 text-purple-500',
  location: 'bg-green-500/10 text-green-500',
  event: 'bg-amber-500/10 text-amber-500',
  submission: 'bg-pink-500/10 text-pink-500',
  forum_post: 'bg-cyan-500/10 text-cyan-500',
};

export const GlobalSearchDialog = ({ open, onOpenChange }: GlobalSearchDialogProps) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const debouncedQuery = useDebounce(inputValue, 300);
  const { results, loading, search, clearResults } = useGlobalSearch();

  useEffect(() => {
    if (debouncedQuery) {
      search(debouncedQuery);
    } else {
      clearResults();
    }
  }, [debouncedQuery, search, clearResults]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setInputValue('');
      clearResults();
    }
  }, [open, clearResults]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    onOpenChange(false);
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">Global Search</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search books, characters, locations, events..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="pl-10 pr-10 h-12 text-base"
            />
            {inputValue && (
              <button
                onClick={() => setInputValue('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && inputValue && results.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No results found for "{inputValue}"</p>
              <p className="text-sm mt-1">Try searching for something else</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="p-4 pt-2 space-y-4">
              {Object.entries(groupedResults).map(([type, typeResults]) => (
                <div key={type}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                    {typeIcons[type as SearchResult['type']]}
                    {typeLabels[type as SearchResult['type']]}s
                  </h3>
                  <div className="space-y-1">
                    {typeResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                      >
                        {result.image_url ? (
                          <img
                            src={result.image_url}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[result.type]}`}>
                            {typeIcons[result.type]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate group-hover:text-primary transition-colors">
                            {result.title}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {result.description}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${typeColors[result.type]}`}>
                          {typeLabels[result.type]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !inputValue && (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Start typing to search across all content</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {Object.entries(typeLabels).map(([type, label]) => (
                  <span
                    key={type}
                    className={`text-xs px-2 py-1 rounded-full ${typeColors[type as SearchResult['type']]}`}
                  >
                    {label}s
                  </span>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">ESC</kbd> to close</span>
          <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘K</kbd> to open search</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
