import { buildApiUrl } from './apiConfig';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  handle: string;
  createdAt: string;
  avatarUrl: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type CurrentUserResponse = {
  user: AuthUser;
};

export type ChangePasswordResponse = {
  message: string;
};

export type DeactivateAccountResponse = {
  message: string;
};

type AuthErrorResponse = {
  error?: string;
  message?: string;
};

const SESSION_STORAGE_KEY = 'evolix.auth.session';
export const AUTH_SESSION_EVENT = 'evolix-auth-session-changed';

function notifyAuthSessionChanged(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export async function loginUser(email: string, password: string): Promise<AuthSession> {
  return requestAuth<AuthSession>('/auth/login', {
    email,
    password,
  });
}

export async function registerUser(username: string, email: string, password: string): Promise<AuthSession> {
  return requestAuth<AuthSession>('/auth/register', {
    username,
    email,
    password,
  });
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const session = getAuthSession();

  if (!session?.token) {
    throw new Error('Please sign in to continue.');
  }

  const response = await fetch(buildApiUrl('/auth/me'), {
    headers: {
      Authorization: `Bearer ${session.token}`,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as CurrentUserResponse & AuthErrorResponse;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? 'Request failed.');
  }

  return payload as CurrentUserResponse;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResponse> {
  const session = getAuthSession();

  if (!session?.token) {
    throw new Error('Please sign in to continue.');
  }

  const response = await fetch(buildApiUrl('/auth/password'), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const payload = (await response.json().catch(() => ({}))) as ChangePasswordResponse & AuthErrorResponse;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? 'Request failed.');
  }

  return payload as ChangePasswordResponse;
}

export async function deactivateAccount(): Promise<DeactivateAccountResponse> {
  const session = getAuthSession();

  if (!session?.token) {
    throw new Error('Please sign in to continue.');
  }

  const response = await fetch(buildApiUrl('/auth/deactivate'), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${session.token}`,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as DeactivateAccountResponse & AuthErrorResponse;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? 'Request failed.');
  }

  return payload as DeactivateAccountResponse;
}

export function saveAuthSession(session: AuthSession): void {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  notifyAuthSessionChanged();
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  notifyAuthSessionChanged();
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    return null;
  }
}

async function requestAuth<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as T & AuthErrorResponse;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? 'Request failed.');
  }

  return payload as T;
}