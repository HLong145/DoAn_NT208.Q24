import { buildApiUrl } from './apiConfig';
import { getAuthSession } from './authApi';

export type NotificationType = 'like' | 'follow' | 'reply' | 'tweet' | 'message';

export type NotificationItem = {
  id: string;
  type: NotificationType;
  actor: {
    id: number;
    name: string;
    handle: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  isRead: boolean;
  targetId: string | null;
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

export function getNotifications() {
  return apiRequest<NotificationItem[]>('/notifications');
}

export function markAllNotificationsRead() {
  return apiRequest<{ message: string }>('/notifications/mark-all-read', {
    method: 'POST',
  });
}