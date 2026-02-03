import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrivateMessages, Conversation, Message } from '@/hooks/usePrivateMessages';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Send, ArrowLeft, Search, X, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PrivateMessagingProps {
  isOpen: boolean;
  onClose: () => void;
  initialUserId?: string;
}

export const PrivateMessaging = ({ isOpen, onClose, initialUserId }: PrivateMessagingProps) => {
  const { user } = useAuth();
  const { conversations, loading, startConversation, sendMessage, getMessages, markAsRead, refetch } = usePrivateMessages();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle initial user ID
  useEffect(() => {
    if (initialUserId && isOpen) {
      handleStartConversation(initialUserId);
    }
  }, [initialUserId, isOpen]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadMessages();
      markAsRead(activeConversation);
    }
  }, [activeConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!activeConversation) return;

    const channel = supabase
      .channel(`messages:${activeConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `conversation_id=eq.${activeConversation}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          markAsRead(activeConversation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation]);

  const loadMessages = async () => {
    if (!activeConversation) return;
    const msgs = await getMessages(activeConversation);
    setMessages(msgs);
  };

  const handleStartConversation = async (userId: string) => {
    const convId = await startConversation(userId);
    if (convId) {
      setActiveConversation(convId);
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleSendMessage = async () => {
    if (!activeConversation || !newMessage.trim()) return;

    setIsSending(true);
    const success = await sendMessage(activeConversation, newMessage);
    if (success) {
      setNewMessage('');
      refetch();
    }
    setIsSending(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .neq('id', user?.id)
        .ilike('username', `%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const activeConv = conversations.find(c => c.id === activeConversation);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Private Messages</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-center py-8">
            Please sign in to use private messaging.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
            {totalUnread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {totalUnread}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Conversations List */}
          {!activeConversation ? (
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b">
                <Button 
                  onClick={() => setShowNewChat(true)} 
                  className="w-full"
                  variant="outline"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  New Conversation
                </Button>
              </div>

              {showNewChat ? (
                <div className="p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowNewChat(false)}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-medium">Start New Chat</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {searchResults.map((profile) => (
                        <Card
                          key={profile.id}
                          className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleStartConversation(profile.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={profile.avatar_url || undefined} />
                              <AvatarFallback>
                                {profile.username?.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{profile.username}</span>
                          </div>
                        </Card>
                      ))}
                      {searchQuery && searchResults.length === 0 && !isSearching && (
                        <p className="text-center text-muted-foreground py-4">
                          No users found
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="p-4 text-center text-muted-foreground">Loading...</div>
                  ) : conversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No conversations yet</p>
                      <p className="text-sm">Start a new chat to connect with others</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setActiveConversation(conv.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={conv.other_user?.avatar_url || undefined} />
                              <AvatarFallback>
                                {conv.other_user?.username?.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {conv.other_user?.username || 'Unknown'}
                                </span>
                                {conv.unread_count > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {conv.unread_count}
                                  </Badge>
                                )}
                              </div>
                              {conv.last_message && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {conv.last_message.sender_id === user.id ? 'You: ' : ''}
                                  {conv.last_message.content}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
            </div>
          ) : (
            // Active Conversation View
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setActiveConversation(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activeConv?.other_user?.avatar_url || undefined} />
                  <AvatarFallback>
                    {activeConv?.other_user?.username?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{activeConv?.other_user?.username || 'Unknown'}</span>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-3 py-2 rounded-2xl ${
                          msg.sender_id === user.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === user.id 
                            ? 'text-primary-foreground/70' 
                            : 'text-muted-foreground'
                        }`}>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
