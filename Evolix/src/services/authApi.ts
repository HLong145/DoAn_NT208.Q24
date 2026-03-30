export type AuthUser = {
  id: string;
  name: string;
  email: string;
  handle: string;
  createdAt: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

type AuthErrorResponse = {
  error?: string;
  message?: string;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const SESSION_STORAGE_KEY = 'evolix.auth.session';

export async function loginUser(email: string, password: string): Promise<AuthSession> {
  return requestAuth<AuthSession>('/auth/login', {
    email,
    password,
  });
}

export async function registerUser(name: string, email: string, password: string): Promise<AuthSession> {
  return requestAuth<AuthSession>('/auth/register', {
    name,
    email,
    password,
  });
}

export function saveAuthSession(session: AuthSession): void {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
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
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
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