import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import type { User } from "@supabase/supabase-js";

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
}

interface Conversation {
  id: string;
}

const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const checkUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }, []);

  const fetchMessages = useCallback(async (activeConversationId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, message, sender_id, created_at")
      .eq("conversation_id", activeConversationId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Unable to load chat history",
        variant: "destructive",
      });
      return;
    }

    setMessages((data as Message[]) || []);
  }, [toast]);

  const getOrCreateConversation = useCallback(async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to start a chat",
        variant: "destructive",
      });
      return null;
    }

    const { data: existing, error: lookupError } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      toast({
        title: "Error",
        description: "Unable to start chat",
        variant: "destructive",
      });
      return null;
    }

    if (existing) {
      return (existing as Conversation).id;
    }

    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ user_id: user.id })
      .select("id")
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Unable to create chat",
        variant: "destructive",
      });
      return null;
    }

    return (data as Conversation).id;
  }, [toast, user]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (!conversationId) return;

    fetchMessages(conversationId);

    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
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
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !user) return;

    let activeConversationId = conversationId;
    if (!activeConversationId) {
      activeConversationId = await getOrCreateConversation();
      if (!activeConversationId) return;
      setConversationId(activeConversationId);
    }

    setLoading(true);

    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: activeConversationId,
      sender_id: user.id,
      message: newMessage.trim(),
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setNewMessage("");
    setLoading(false);
  };

  const handleOpen = async () => {
    setIsOpen(true);
    if (conversationId || !user) return;

    const id = await getOrCreateConversation();
    if (id) setConversationId(id);
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] h-[500px] shadow-2xl z-50 flex flex-col">
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

          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder={user ? "Type your message..." : "Login to start chatting"}
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
