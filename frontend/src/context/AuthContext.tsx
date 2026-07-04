import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthContextType {
  userId: string | null;
  setUserId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(() =>
    localStorage.getItem('x-user-id'),
  );

  const handleSetUserId = (id: string | null) => {
    if (id) {
      localStorage.setItem('x-user-id', id);
    } else {
      localStorage.removeItem('x-user-id');
    }
    setUserId(id);
  };

  return (
    <AuthContext.Provider value={{ userId, setUserId: handleSetUserId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}