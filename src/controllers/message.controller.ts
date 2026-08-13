import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";

import {
  sendMessage,
  getMessages,
  markSeen,
} from "../services/message.service";

import { updateLastMessage } from "../services/chat.service";

/**
 * Send Message
 */
export async function createMessage(
  req: AuthRequest,
  res: Response
) {
  try {
    const senderId = req.user?.uid;

    if (!senderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      chatId,
      receiverId,
      message,
      type,
      imageUrl,
      voiceUrl,
      fileUrl,
      replyTo,
      clientMessageId,
    } = req.body;

    const newMessage = await sendMessage({
      chatId: String(chatId),
      senderId,
      receiverId: String(receiverId),
    
      message: message || "",
    
      type: type || "text",
    
      imageUrl,
      voiceUrl,
      fileUrl,
    
      replyTo: replyTo
        ? {
            id: replyTo.id,
            message: replyTo.message,
            senderId: replyTo.senderId,
            type: replyTo.type,
          }
        : null,
    
      clientMessageId: String(clientMessageId),
    
      isSeen: false,
    });

    await updateLastMessage(
      String(chatId),
      message || "Attachment"
    );

    return res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
}

/**
 * Get Chat Messages
 */
export async function getChatMessages(
  req: AuthRequest,
  res: Response
) {
  try {
    const chatId = String(req.params.chatId);

    const messages = await getMessages(chatId);

    return res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
}

/**
 * Seen Messages
 */
export async function seenMessages(
  req: AuthRequest,
  res: Response
) {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const chatId = String(req.params.chatId);

    await markSeen(chatId, uid);

    return res.json({
      success: true,
      message: "Messages seen",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed",
    });
  }
}