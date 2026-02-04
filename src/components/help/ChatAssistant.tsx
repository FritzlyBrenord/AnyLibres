"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, User, Bot, X, HeadphonesIcon, Loader2 } from "lucide-react";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/utils/utils";

interface Message {
  id: string;
  sender_type: "user" | "bot" | "admin";
  content: string;
  created_at: string;
}

interface ChatAssistantProps {
  requestsContact?: () => void;
}

export function ChatAssistant({ requestsContact }: ChatAssistantProps) {
  const { t } = useSafeLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  // Initial greeting (Local only)
  useEffect(() => {
    if (isOpen && messages.length === 0 && !chatId) {
      setMessages([
        {
          id: "welcome",
          sender_type: "bot",
          content: t.help.chat.welcome,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  }, [isOpen, messages.length, t, chatId]);

  // Realtime Subscription
  useEffect(() => {
    if (!chatId) return;

    // Load history
    fetch(`/api/support/chat/${chatId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessages(data.data);
        }
      });

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
             if (prev.find(m => m.id === newMsg.id)) return prev;
             return [...prev, newMsg];
          });
          // Stop typing indicator if admin sent message
          if (newMsg.sender_type === 'admin') setIsTyping(false);
        }
      )
      .subscribe();

    // Subscribe to chat status changes
    const chatChannel = supabase
      .channel(`chat_status:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'support_chats', filter: `id=eq.${chatId}` },
        (payload) => {
          const updatedChat = payload.new as any;
          if (updatedChat.status === 'closed') {
            // Chat was closed by admin - return to bot mode
            setChatId(null);
            setMessages([
              {
                id: 'closed',
                sender_type: 'bot',
                content: 'La conversation a été terminée par notre équipe. Si vous avez besoin d\'aide, je suis là pour vous assister !',
                created_at: new Date().toISOString(),
              }
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [chatId]);

  const startLiveChat = async () => {
    setConnecting(true);
    try {
      // Create chat with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch('/api/support/chat', { 
         method: 'POST',
         signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      
      if (data.success) {
        setChatId(data.data.id);
        if (data.data.status === 'pending') {
           setIsTyping(true);
           setTimeout(() => setIsTyping(false), 2000);
        }
      } else {
        const errorMessage: Message = {
           id: Date.now().toString(),
           sender_type: "bot",
           content: "Erreur: Impossible de contacter un agent. Vérifiez votre configuration (SQL).",
           created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (e: any) {
      console.error(e);
      const errorMessage: Message = {
           id: Date.now().toString(),
           sender_type: "bot",
           content: `Erreur: ${e.message || "Connexion impossible"}. (Vérifiez Console)`,
           created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setConnecting(false);
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    // Optimistic UI for local bot chat
    if (!chatId) {
       const newMessage: Message = {
        id: Date.now().toString(),
        sender_type: "user",
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setInput("");
      setIsTyping(true);

      // Simple local logic
      setTimeout(() => {
        let responseText = "";
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes("agent") || lowerText.includes("humain")) {
           startLiveChat(); // Upgrade to Live Chat
           return;
        }
        
        if (lowerText.includes("commande")) responseText = t.help.faq.items[2].a;
        else if (lowerText.includes("paiement")) responseText = t.help.faq.items[1].a;
        else responseText = "Je peux vous aider avec vos commandes ou paiements. Sinon, demandez un agent.";

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender_type: "bot",
          content: responseText,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000);
      return;
    }

    // Live Chat Logic - User messages go directly to API
    try {
       // Send to API
       await fetch(`/api/support/chat/${chatId}`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ content: text, sender_type: 'user' })
       });
       setInput("");
    } catch (e) {
      console.error("Error sending message", e);
    }
  };

  const topics = [
    { id: "order", label: t.help.chat.topics.order, query: "Problème avec ma commande" },
    { id: "payment", label: t.help.chat.topics.payment, query: "Comment fonctionnent les paiements ?" },
    { id: "agent", label: t.help.chat.talkToAgent, query: "Je veux parler à un agent" },
  ];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition-all hover:scale-105 z-40 group"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-slate-900 px-3 py-1 rounded-lg text-sm font-medium shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {t.help.chat.title}
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                {chatId ? <HeadphonesIcon className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-bold">{chatId ? "Support en direct" : t.help.chat.title}</h3>
                <div className="flex items-center gap-1.5">
                  <span className={cn("w-2 h-2 rounded-full animate-pulse", chatId ? "bg-green-400" : "bg-blue-400")} />
                  <span className="text-xs text-slate-300">{chatId ? "Connecté" : "Assistant virtuel"}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.sender_type === "user" ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm",
                    msg.sender_type === "user"
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-slate-900 text-white"
                  )}
                >
                  {msg.sender_type === "user" ? <User className="w-4 h-4" /> : 
                   msg.sender_type === "admin" ? <HeadphonesIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={cn(
                    "p-3 rounded-2xl text-sm shadow-sm",
                    msg.sender_type === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {(isTyping || connecting) && (
              <div className="flex gap-3 max-w-[80%]">
                 <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex-shrink-0 flex items-center justify-center">
                    {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                 </div>
                 <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-1">
                    {connecting ? <span className="text-xs text-slate-500 italic">Connexion...</span> : (
                      <>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                      </>
                    )}
                 </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Topics (Only if not in live chat) */}
          {!chatId && messages.length < 3 && (
            <div className="px-4 py-2 bg-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleSend(topic.query)}
                  className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                >
                  {topic.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.help.chat.inputPlaceholder}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all outline-none text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || connecting}
                className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

