export interface ChatRoom {
  id?: string;

  jobId: string;
  customerId: string;
  workerId: string;

  bidId?: string;

  lastMessage: string;

  lastMessageAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}