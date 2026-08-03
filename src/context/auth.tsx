import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { getToken, removeToken, saveToken, registerUnauthorizedHandler } from '@/services/api';
import { authService, type User } from '@/services/auth.service';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: (googleAccessToken: string) => Promise<void>;
  /** Adopt a JWT the backend issued directly, e.g. from the Google deep link. */
  signInWithToken: (accessToken: string) => Promise<void>;
  /** Saves profile edits and refreshes the cached user. */
  updateProfile: (payload: { fullName?: string; residentPlace?: string }) => Promise<void>;
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

  async function signInWithGoogle(googleAccessToken: string) {
    const { access_token, user } = await authService.googleLogin(googleAccessToken);
    await saveToken(access_token);
    setUser(user);
  }

  async function signInWithToken(accessToken: string) {
    // The backend's OAuth callback hands back a JWT but no user payload, so the
    // profile is fetched with the token already in place.
    await saveToken(accessToken);
    try {
      const profile = await authService.getProfile();
      setUser(profile);
    } catch (error) {
      await removeToken();
      throw error;
    }
  }

  async function updateProfile(payload: { fullName?: string; residentPlace?: string }) {
    const updated = await authService.updateProfile(payload);
    setUser(updated);
  }

  async function signOut() {
    await removeToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithToken,
        updateProfile,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
