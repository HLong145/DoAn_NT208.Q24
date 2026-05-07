import { buildApiUrl } from './apiConfig';
import { getAuthSession } from './authApi';

export type UserSummary = {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
  displayName?: string;
};

export type UserProfile = {
  user: {
    id: number;
    name: string;
    handle: string;
    email: string;
    bio: string;
    location: string;
    website: string;
    avatarUrl: string;
    headerUrl: string;
    joined: string;
    followingCount: number;
    followersCount: number;
    postsCount: number;
    isFollowing: boolean;
  };
};

export type UpdateProfilePayload = {
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatarUrl?: string;
  headerUrl?: string;
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

export function searchUsers(query: string) {
  return apiRequest<UserSummary[]>(`/users/search?q=${encodeURIComponent(query)}`);
}

export function getSuggestions() {
  return apiRequest<UserSummary[]>('/users/suggestions');
}

export function getUserProfile(handle: string) {
  return apiRequest<UserProfile>(`/users/profile/${encodeURIComponent(handle)}`);
}

export function updateMyProfile(payload: UpdateProfilePayload) {
  return apiRequest<UserProfile>('/users/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function uploadProfileImage(file: File): Promise<string> {
  const session = getAuthSession();
  if (!session?.token) throw new Error('Please sign in to continue.');

  const form = new FormData();
  form.append('file', file);

  const response = await fetch(buildApiUrl('/users/me/upload'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.token}` },
    body: form,
  });

  type R = { url: string } & { error?: string; message?: string };
  const payload = (await response.json().catch(() => ({}))) as R;
  if (!response.ok) throw new Error(payload.message ?? payload.error ?? 'Upload failed.');
  return payload.url;
}
