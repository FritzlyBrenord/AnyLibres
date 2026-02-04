// =====================================================
// TYPES: Système de messagerie
// =====================================================

export interface Profile {
  id: string;
  user_id: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  email?: string;
  role?: string;
}

export interface Conversation {
  id: string;
  participants: string[]; // Array of profile IDs
  unread_count: Record<string, number>;
  last_message_text?: string;
  last_message_at?: string;
  last_message_sender_id?: string;
  typing_status: Record<string, string>;
  metadata: Record<string, any>;
  archived_by: Record<string, boolean>;
  created_at: string;
  updated_at: string;

  // Données jointes (non dans la DB)
  other_participant?: Profile;
  other_participant_name?: string;
  other_participant_avatar?: string;
  other_participant_email?: string;
  other_participant_role?: string;
}

export type MessageType =
  | 'text'
  | 'order_request'
  | 'order_accepted'
  | 'order_rejected'
  | 'revision_request'
  | 'delivery'
  | 'system';

export interface MessageAttachment {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  name: string;
  size: number;
  mime_type: string;
  thumbnail_url?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration_seconds?: number;
    pages?: number;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  text?: string;
  message_type: MessageType;
  reply_to_message_id?: string;
  attachments: MessageAttachment[];
  metadata: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  is_delivered: boolean;
  delivered_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;

  // Données jointes
  sender?: Profile;
  reply_to_message?: Message;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  profile_id: string;
  emoji: string;
  created_at: string;

  // Données jointes
  profile?: Profile;
}

export interface SendMessagePayload {
  conversation_id?: string; // Optional si nouvelle conversation
  receiver_id: string;
  text?: string;
  message_type?: MessageType;
  reply_to_message_id?: string;
  attachments?: File[];
  metadata?: Record<string, any>;
}

export interface UploadFileResponse {
  url: string;
  path: string;
  bucket: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}