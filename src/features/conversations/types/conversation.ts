export type ConversationStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CUSTOMER' | 'CLOSED';
export type ConversationChannel = 'EMAIL' | 'PORTAL' | 'PHONE' | 'CHAT';
export type ConversationType = 'PROJECT' | 'SUPPORT' | 'GENERAL';

export interface ConversationParticipant {
  userId?: string;
  email: string;
  name: string;
  role: string;
  type: 'CUSTOMER' | 'ALSM';
  avatar?: string;
}

export interface ConversationAttachment {
  fileId?: string;
  name: string;
  url?: string;
  size?: number;
  mimeType?: string;
}

export interface ConversationItem {
  id: string;
  title: string;
  status: ConversationStatus;
  channel: ConversationChannel;
  leadId?: string;
  organizationId?: string;
  projectId?: string;
  projectName?: string;
  conversionRequestId?: string;
  requestNumber?: string;
  conversationType?: ConversationType;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  assignedToUserId?: string;
  assignedToEmail?: string;
  assignedToName?: string;
  participants?: ConversationParticipant[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConversationMessageItem {
  id: string;
  conversationId: string;
  senderUserId?: string;
  senderName: string;
  senderEmail: string;
  senderRole: 'CUSTOMER' | 'SALES_REP' | 'STAFF' | 'SYSTEM';
  content: string;
  isInternal: boolean;
  attachments?: ConversationAttachment[];
  createdAt: string;
}

export interface CreateConversationPayload {
  title: string;
  channel?: ConversationChannel;
  organizationId?: string;
  projectId?: string;
  projectName?: string;
  conversionRequestId?: string;
  requestNumber?: string;
  conversationType?: ConversationType;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  initialMessage?: string;
  participants?: ConversationParticipant[];
}

export interface ListConversationsParams {
  organizationId?: string;
  projectId?: string;
  type?: 'ALL' | 'PROJECT' | 'SUPPORT' | 'GENERAL';
  status?: string;
  search?: string;
  unreadOnly?: boolean;
}
