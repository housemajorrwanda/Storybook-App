import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { getToken, removeToken, saveToken, registerUnauthorizedHandler } from '@/services/api';
import { authService, type User } from '@/services/auth.service';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    registerUnauthorizedHandler(() => setUser(null));

    async function restoreSession() {
      try {
        const token = await getToken();
        if (token) {
          const profile = await authService.getProfile();
          setUser(profile);
        }
      } catch {
        await removeToken();
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  async function signIn(email: string, password: string) {
    const { access_token, user } = await authService.login(email, password);
    await saveToken(access_token);
    setUser(user);
  }

  async function signUp(fullName: string, email: string, password: string) {
    const { access_token, user } = await authService.register({ fullName, email, password });
    await saveToken(access_token);
    setUser(user);
  }

  async function signOut() {
    await removeToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
