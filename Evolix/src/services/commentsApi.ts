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

export function createComment(tweetId: number, content: string, parentCommentId?: number, mediaFiles?: File[]) {
  const session = getAuthSession();
  if (!session?.token) return Promise.reject(new Error('Please sign in to continue.'));

  const form = new FormData();
  form.append('content', content);
  if (parentCommentId) form.append('parentCommentId', String(parentCommentId));
  mediaFiles?.forEach((f) => form.append('media', f));

  return fetch(buildApiUrl(`/comments/${tweetId}`), {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.token}` },
    body: form,
  }).then(async (res) => {
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload.message ?? payload.error ?? 'Request failed.');
    return payload as { message: string; status: string };
  });
}

export function getComments(tweetId: number) {
  return apiRequest<TweetComment[]>(`/comments/${tweetId}`);
}