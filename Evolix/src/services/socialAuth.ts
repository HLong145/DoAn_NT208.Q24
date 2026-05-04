import { loginUser, registerUser, type AuthSession } from './authApi';

export type GoogleAccountOption = {
  email: string;
  name: string;
};

type StoredGoogleAccount = GoogleAccountOption & {
  lastUsedAt: string;
};

const GOOGLE_ACCOUNTS_STORAGE_KEY = 'evolix.social.google.accounts';
const MAX_SAVED_GOOGLE_ACCOUNTS = 5;

export function getSavedGoogleAccounts(): GoogleAccountOption[] {
  return readStoredGoogleAccounts().map(({ email, name }) => ({ email, name }));
}

export function inferGoogleDisplayName(email: string): string {
  const localPart = normalizeEmail(email).split('@')[0] || 'Google User';

  return localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase()) || 'Google User';
}

export async function continueWithGoogle(input: GoogleAccountOption): Promise<AuthSession> {
  const email = normalizeEmail(input.email);
  if (!email) {
    throw new Error('Google email is required.');
  }

  const name = input.name.trim() || inferGoogleDisplayName(email);
  const demoPassword = createGooglePassword(email);

  try {
    const session = await loginUser(email, demoPassword);
    rememberGoogleAccount({ email, name });
    return session;
  } catch (error) {
    if (!isGoogleLoginCredentialError(error)) {
      throw error;
    }
  }

  try {
    const session = await registerUser(name, email, demoPassword);
    rememberGoogleAccount({ email, name });
    return session;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not continue with Google.';
    if (isGoogleDuplicateAccountError(message)) {
      throw new Error('This email is already used by another Evolix account. Use email/password login instead.');
    }

    throw new Error(message);
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createGooglePassword(email: string): string {
  return `google-demo-${normalizeEmail(email)}-access!`;
}

function isGoogleLoginCredentialError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';

  return /invalid email or password|username or password is incorrect/i.test(message);
}

function isGoogleDuplicateAccountError(message: string): boolean {
  return /already in use|has been used/i.test(message);
}

function readStoredGoogleAccounts(): StoredGoogleAccount[] {
  const accounts = readJson<StoredGoogleAccount[]>(GOOGLE_ACCOUNTS_STORAGE_KEY, []);

  return accounts
    .filter((account) => Boolean(account.email && account.name))
    .sort((left, right) => right.lastUsedAt.localeCompare(left.lastUsedAt));
}

function rememberGoogleAccount(account: GoogleAccountOption): void {
  const nextAccount: StoredGoogleAccount = {
    email: normalizeEmail(account.email),
    name: account.name.trim() || inferGoogleDisplayName(account.email),
    lastUsedAt: new Date().toISOString(),
  };

  const accounts = readStoredGoogleAccounts().filter((existing) => existing.email !== nextAccount.email);
  accounts.unshift(nextAccount);

  writeJson(GOOGLE_ACCOUNTS_STORAGE_KEY, accounts.slice(0, MAX_SAVED_GOOGLE_ACCOUNTS));
}

function readJson<T>(storageKey: string, fallbackValue: T): T {
  if (typeof window === 'undefined') {
    return fallbackValue;
  }

  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallbackValue;
  }
}

function writeJson(storageKey: string, value: unknown): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(value));
}