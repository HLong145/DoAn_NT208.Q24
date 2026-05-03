import { buildApiUrl } from './apiConfig';
import { getAuthSession } from './authApi';
import type { TweetComment } from './tweetsApi';

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

export function createComment(tweetId: number, content: string) {
  return apiRequest<{ message: string; comment: unknown }>(`/comments/${tweetId}`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export function getComments(tweetId: number) {
  return apiRequest<TweetComment[]>(`/comments/${tweetId}`);
}