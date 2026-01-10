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
    if (!conversationId) {
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

        // Si des fichiers sont attachés, les uploader d'abord
        let attachmentsData: any[] = [];

        if (payload.attachments && payload.attachments.length > 0) {
          // Créer d'abord le message pour avoir un message_id
          const tempMessageResponse = await fetch('/api/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id: conversationId,
              receiver_id: payload.receiver_id,
              text: payload.text || '',
              message_type: payload.message_type || 'text',
              metadata: payload.metadata || {},
              attachments: [], // Vide pour l'instant
            }),
          });

          const tempMessageData = await tempMessageResponse.json();

          if (!tempMessageData.success) {
            throw new Error(tempMessageData.error || 'Failed to create message');
          }

          const messageId = tempMessageData.data.message.id;
          const finalConversationId = tempMessageData.data.conversation_id || conversationId;

          // Uploader chaque fichier
          attachmentsData = await Promise.all(
            payload.attachments.map(async (file) => {
              // Déterminer le type de fichier
              let fileType: 'image' | 'video' | 'audio' | 'document' = 'document';
              if (file.type.startsWith('image/')) fileType = 'image';
              else if (file.type.startsWith('video/')) fileType = 'video';
              else if (file.type.startsWith('audio/')) fileType = 'audio';

              const formData = new FormData();
              formData.append('file', file);
              formData.append('type', fileType);
              formData.append('conversation_id', finalConversationId);
              formData.append('message_id', messageId);

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

          // Mettre à jour le message avec les pièces jointes
          const updateResponse = await fetch('/api/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id: finalConversationId,
              receiver_id: payload.receiver_id,
              text: payload.text || '',
              message_type: payload.message_type || 'text',
              metadata: payload.metadata || {},
              attachments: attachmentsData,
              reply_to_message_id: payload.reply_to_message_id,
            }),
          });

          const finalData = await updateResponse.json();

          if (!finalData.success) {
            throw new Error(finalData.error || 'Failed to update message with attachments');
          }

          // Recharger les messages
          await loadMessages();

          return finalData.data;
        } else {
          // Pas de fichiers, envoyer normalement
          const response = await fetch('/api/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id: conversationId,
              ...payload,
            }),
          });

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error || 'Failed to send message');
          }

          // Recharger les messages
          await loadMessages();

          return data.data;
        }
      } catch (err: any) {
        console.error('Error sending message:', err);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [conversationId, loadMessages]
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
        (payload) => {
          console.log('New message received:', payload);
          // Recharger les messages
          loadMessages();
          scrollToBottom();
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
          // Recharger les messages
          loadMessages();
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