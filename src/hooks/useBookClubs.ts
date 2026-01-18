import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface BookClub {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  owner_id: string;
  is_private: boolean;
  current_book_id: string | null;
  created_at: string;
  members_count: number;
  is_member: boolean;
  owner_username?: string;
}

export interface BookClubMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  username?: string;
  avatar_url?: string;
}

export interface BookClubDiscussion {
  id: string;
  club_id: string;
  author_id: string;
  title: string;
  content: string;
  book_id: string | null;
  chapter: string | null;
  created_at: string;
  author_username?: string;
  author_avatar?: string;
}

export const useBookClubs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clubs, setClubs] = useState<BookClub[]>([]);
  const [myClubs, setMyClubs] = useState<BookClub[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClubs = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all public clubs
      const { data: clubsData, error: clubsError } = await supabase
        .from('book_clubs')
        .select('*')
        .eq('is_private', false)
        .order('created_at', { ascending: false });

      if (clubsError) throw clubsError;

      // Fetch member counts
      const clubIds = (clubsData || []).map((c) => c.id);
      
      let membersData: any[] = [];
      if (clubIds.length > 0) {
        const { data, error } = await supabase
          .from('book_club_members')
          .select('club_id, user_id')
          .in('club_id', clubIds);
        
        if (!error) membersData = data || [];
      }

      // Count members per club
      const memberCounts: Record<string, number> = {};
      const userMemberships: Set<string> = new Set();

      membersData.forEach((m) => {
        memberCounts[m.club_id] = (memberCounts[m.club_id] || 0) + 1;
        if (user && m.user_id === user.id) {
          userMemberships.add(m.club_id);
        }
      });

      // Fetch owner usernames
      const ownerIds = [...new Set((clubsData || []).map((c) => c.owner_id))];
      let profiles: any[] = [];
      if (ownerIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', ownerIds);
        profiles = data || [];
      }

      const profilesMap = new Map(profiles.map((p) => [p.id, p.username]));

      const enrichedClubs: BookClub[] = (clubsData || []).map((club) => ({
        id: club.id,
        name: club.name,
        description: club.description,
        cover_image_url: club.cover_image_url,
        owner_id: club.owner_id,
        is_private: club.is_private,
        current_book_id: club.current_book_id,
        created_at: club.created_at,
        members_count: memberCounts[club.id] || 0,
        is_member: userMemberships.has(club.id) || club.owner_id === user?.id,
        owner_username: profilesMap.get(club.owner_id) || 'Unknown',
      }));

      setClubs(enrichedClubs);
      setMyClubs(enrichedClubs.filter((c) => c.is_member));
    } catch (error: any) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const createClub = async (
    name: string,
    description: string,
    isPrivate: boolean = false
  ) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create a book club',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('book_clubs')
        .insert({
          name,
          description,
          owner_id: user.id,
          is_private: isPrivate,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-add owner as member
      await supabase.from('book_club_members').insert({
        club_id: data.id,
        user_id: user.id,
        role: 'owner',
      });

      toast({
        title: 'Book club created!',
        description: `${name} has been created successfully`,
      });

      fetchClubs();
      return data.id;
    } catch (error: any) {
      console.error('Error creating club:', error);
      toast({
        title: 'Error',
        description: 'Failed to create book club',
        variant: 'destructive',
      });
      return null;
    }
  };

  const joinClub = async (clubId: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to join a book club',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase.from('book_club_members').insert({
        club_id: clubId,
        user_id: user.id,
        role: 'member',
      });

      if (error) throw error;

      toast({
        title: 'Joined club!',
        description: "You've successfully joined the book club",
      });

      fetchClubs();
      return true;
    } catch (error: any) {
      console.error('Error joining club:', error);
      toast({
        title: 'Error',
        description: 'Failed to join book club',
        variant: 'destructive',
      });
      return false;
    }
  };

  const leaveClub = async (clubId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('book_club_members')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Left club',
        description: "You've left the book club",
      });

      fetchClubs();
      return true;
    } catch (error: any) {
      console.error('Error leaving club:', error);
      return false;
    }
  };

  const deleteClub = async (clubId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('book_clubs')
        .delete()
        .eq('id', clubId)
        .eq('owner_id', user.id);

      if (error) throw error;

      toast({
        title: 'Club deleted',
        description: 'The book club has been deleted',
      });

      fetchClubs();
      return true;
    } catch (error: any) {
      console.error('Error deleting club:', error);
      return false;
    }
  };

  return {
    clubs,
    myClubs,
    loading,
    createClub,
    joinClub,
    leaveClub,
    deleteClub,
    refetch: fetchClubs,
  };
};

export const useBookClubDetails = (clubId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [club, setClub] = useState<BookClub | null>(null);
  const [members, setMembers] = useState<BookClubMember[]>([]);
  const [discussions, setDiscussions] = useState<BookClubDiscussion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClubDetails = useCallback(async () => {
    if (!clubId) return;

    setLoading(true);
    try {
      // Fetch club
      const { data: clubData, error: clubError } = await supabase
        .from('book_clubs')
        .select('*')
        .eq('id', clubId)
        .single();

      if (clubError) throw clubError;

      // Fetch members with profiles
      const { data: membersData, error: membersError } = await supabase
        .from('book_club_members')
        .select('*')
        .eq('club_id', clubId);

      if (membersError) throw membersError;

      // Fetch member profiles
      const memberIds = (membersData || []).map((m) => m.user_id);
      let profiles: any[] = [];
      if (memberIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', memberIds);
        profiles = data || [];
      }

      const profilesMap = new Map(profiles.map((p) => [p.id, p]));

      const enrichedMembers: BookClubMember[] = (membersData || []).map((m) => {
        const profile = profilesMap.get(m.user_id);
        return {
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          username: profile?.username || 'Unknown',
          avatar_url: profile?.avatar_url,
        };
      });

      // Fetch discussions
      const { data: discussionsData, error: discussionsError } = await supabase
        .from('book_club_discussions')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (discussionsError) throw discussionsError;

      // Get discussion author profiles
      const authorIds = [...new Set((discussionsData || []).map((d) => d.author_id))];
      let authorProfiles: any[] = [];
      if (authorIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', authorIds);
        authorProfiles = data || [];
      }

      const authorProfilesMap = new Map(authorProfiles.map((p) => [p.id, p]));

      const enrichedDiscussions: BookClubDiscussion[] = (discussionsData || []).map((d) => {
        const author = authorProfilesMap.get(d.author_id);
        return {
          id: d.id,
          club_id: d.club_id,
          author_id: d.author_id,
          title: d.title,
          content: d.content,
          book_id: d.book_id,
          chapter: d.chapter,
          created_at: d.created_at,
          author_username: author?.username || 'Unknown',
          author_avatar: author?.avatar_url,
        };
      });

      const isMember =
        clubData.owner_id === user?.id ||
        enrichedMembers.some((m) => m.user_id === user?.id);

      setClub({
        ...clubData,
        members_count: enrichedMembers.length,
        is_member: isMember,
      });
      setMembers(enrichedMembers);
      setDiscussions(enrichedDiscussions);
    } catch (error: any) {
      console.error('Error fetching club details:', error);
    } finally {
      setLoading(false);
    }
  }, [clubId, user]);

  useEffect(() => {
    fetchClubDetails();
  }, [fetchClubDetails]);

  const createDiscussion = async (title: string, content: string, chapter?: string) => {
    if (!user || !clubId) {
      toast({
        title: 'Error',
        description: 'Unable to create discussion',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('book_club_discussions')
        .insert({
          club_id: clubId,
          author_id: user.id,
          title,
          content,
          chapter: chapter || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Discussion created',
        description: 'Your discussion has been posted',
      });

      fetchClubDetails();
      return data.id;
    } catch (error: any) {
      console.error('Error creating discussion:', error);
      toast({
        title: 'Error',
        description: 'Failed to create discussion',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    club,
    members,
    discussions,
    loading,
    createDiscussion,
    refetch: fetchClubDetails,
  };
};
