import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  type: 'book' | 'character' | 'location' | 'event' | 'submission' | 'forum_post';
  title: string;
  description: string;
  image_url?: string | null;
  slug?: string;
  url: string;
}

export const useGlobalSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setQuery(searchQuery);
    const lowerQuery = searchQuery.toLowerCase();
    const allResults: SearchResult[] = [];

    try {
      // Search books
      const { data: books } = await supabase
        .from('books')
        .select('id, title, description, cover_image_url')
        .or(`title.ilike.%${lowerQuery}%,description.ilike.%${lowerQuery}%,author.ilike.%${lowerQuery}%`)
        .limit(5);

      if (books) {
        allResults.push(
          ...books.map((book) => ({
            id: book.id,
            type: 'book' as const,
            title: book.title,
            description: book.description || '',
            image_url: book.cover_image_url,
            url: `/books`,
          }))
        );
      }

      // Search almanac characters
      const { data: characters } = await (supabase
        .from('almanac_characters' as any)
        .select('id, name, description, image_url, slug')
        .or(`name.ilike.%${lowerQuery}%,description.ilike.%${lowerQuery}%`)
        .limit(5)) as any;

      if (characters) {
        allResults.push(
          ...characters.map((char: any) => ({
            id: char.id,
            type: 'character' as const,
            title: char.name,
            description: char.description || '',
            image_url: char.image_url,
            slug: char.slug,
            url: `/almanac/characters`,
          }))
        );
      }

      // Search almanac locations
      const { data: locations } = await (supabase
        .from('almanac_locations' as any)
        .select('id, name, description, image_url, slug')
        .or(`name.ilike.%${lowerQuery}%,description.ilike.%${lowerQuery}%`)
        .limit(5)) as any;

      if (locations) {
        allResults.push(
          ...locations.map((loc: any) => ({
            id: loc.id,
            type: 'location' as const,
            title: loc.name,
            description: loc.description || '',
            image_url: loc.image_url,
            slug: loc.slug,
            url: `/almanac/locations`,
          }))
        );
      }

      // Search chronology events
      const { data: events } = await (supabase
        .from('chronology_events' as any)
        .select('id, title, description')
        .or(`title.ilike.%${lowerQuery}%,description.ilike.%${lowerQuery}%`)
        .limit(5)) as any;

      if (events) {
        allResults.push(
          ...events.map((event: any) => ({
            id: event.id,
            type: 'event' as const,
            title: event.title,
            description: event.description || '',
            url: `/chronology`,
          }))
        );
      }

      // Search community submissions
      const { data: submissions } = await supabase
        .from('user_submissions')
        .select('id, title, description, image_url')
        .eq('status', 'approved')
        .or(`title.ilike.%${lowerQuery}%,description.ilike.%${lowerQuery}%`)
        .limit(5);

      if (submissions) {
        allResults.push(
          ...submissions.map((sub) => ({
            id: sub.id,
            type: 'submission' as const,
            title: sub.title,
            description: sub.description || '',
            image_url: sub.image_url,
            url: `/community/submission/${sub.id}`,
          }))
        );
      }

      // Search forum posts
      const { data: forumPosts } = await supabase
        .from('forum_posts')
        .select('id, title, content, category')
        .or(`title.ilike.%${lowerQuery}%,content.ilike.%${lowerQuery}%`)
        .limit(5);

      if (forumPosts) {
        allResults.push(
          ...forumPosts.map((post) => ({
            id: post.id,
            type: 'forum_post' as const,
            title: post.title,
            description: post.content.substring(0, 150) + '...',
            url: `/forum?post=${post.id}`,
          }))
        );
      }

      setResults(allResults);
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = () => {
    setResults([]);
    setQuery('');
  };

  return {
    results,
    loading,
    query,
    search,
    clearResults,
  };
};
