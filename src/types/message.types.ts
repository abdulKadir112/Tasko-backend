export type MessageType =
  | "text"
  | "image"
  | "voice"
  | "file";

export interface ReplyMessage {
  id: string;
  message: string;
  senderId: string;
  type: MessageType;
}

export interface Message {
  /**
   * Firestore document ID
   * Server থেকে আসবে
   */
  id?: string;

  /**
   * ⭐ Frontend generated unique ID
   * Duplicate message আটকানোর জন্য ব্যবহার হবে
   */
  clientMessageId: string;

  /**
   * Chat information
   */
  chatId: string;

  senderId: string;
  receiverId: string;

  /**
   * Message content
   */
  message: string;

  /**
   * Message type
   */
  type: MessageType;

  /**
   * Attachments
   */
  imageUrl?: string | null;
  voiceUrl?: string | null;
  fileUrl?: string | null;

  /**
   * Reply message
   */
  replyTo?: ReplyMessage | null;

  /**
   * Seen status
   */
  isSeen: boolean;

  /**
   * Server timestamps
   */
  createdAt?: Date;
  updatedAt?: Date;
}