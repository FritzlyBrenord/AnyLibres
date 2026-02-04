// hooks/useConversations.ts
// Hook pour gérer les conversations avec temps réel
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Conversation } from '@/types/messaging';

interface UseConversationsOptions {
  adminMode?: boolean;
}

export function useConversations(options: UseConversationsOptions = {}) {
  const { adminMode = false } = options;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Charger les conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = adminMode
        ? '/api/admin/messages/conversations'
        : '/api/messages/conversations';

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.success) {
        setConversations(data.data.conversations);
        setProfileId(data.data.profile_id);
      } else {
        setError(data.error || 'Failed to load conversations');
      }
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [adminMode]);

  // Écouter les changements en temps réel
  useEffect(() => {
    loadConversations();

    const supabase = createClient();

    // Abonnement aux changements de conversations
    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('Conversation change:', payload);
          if (payload.eventType === 'INSERT') {
            const newConv = payload.new as Conversation;
            setConversations(prev => [newConv, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedConv = payload.new as Conversation;
            setConversations(prev => prev.map(c => c.id === updatedConv.id ? { ...c, ...updatedConv } : c));
          } else {
            loadConversations();
          }
        }
      )
      .subscribe();

    // Abonnement aux changements de messages (pour mettre à jour last_message)
    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('New message for conversations list:', payload);
          // On recharge quand même pour avoir les infos formatées (nom, avatar, etc)
          // mais on pourrait optimiser si on avait toutes les infos dans le payload
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [loadConversations]);

  return {
    conversations,
    loading,
    error,
    profileId,
    reload: loadConversations,
  };
}