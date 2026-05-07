import { buildApiUrl } from './apiConfig';
import { getAuthSession } from './authApi';

export type ConversationThread = {
  id: string;
  participant: {
    id: number;
    name: string;
    handle: string;
    avatar: string;
  };
  lastMessage: {
    id: string;
    content: string;
    timestamp: string;
    senderId: number;
    isMine: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
};

export type ConversationMessage = {
  id: string;
  senderId: number;
  sender: {
    id: number;
    name: string;
    handle: string;
    avatar: string;
  };
  content: string;
  mediaUrl?: string | null;
  timestamp: string;
  isMine: boolean;
  isRead: boolean;
};

type ApiErrorResponse = {
  error?: string;
  message?: string;
};

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = getAuthSession();

  if (!session?.token) {
    throw new Error('Please sign in to continue.');
  }

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${session.token}`);

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  });

  const payload = (await response.json().catch(() => ({}))) as T & ApiErrorResponse;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? 'Request failed.');
  }

  return payload as T;
}

export function getConversationThreads() {
  return apiRequest<ConversationThread[]>('/messages/threads');
}

export function createConversation(participantId: number) {
  return apiRequest<ConversationThread>('/messages/threads', {
    method: 'POST',
    body: JSON.stringify({ participantId }),
  });
}

export function getConversationMessages(threadId: number) {
  return apiRequest<ConversationMessage[]>(`/messages/threads/${threadId}/messages`);
}

export async function sendConversationMessage(threadId: number, content: string, mediaFile?: File) {
  const session = getAuthSession();
  if (!session?.token) throw new Error('Please sign in to continue.');

  const form = new FormData();
  form.append('content', content);
  if (mediaFile) form.append('media', mediaFile);

  const response = await fetch(buildApiUrl(`/messages/threads/${threadId}/messages`), {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.token}` },
    body: form,
  });

  type R = { conversationId: string; message: ConversationMessage } & { error?: string; message?: string };
  const payload = (await response.json().catch(() => ({}))) as R;
  if (!response.ok) throw new Error((payload as { error?: string; message?: string }).message ?? (payload as { error?: string }).error ?? 'Request failed.');
  return payload;
}