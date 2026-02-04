// hooks/useMessages.ts
// Hook pour gérer les messages d'une conversation avec temps réel
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message, SendMessagePayload } from '@/types/messaging';

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les messages
  const loadMessages = useCallback(async () => {
    if (!conversationId || conversationId.startsWith('temp_')) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/messages/${conversationId}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.data.messages);
        setProfileId(data.data.profile_id);

        // Marquer tous les messages comme lus
        await markAsRead(conversationId);
      } else {
        setError(data.error || 'Failed to load messages');
      }
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Envoyer un message
  const sendMessage = useCallback(
    async (payload: SendMessagePayload) => {
      if (!conversationId && !payload.receiver_id) {
        throw new Error('receiver_id is required when creating a new conversation');
      }

      try {
        setSending(true);

        let attachmentsData: any[] = [];

        // 1. Uploader d'abord si on a des fichiers
        if (payload.attachments && payload.attachments.length > 0) {
          // Utiliser un ID temporaire pour le dossier d'upload si on n'a pas encore de message_id
          const tempFolderId = `temp_${Date.now()}`;

          attachmentsData = await Promise.all(
            payload.attachments.map(async (file) => {
              let fileType: 'image' | 'video' | 'audio' | 'document' = 'document';
              if (file.type.startsWith('image/')) fileType = 'image';
              else if (file.type.startsWith('video/')) fileType = 'video';
              else if (file.type.startsWith('audio/')) fileType = 'audio';

              const formData = new FormData();
              formData.append('file', file);
              formData.append('type', fileType);
              formData.append('conversation_id', conversationId || 'new');
              formData.append('message_id', tempFolderId);

              const uploadResponse = await fetch('/api/messages/upload', {
                method: 'POST',
                body: formData,
              });

              const uploadData = await uploadResponse.json();
              if (!uploadData.success) {
                throw new Error(uploadData.error || 'Failed to upload file');
              }

              return {
                type: fileType,
                url: uploadData.data.url,
                name: file.name,
                size: file.size,
                mime_type: file.type,
              };
            })
          );
        }

        // 2. Envoyer une SEULE requête de création de message
        const response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: conversationId,
            ...payload,
            attachments: attachmentsData, // Inclure les fichiers uploadés
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to send message');
        }

        // On ne recharge pas forcément ici si le Realtime s'en occupe, 
        // mais pour l'expérience utilisateur immédiate, on peut ajouter le message localement
        // ou attendre le signal Realtime qui arrive généralement très vite.

        return data.data;
      } catch (err: any) {
        console.error('Error sending message:', err);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [conversationId]
  );

  // Marquer comme lu
  const markAsRead = useCallback(async (convId: string) => {
    try {
      await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: convId }),
      });
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, []);

  // Uploader un fichier
  const uploadFile = useCallback(
    async (file: File, type: 'image' | 'video' | 'audio' | 'document', messageId: string) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        formData.append('conversation_id', conversationId || '');
        formData.append('message_id', messageId);

        const response = await fetch('/api/messages/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to upload file');
        }

        return data.data;
      } catch (err: any) {
        console.error('Error uploading file:', err);
        throw err;
      }
    },
    [conversationId]
  );

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Écouter les changements en temps réel
  useEffect(() => {
    loadMessages();

    if (!conversationId) return;

    const supabase = createClient();

    // Abonnement aux nouveaux messages
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as Message;

          // Récupérer les infos de l'expéditeur si nécessaire
          // (Optionnel : si le payload ne contient pas le sender, on peut faire un fetch léger ou ignorer si c'est nous)

          setMessages((prev) => {
            // Éviter les doublons si le message a déjà été ajouté (ex: via la réponse de l'API)
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });

          scrollToBottom();

          // Marquer comme lu si on est sur la conversation
          markAsRead(conversationId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Message updated:', payload);
          const updatedMessage = payload.new as Message;
          setMessages((prev) =>
            prev.map(m => m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Message deleted:', payload);
          setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, loadMessages, scrollToBottom]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return {
    messages,
    loading,
    error,
    sending,
    profileId,
    sendMessage,
    uploadFile,
    reload: loadMessages,
    messagesEndRef,
    scrollToBottom,
  };
}