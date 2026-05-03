import { buildApiUrl } from './apiConfig';
import { getAuthSession } from './authApi';
import type { TimelineTweet } from './tweetsApi';

type ApiErrorResponse = {
  error?: string;
  message?: string;
};

type ToggleBookmarkResponse = {
  message: string;
  bookmarked: boolean;
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

export function getBookmarkedTweets() {
  return apiRequest<TimelineTweet[]>('/bookmarks');
}

export function toggleBookmark(tweetId: number) {
  return apiRequest<ToggleBookmarkResponse>(`/bookmarks/${tweetId}`, {
    method: 'POST',
  });
}