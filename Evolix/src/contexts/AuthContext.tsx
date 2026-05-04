import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AUTH_SESSION_EVENT, getAuthSession, type AuthSession, type AuthUser } from '../services/authApi';

type AuthContextValue = {
  currentUser: AuthUser | null;
  session: AuthSession | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeAuthUser(user: AuthUser | null | undefined): AuthUser | null {
  if (!user) {
    return null;
  }

  const handle = user.handle?.trim() || '';
  const name = user.name?.trim() || handle || 'User';

  return {
    ...user,
    name,
    handle,
    avatarUrl: user.avatarUrl?.trim() || (handle ? `https://i.pravatar.cc/150?u=${encodeURIComponent(handle)}` : ''),
  };
}

function readAuthSession(): AuthSession | null {
  return getAuthSession();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readAuthSession());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => normalizeAuthUser(readAuthSession()?.user));

  useEffect(() => {
    const syncAuthSession = () => {
      const nextSession = readAuthSession();
      setSession(nextSession);
      setCurrentUser(normalizeAuthUser(nextSession?.user));
    };

    window.addEventListener(AUTH_SESSION_EVENT, syncAuthSession);
    window.addEventListener('storage', syncAuthSession);

    syncAuthSession();

    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, syncAuthSession);
      window.removeEventListener('storage', syncAuthSession);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, session }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}