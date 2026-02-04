"use client";

import React, { useState, useEffect } from "react";
import { Mail, MessageSquare, Check, X, User, Send, Clock, RefreshCw, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePermissions } from "@/contexts/PermissionsContext";

export function SupportManagement({ isDark = false }: { isDark?: boolean }) {
  const { hasPermission } = usePermissions();
  
  const canViewTickets = hasPermission('support.tickets.view');
  const canCloseTicket = hasPermission('support.tickets.close');
  const canViewChats = hasPermission('support.chats.view');
  const canCloseChat = hasPermission('support.chats.close');
  const canReopenChat = hasPermission('support.chats.reopen');
  const canMessage = hasPermission('support.chats.message');

  const [activeTab, setActiveTab] = useState<"tickets" | "chats">("tickets");
  
  // Tickets State
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Chats State
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [adminInput, setAdminInput] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (activeTab === "tickets" && canViewTickets) fetchTickets();
    else if (activeTab === "chats" && canViewChats) fetchChats();
  }, [activeTab, canViewTickets, canViewChats]);

  // --- TICKETS LOGIC ---
  const fetchTickets = async () => {
    setLoadingTickets(true);
    const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (data) setTickets(data);
    setLoadingTickets(false);
  };

  const closeTicket = async (id: string) => {
    await supabase.from('support_tickets').update({ status: 'closed' }).eq('id', id);
    fetchTickets();
  };

  // --- CHATS LOGIC ---
  const fetchChats = async () => {
    setLoadingChats(true);
    const { data, error } = await supabase
      .from('support_chats')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching chats:", error);
      setLoadingChats(false);
      return;
    }
    
    if (data && data.length > 0) {
      // Get all unique user IDs
      const userIds = [...new Set(data.map(chat => chat.user_id).filter(Boolean))];
      
      // Fetch emails from API
      let userEmails: Record<string, string> = {};
      
      if (userIds.length > 0) {
        try {
          const response = await fetch('/api/support/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_ids: userIds })
          });
          
          const result = await response.json();
          if (result.success) {
            userEmails = result.data;
          }
        } catch (err) {
          console.error('Error fetching user emails:', err);
        }
      }
      
      // Map emails to chats
      const chatsWithEmails = data.map(chat => ({
        ...chat,
        profile: chat.user_id && userEmails[chat.user_id] 
          ? { email: userEmails[chat.user_id], first_name: null, last_name: null }
          : null
      }));
      
      setChats(chatsWithEmails);
    } else {
      setChats([]);
    }
    
    setLoadingChats(false);
  };

  const closeChat = async (chatId: string) => {
    if (!confirm('Voulez-vous vraiment fermer cette conversation ?')) return;
    
    await supabase
      .from('support_chats')
      .update({ status: 'closed', ended_at: new Date().toISOString() })
      .eq('id', chatId);
    
    fetchChats();
  };

  const reopenChat = async (chatId: string) => {
    await supabase
      .from('support_chats')
      .update({ status: 'active', ended_at: null })
      .eq('id', chatId);
    
    fetchChats();
  };

  // Realtime subscription for list updates? (Optional, skipping for now to save complexity)

  // Chat Selection
  useEffect(() => {
    if (!selectedChatId) return;

    // Load Messages
    const loadMessages = async () => {
      const { data } = await supabase
        .from('support_messages')
        .select('*')
        .eq('chat_id', selectedChatId)
        .neq('sender_type', 'bot') // Exclude bot messages from admin view
        .order('created_at', { ascending: true });
      if (data) setChatMessages(data);
    };
    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`admin:chat:${selectedChatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `chat_id=eq.${selectedChatId}` },
        (payload) => {
          const newMsg = payload.new as any;
          // Only show user and admin messages, not bot messages
          if (newMsg.sender_type !== 'bot') {
            setChatMessages(prev => [...prev, newMsg]);
          }
          // Mark chat as active if not already
          supabase.from('support_chats').update({ status: 'active', updated_at: new Date() }).eq('id', selectedChatId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatId]);

  const sendAdminMessage = async () => {
    if (!adminInput.trim() || !selectedChatId) return;
    
    await supabase.from('support_messages').insert({
      chat_id: selectedChatId,
      sender_type: 'admin',
      content: adminInput,
    });
    
    // Update chat status
    await supabase.from('support_chats').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', selectedChatId);

    setAdminInput("");
  };

  return (
    <div className={`p-6 space-y-6 ${isDark ? 'bg-slate-950' : 'bg-slate-50'} min-h-screen transition-colors duration-300`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Support Client</h1>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gérez les tickets et le chat en direct</p>
        </div>
        <div className={`flex ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-lg p-1 shadow-sm border`}>
          <button
            onClick={() => setActiveTab("tickets")}
            disabled={!canViewTickets}
            className={`px-4 py-2 rounded-md transition-all font-medium flex items-center gap-2 ${
              activeTab === "tickets" 
                ? "bg-indigo-600 text-white shadow-sm" 
                : !canViewTickets
                  ? isDark ? "text-slate-600 cursor-not-allowed bg-slate-800" : "text-slate-400 cursor-not-allowed bg-slate-100"
                  : isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {!canViewTickets && <Lock className="w-3 h-3" />}
            Tickets ({canViewTickets ? tickets.filter(t => t.status === 'open').length : '-'})
          </button>
          <button
            onClick={() => setActiveTab("chats")}
            disabled={!canViewChats}
            className={`px-4 py-2 rounded-md transition-all font-medium flex items-center gap-2 ${
              activeTab === "chats" 
                ? "bg-indigo-600 text-white shadow-sm" 
                : !canViewChats
                  ? isDark ? "text-slate-600 cursor-not-allowed bg-slate-800" : "text-slate-400 cursor-not-allowed bg-slate-100"
                  : isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {!canViewChats && <Lock className="w-3 h-3" />}
            Live Chat ({canViewChats ? chats.filter(c => c.status === 'pending').length : '-'})
          </button>
        </div>
      </div>

      {/* TICKETS VIEW */}
      {activeTab === "tickets" && canViewTickets && (
        <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-xl shadow-sm border overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'} border-b`}>
                <tr>
                  <th className={`px-6 py-4 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Sujet</th>
                  <th className={`px-6 py-4 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Utilisateur / Email</th>
                  <th className={`px-6 py-4 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Message</th>
                  <th className={`px-6 py-4 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Date</th>
                  <th className={`px-6 py-4 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className={`${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} transition-colors`}>
                    <td className={`px-6 py-4 font-medium ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{ticket.subject}</td>
                    <td className={`px-6 py-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{ticket.email || "Anonyme"}</td>
                    <td className={`px-6 py-4 ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-xs truncate`} title={ticket.message}>
                      {ticket.message}
                    </td>
                    <td className={`px-6 py-4 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {ticket.status === 'closed' ? (
                        <span className={`px-2 py-1 ${isDark ? 'bg-green-500/10 text-green-500' : 'bg-green-100 text-green-700'} rounded-full text-xs font-bold`}>Fermé</span>
                      ) : (
                        <button
                          onClick={() => closeTicket(ticket.id)}
                          disabled={!canCloseTicket}
                          className={`px-3 py-1 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'} rounded-lg transition-colors text-xs ${
                            !canCloseTicket ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title={!canCloseTicket ? "Permission manquante" : "Fermer le ticket"}
                        >
                          {canCloseTicket ? 'Fermer' : 'Fermer (Non autorisé)'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tickets.length === 0 && !loadingTickets && (
               <div className="p-8 text-center text-slate-500">Aucun ticket pour le moment.</div>
            )}
          </div>
        </div>
      )}

       {/* CHATS VIEW */}
      {activeTab === "chats" && canViewChats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Chat List */}
          <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-xl shadow-sm border overflow-hidden flex flex-col`}>
            <div className={`p-4 border-b ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-200 bg-slate-50'} flex justify-between items-center`}>
               <h3 className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Conversations</h3>
               <button onClick={fetchChats} className={`p-1 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'} rounded`}><RefreshCw className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}/></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} cursor-pointer transition-colors ${
                    selectedChatId === chat.id 
                      ? isDark ? "bg-indigo-500/10 border-l-4 border-l-indigo-600" : "bg-indigo-50 border-l-4 border-l-indigo-600" 
                      : isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between mb-1">
                    <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      {chat.profile?.email || "Visiteur"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      chat.status === 'pending' ? isDark ? 'bg-orange-500/10 text-orange-500' : 'bg-orange-100 text-orange-600' : 
                      chat.status === 'active' ? isDark ? 'bg-green-500/10 text-green-500' : 'bg-green-100 text-green-600' : 
                      isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {chat.status}
                    </span>
                  </div>
                  <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'} flex items-center gap-1`}>
                    <Clock className="w-3 h-3" />
                    {new Date(chat.updated_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className={`lg:col-span-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-xl shadow-sm border overflow-hidden flex flex-col`}>
            {selectedChatId ? (
              <>
                <div className={`p-4 border-b ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-200 bg-slate-50'} flex justify-between items-center`}>
                   <div>
                     <h3 className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Discussion en cours</h3>
                     <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                       {chats.find(c => c.id === selectedChatId)?.profile?.email || 'Email non disponible'}
                     </p>
                   </div>
                   <div className="flex gap-2">
                     {chats.find(c => c.id === selectedChatId)?.status === 'closed' ? (
                       <button
                         onClick={() => reopenChat(selectedChatId!)}
                         disabled={!canReopenChat}
                         className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                           !canReopenChat ? 'opacity-50 cursor-not-allowed' : ''
                         }`}
                         title={!canReopenChat ? "Permission manquante" : "Réouvrir"}
                       >
                         <Check className="w-4 h-4" />
                         Réouvrir
                       </button>
                     ) : (
                       <button
                         onClick={() => closeChat(selectedChatId!)}
                         disabled={!canCloseChat}
                         className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                           !canCloseChat ? 'opacity-50 cursor-not-allowed' : ''
                         }`}
                         title={!canCloseChat ? "Permission manquante" : "Fermer"}
                       >
                         <X className="w-4 h-4" />
                         Fermer
                       </button>
                     )}
                   </div>
                </div>
                
                <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-slate-950/50' : 'bg-slate-50/50'}`}>
                  {chatMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[80%] ${
                        msg.sender_type === 'admin' ? "ml-auto flex-row-reverse" : ""
                      }`}
                    >
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                         msg.sender_type === 'admin' 
                            ? "bg-indigo-600 text-white" 
                            : isDark ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border border-slate-200 text-slate-600"
                       }`}>
                         {msg.sender_type === 'admin' ? <User className="w-4 h-4"/> : <User className="w-4 h-4"/>}
                       </div>
                       <div className={`p-3 rounded-2xl text-sm ${
                         msg.sender_type === 'admin' 
                           ? "bg-indigo-600 text-white rounded-tr-none" 
                           : isDark ? "bg-slate-800 border-slate-700 text-slate-200 rounded-tl-none" : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                       }`}>
                         {msg.content}
                       </div>
                    </div>
                  ))}
                </div>

                {/* Input - Only show if chat is not closed */}
                {chats.find(c => c.id === selectedChatId)?.status !== 'closed' ? (
                  <div className={`p-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-t`}>
                    <form 
                      onSubmit={(e) => { e.preventDefault(); sendAdminMessage(); }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        className={`flex-1 px-4 py-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-indigo-500/20' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-100'} border rounded-lg focus:ring-2 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 ${isDark ? 'disabled:bg-slate-900' : 'disabled:bg-slate-100'}`}
                        placeholder={canMessage ? "Votre réponse..." : "Permission de répondre manquante"}
                        value={adminInput}
                        onChange={(e) => setAdminInput(e.target.value)}
                        disabled={!canMessage}
                      />
                      <button 
                        type="submit" 
                        disabled={!canMessage}
                        className={`px-4 py-2 bg-indigo-600 text-white rounded-lg transition-colors ${
                          !canMessage ? 'opacity-50 cursor-not-allowed hover:bg-indigo-600' : 'hover:bg-indigo-700'
                        }`}
                        title={!canMessage ? "Permission manquante" : "Envoyer"}
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className={`p-4 ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-100 border-slate-200'} border-t text-center`}>
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'} font-medium`}>Cette conversation est fermée</p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'} mt-1`}>Cliquez sur "Réouvrir" pour continuer la discussion</p>
                  </div>
                )}
              </>
            ) : (
              <div className={`flex-1 flex flex-col items-center justify-center ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                <p>Sélectionnez une conversation pour commencer</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
