import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
}

const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createConversation = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to start a chat",
        variant: "destructive",
      });
      return null;
    }

    const { data, error } = await supabase
      .from('chat_conversations' as any)
      .insert({ user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return (data as any).id;
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from('chat_messages' as any)
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages((data as any) || []);
  };

  const subscribeToMessages = () => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;

    let currentConversationId = conversationId;
    
    if (!currentConversationId) {
      currentConversationId = await createConversation();
      if (!currentConversationId) return;
      setConversationId(currentConversationId);
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('chat_messages' as any)
        .insert({
          conversation_id: currentConversationId,
          sender_id: user.id,
          message: newMessage,
        });

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    if (!conversationId && user) {
      const id = await createConversation();
      if (id) setConversationId(id);
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-accent text-accent-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Live Chat</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-accent-foreground hover:bg-accent-foreground/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm mt-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Start a conversation with us!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      msg.sender_id === user?.id
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={loading || !user}
              />
              <Button type="submit" size="icon" disabled={loading || !user}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
};

export default LiveChat;
