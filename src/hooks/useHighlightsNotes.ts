import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Highlight {
  id: string;
  page_number: number;
  text_content: string;
  start_offset: number;
  end_offset: number;
  color: string;
  created_at: string;
  note?: Note;
}

export interface Note {
  id: string;
  page_number: number;
  content: string;
  highlight_id: string | null;
  created_at: string;
}

export const useHighlightsNotes = (bookId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user || !bookId) return;

    setLoading(true);
    try {
      // Fetch highlights
      const { data: highlightsData, error: highlightsError } = await supabase
        .from('book_highlights')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .order('page_number', { ascending: true });

      if (highlightsError) throw highlightsError;

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('book_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .order('page_number', { ascending: true });

      if (notesError) throw notesError;

      // Map notes to highlights
      const notesMap = new Map<string, Note>();
      (notesData || []).forEach((note) => {
        if (note.highlight_id) {
          notesMap.set(note.highlight_id, {
            id: note.id,
            page_number: note.page_number,
            content: note.content,
            highlight_id: note.highlight_id,
            created_at: note.created_at,
          });
        }
      });

      const enrichedHighlights: Highlight[] = (highlightsData || []).map((h) => ({
        id: h.id,
        page_number: h.page_number,
        text_content: h.text_content,
        start_offset: h.start_offset,
        end_offset: h.end_offset,
        color: h.color,
        created_at: h.created_at,
        note: notesMap.get(h.id),
      }));

      setHighlights(enrichedHighlights);
      setNotes(
        (notesData || [])
          .filter((n) => !n.highlight_id)
          .map((n) => ({
            id: n.id,
            page_number: n.page_number,
            content: n.content,
            highlight_id: n.highlight_id,
            created_at: n.created_at,
          }))
      );
    } catch (error: any) {
      console.error('Error fetching highlights/notes:', error);
    } finally {
      setLoading(false);
    }
  }, [user, bookId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addHighlight = async (
    pageNumber: number,
    textContent: string,
    startOffset: number,
    endOffset: number,
    color: string = 'yellow'
  ) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to save highlights',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('book_highlights')
        .insert({
          user_id: user.id,
          book_id: bookId,
          page_number: pageNumber,
          text_content: textContent,
          start_offset: startOffset,
          end_offset: endOffset,
          color,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Highlight saved',
        description: 'Your highlight has been saved',
      });

      fetchData();
      return data.id;
    } catch (error: any) {
      console.error('Error adding highlight:', error);
      toast({
        title: 'Error',
        description: 'Failed to save highlight',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateHighlightColor = async (highlightId: string, color: string) => {
    try {
      const { error } = await supabase
        .from('book_highlights')
        .update({ color })
        .eq('id', highlightId);

      if (error) throw error;

      fetchData();
    } catch (error: any) {
      console.error('Error updating highlight:', error);
    }
  };

  const deleteHighlight = async (highlightId: string) => {
    try {
      const { error } = await supabase
        .from('book_highlights')
        .delete()
        .eq('id', highlightId);

      if (error) throw error;

      toast({
        title: 'Highlight deleted',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting highlight:', error);
    }
  };

  const addNote = async (
    pageNumber: number,
    content: string,
    highlightId?: string
  ) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to save notes',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('book_notes')
        .insert({
          user_id: user.id,
          book_id: bookId,
          page_number: pageNumber,
          content,
          highlight_id: highlightId || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Note saved',
        description: 'Your note has been saved',
      });

      fetchData();
      return data.id;
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to save note',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateNote = async (noteId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('book_notes')
        .update({ content })
        .eq('id', noteId);

      if (error) throw error;

      fetchData();
    } catch (error: any) {
      console.error('Error updating note:', error);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('book_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: 'Note deleted',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting note:', error);
    }
  };

  const getHighlightsForPage = (pageNumber: number) => {
    return highlights.filter((h) => h.page_number === pageNumber);
  };

  const getNotesForPage = (pageNumber: number) => {
    return notes.filter((n) => n.page_number === pageNumber);
  };

  return {
    highlights,
    notes,
    loading,
    addHighlight,
    updateHighlightColor,
    deleteHighlight,
    addNote,
    updateNote,
    deleteNote,
    getHighlightsForPage,
    getNotesForPage,
    refetch: fetchData,
  };
};
