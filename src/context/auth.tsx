import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking stored session (replace with real token check)
    const timer = setTimeout(() => setIsLoading(false), 0);
    return () => clearTimeout(timer);
  }, []);

  async function signIn(email: string, _password: string) {
    await new Promise(resolve => setTimeout(resolve, 600));
    setUser({ id: '1', name: email.split('@')[0], email });
  }

  async function signUp(name: string, email: string, _password: string) {
    await new Promise(resolve => setTimeout(resolve, 600));
    setUser({ id: '1', name, email });
  }

  function signOut() {
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
