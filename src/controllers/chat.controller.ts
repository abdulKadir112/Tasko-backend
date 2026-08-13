import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";

import {
  createChatRoom,
  getChatRoom,
  getCustomerChats,
  getWorkerChats,
} from "../services/chat.service";

/**
 * Create Chat Room
 * Bid Accepted হলে এই API call হবে
 */
export async function createChat(
  req: AuthRequest,
  res: Response
) {
  try {
    const customerId = req.user?.uid;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      workerId,
      jobId,
    } = req.body;

    // আগে Chat আছে কিনা দেখো
    const existing = await getChatRoom(
      jobId,
      workerId
    );

    if (existing) {
      return res.json({
        success: true,
        data: existing,
      });
    }

    const room = await createChatRoom({
        customerId,
        workerId,
        jobId,
        lastMessage: "",
        lastMessageAt: new Date(),
      });

    return res.status(201).json({
      success: true,
      message: "Chat created",
      data: room,
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create chat",
    });
  }
}

/**
 * Customer Chats
 */
export async function customerChats(
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

    const chats =
      await getCustomerChats(uid);

    return res.json({
      success: true,
      data: chats,
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch chats",
    });
  }
}

/**
 * Worker Chats
 */
export async function workerChats(
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

    const chats =
      await getWorkerChats(uid);

    return res.json({
      success: true,
      data: chats,
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch chats",
    });
  }
}

/**
 * Get Single Chat
 */
export async function getSingleChat(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      jobId,
      workerId,
    } = req.query;

    const room = await getChatRoom(
      String(jobId),
      String(workerId)
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    return res.json({
      success: true,
      data: room,
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed",
    });
  }
}