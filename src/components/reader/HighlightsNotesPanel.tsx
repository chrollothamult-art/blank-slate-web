import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Highlighter,
  StickyNote,
  Trash2,
  Edit,
  Check,
  X,
  ChevronRight,
} from 'lucide-react';
import { Highlight, Note } from '@/hooks/useHighlightsNotes';

const HIGHLIGHT_COLORS = [
  { name: 'yellow', class: 'bg-yellow-300' },
  { name: 'green', class: 'bg-green-300' },
  { name: 'blue', class: 'bg-blue-300' },
  { name: 'pink', class: 'bg-pink-300' },
  { name: 'purple', class: 'bg-purple-300' },
];

interface HighlightsNotesPanelProps {
  highlights: Highlight[];
  notes: Note[];
  currentPage: number;
  onGoToPage: (page: number) => void;
  onUpdateHighlightColor: (id: string, color: string) => void;
  onDeleteHighlight: (id: string) => void;
  onAddNote: (page: number, content: string, highlightId?: string) => void;
  onUpdateNote: (id: string, content: string) => void;
  onDeleteNote: (id: string) => void;
}

export const HighlightsNotesPanel = ({
  highlights,
  notes,
  currentPage,
  onGoToPage,
  onUpdateHighlightColor,
  onDeleteHighlight,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: HighlightsNotesPanelProps) => {
  const [activeTab, setActiveTab] = useState<'highlights' | 'notes'>('highlights');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      onAddNote(currentPage, newNoteContent.trim());
      setNewNoteContent('');
    }
  };

  const handleStartEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const handleSaveEditNote = () => {
    if (editingNoteId && editingNoteContent.trim()) {
      onUpdateNote(editingNoteId, editingNoteContent.trim());
      setEditingNoteId(null);
      setEditingNoteContent('');
    }
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const getColorClass = (color: string) => {
    return HIGHLIGHT_COLORS.find((c) => c.name === color)?.class || 'bg-yellow-300';
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'highlights' | 'notes')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="highlights" className="gap-2">
            <Highlighter className="h-4 w-4" />
            Highlights ({highlights.length})
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <StickyNote className="h-4 w-4" />
            Notes ({notes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="highlights" className="flex-1 mt-4">
          <ScrollArea className="h-[400px]">
            {highlights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Highlighter className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No highlights yet</p>
                <p className="text-sm">Select text while reading to highlight it</p>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {highlights.map((highlight) => (
                  <Card key={highlight.id} className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => onGoToPage(highlight.page_number)}
                      >
                        Page {highlight.page_number}
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onDeleteHighlight(highlight.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <p
                      className={`text-sm p-2 rounded ${getColorClass(highlight.color)} text-gray-800`}
                    >
                      "{highlight.text_content}"
                    </p>
                    <div className="flex gap-1 mt-2">
                      {HIGHLIGHT_COLORS.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => onUpdateHighlightColor(highlight.id, color.name)}
                          className={`w-5 h-5 rounded-full ${color.class} ${
                            highlight.color === color.name
                              ? 'ring-2 ring-offset-2 ring-primary'
                              : ''
                          }`}
                        />
                      ))}
                    </div>
                    {highlight.note && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          <StickyNote className="h-3 w-3 inline mr-1" />
                          {highlight.note.content}
                        </p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="notes" className="flex-1 mt-4">
          <div className="mb-4">
            <Textarea
              placeholder="Add a note for this page..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleAddNote}
              disabled={!newNoteContent.trim()}
              className="w-full mt-2"
              size="sm"
            >
              Add Note to Page {currentPage}
            </Button>
          </div>

          <ScrollArea className="h-[300px]">
            {notes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No notes yet</p>
                <p className="text-sm">Add notes while reading</p>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {notes.map((note) => (
                  <Card key={note.id} className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => onGoToPage(note.page_number)}
                      >
                        Page {note.page_number}
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleStartEditNote(note)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onDeleteNote(note.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingNoteContent}
                          onChange={(e) => setEditingNoteContent(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEditNote}>
                            <Check className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEditNote}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm">{note.content}</p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
