// hooks/useConversations.ts
// Hook pour gérer les conversations avec temps réel
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Conversation } from '@/types/messaging';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Charger les conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/messages/conversations');
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
  }, []);

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
          // Recharger les conversations
          loadConversations();
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
          console.log('New message:', payload);
          // Recharger les conversations
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