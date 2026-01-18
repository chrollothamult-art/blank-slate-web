import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Highlighter, StickyNote, X } from 'lucide-react';

const HIGHLIGHT_COLORS = [
  { name: 'yellow', class: 'bg-yellow-300', color: '#fde047' },
  { name: 'green', class: 'bg-green-300', color: '#86efac' },
  { name: 'blue', class: 'bg-blue-300', color: '#93c5fd' },
  { name: 'pink', class: 'bg-pink-300', color: '#f9a8d4' },
  { name: 'purple', class: 'bg-purple-300', color: '#c4b5fd' },
];

interface TextSelectionHighlighterProps {
  containerRef: React.RefObject<HTMLElement>;
  currentPage: number;
  onHighlight: (text: string, page: number, color: string, startOffset: number, endOffset: number) => void;
  onAddNote: (page: number, content: string) => void;
}

interface PopupPosition {
  x: number;
  y: number;
}

export const TextSelectionHighlighter = ({
  containerRef,
  currentPage,
  onHighlight,
  onAddNote,
}: TextSelectionHighlighterProps) => {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setSelection(null);
      setSelectedText('');
      setPopupPosition(null);
      return;
    }

    // Check if selection is within the container
    if (containerRef.current) {
      const range = sel.getRangeAt(0);
      const container = containerRef.current;
      
      if (!container.contains(range.commonAncestorContainer)) {
        return;
      }
    }

    const text = sel.toString().trim();
    if (text.length > 0 && text.length < 1000) {
      setSelection(sel);
      setSelectedText(text);

      // Position the popup near the selection
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setPopupPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    }
  }, [containerRef]);

  const handleHighlight = (colorName: string) => {
    if (!selection || !selectedText) return;

    const range = selection.getRangeAt(0);
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;

    onHighlight(selectedText, currentPage, colorName, startOffset, endOffset);
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    setSelectedText('');
    setPopupPosition(null);
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) return;
    
    onAddNote(currentPage, `[Selection: "${selectedText.slice(0, 50)}..."] ${noteContent.trim()}`);
    
    // Clear everything
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    setSelectedText('');
    setPopupPosition(null);
    setShowNoteInput(false);
    setNoteContent('');
  };

  const handleClose = () => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    setSelectedText('');
    setPopupPosition(null);
    setShowNoteInput(false);
    setNoteContent('');
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseup', handleMouseUp);
    return () => container.removeEventListener('mouseup', handleMouseUp);
  }, [containerRef, handleMouseUp]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        // Don't close immediately on mouseup that triggered the popup
        setTimeout(() => {
          if (!window.getSelection()?.toString().trim()) {
            handleClose();
          }
        }, 100);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!popupPosition || !selectedText) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-[100] bg-popover border border-border rounded-lg shadow-lg p-2 animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: `${popupPosition.x}px`,
        top: `${popupPosition.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {!showNoteInput ? (
        <div className="flex items-center gap-1">
          {/* Color buttons */}
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => handleHighlight(color.name)}
              className={`w-6 h-6 rounded-full ${color.class} hover:ring-2 hover:ring-offset-2 hover:ring-primary transition-all`}
              title={`Highlight ${color.name}`}
            />
          ))}
          
          <div className="w-px h-5 bg-border mx-1" />
          
          {/* Note button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowNoteInput(true)}
            title="Add note"
          >
            <StickyNote className="h-4 w-4" />
          </Button>
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2 w-64">
          <div className="text-xs text-muted-foreground truncate">
            "{selectedText.slice(0, 40)}..."
          </div>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Add a note..."
            className="w-full text-sm p-2 border rounded resize-none bg-background"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddNote} disabled={!noteContent.trim()}>
              Save Note
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowNoteInput(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
