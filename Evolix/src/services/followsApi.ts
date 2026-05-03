import { buildApiUrl } from './apiConfig';
import { getAuthSession } from './authApi';

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

export function getFollowingIds() {
  return apiRequest<number[]>('/follows/following');
}

export function toggleFollow(followingId: number) {
  return apiRequest<{ message: string; status: string }>(`/follows/${followingId}`, {
    method: 'POST',
  });
}