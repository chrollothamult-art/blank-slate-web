import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  created_at: string;
  updated_at: string;
  other_user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
    is_read: boolean;
    sender_id: string;
  };
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export const usePrivateMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: convData, error } = await supabase
        .from('private_conversations')
        .select('*')
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (!convData || convData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get all other user IDs
      const otherUserIds = convData.map(c => 
        c.participant_one === user.id ? c.participant_two : c.participant_one
      );

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', otherUserIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch last messages and unread counts
      const enrichedConversations = await Promise.all(
        convData.map(async (conv) => {
          const otherId = conv.participant_one === user.id ? conv.participant_two : conv.participant_one;
          
          // Get last message
          const { data: lastMsgData } = await supabase
            .from('private_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // Get unread count
          const { count } = await supabase
            .from('private_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          return {
            ...conv,
            other_user: profileMap.get(otherId),
            last_message: lastMsgData?.[0],
            unread_count: count || 0,
          };
        })
      );

      setConversations(enrichedConversations);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const startConversation = async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('private_conversations')
        .select('id')
        .or(`and(participant_one.eq.${user.id},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${user.id})`)
        .single();

      if (existing) {
        return existing.id;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('private_conversations')
        .insert({
          participant_one: user.id,
          participant_two: otherUserId,
        })
        .select()
        .single();

      if (error) throw error;

      fetchConversations();
      return data.id;
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      return null;
    }
  };

  const sendMessage = async (conversationId: string, content: string): Promise<boolean> => {
    if (!user || !content.trim()) return false;

    try {
      const { error } = await supabase
        .from('private_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
        });

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('private_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return true;
    } catch (error: any) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  const getMessages = async (conversationId: string): Promise<Message[]> => {
    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      return [];
    }
  };

  const markAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('private_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      fetchConversations();
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    startConversation,
    sendMessage,
    getMessages,
    markAsRead,
    refetch: fetchConversations,
  };
};
