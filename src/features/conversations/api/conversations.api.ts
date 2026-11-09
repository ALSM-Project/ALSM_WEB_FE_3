import { apiClient } from '@/services/api/apiClient';
import type {
  ConversationItem,
  ConversationMessageItem,
  CreateConversationPayload,
  ListConversationsParams,
} from '../types/conversation';

export const conversationsApi = {
  list: async (params?: ListConversationsParams): Promise<ConversationItem[]> => {
    const qs = new URLSearchParams();
    if (params?.organizationId) qs.append('organizationId', params.organizationId);
    if (params?.projectId) qs.append('projectId', params.projectId);
    if (params?.type && params.type !== 'ALL') qs.append('type', params.type);
    if (params?.status && params.status !== 'ALL') qs.append('status', params.status);
    if (params?.search) qs.append('search', params.search);
    if (params?.unreadOnly) qs.append('unreadOnly', 'true');

    const query = qs.toString();
    const endpoint = `/crm/conversations${query ? `?${query}` : ''}`;
    return apiClient.get<ConversationItem[]>(endpoint);
  },

  getById: async (id: string): Promise<ConversationItem> => {
    return apiClient.get<ConversationItem>(`/crm/conversations/${encodeURIComponent(id)}`);
  },

  create: async (data: CreateConversationPayload): Promise<ConversationItem> => {
    return apiClient.post<ConversationItem>('/crm/conversations', data);
  },

  listMessages: async (conversationId: string): Promise<ConversationMessageItem[]> => {
    return apiClient.get<ConversationMessageItem[]>(
      `/crm/conversations/${encodeURIComponent(conversationId)}/messages`,
    );
  },

  postMessage: async (
    conversationId: string,
    data: { content: string; attachments?: any[] },
  ): Promise<ConversationMessageItem> => {
    return apiClient.post<ConversationMessageItem>(
      `/crm/conversations/${encodeURIComponent(conversationId)}/messages`,
      data,
    );
  },

  createWebSocket: (
    conversationId: string,
    user: { id?: string; email?: string; fullName?: string },
    callbacks: {
      onMessage: (msg: ConversationMessageItem) => void;
      onConversationUpdated?: (conv: any) => void;
      onOpen?: () => void;
      onClose?: () => void;
      onError?: (err: any) => void;
    },
  ): WebSocket | null => {
    try {
      const apiHost = window.location.hostname;
      const apiPort = '3000'; // Default BE port
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${apiHost}:${apiPort}/ws/crm-chat`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        callbacks.onOpen?.();
        // Send join packet
        ws.send(
          JSON.stringify({
            type: 'JOIN',
            userId: user.id,
            userEmail: user.email,
            userName: user.fullName || user.email?.split('@')[0],
            role: 'CUSTOMER',
            conversationId,
          }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_MESSAGE' && data.message) {
            callbacks.onMessage(data.message);
          } else if (data.type === 'CONVERSATION_UPDATED' && data.conversation) {
            callbacks.onConversationUpdated?.(data.conversation);
          }
        } catch (e) {
          console.warn('[CRM WS] Parse error:', e);
        }
      };

      ws.onclose = () => {
        callbacks.onClose?.();
      };

      ws.onerror = (err) => {
        callbacks.onError?.(err);
      };

      return ws;
    } catch (err) {
      console.warn('[CRM WS] Connection failed:', err);
      return null;
    }
  },
};
