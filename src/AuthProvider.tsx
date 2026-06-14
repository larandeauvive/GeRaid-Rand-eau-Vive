import { createContext, useContext, useEffect, useState } from "react";

// Fake user type to satisfy existing types
interface FakeUser {
  uid: string;
}

interface AuthContextType {
  user: FakeUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FakeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for dummy auth session
    const isLogged = localStorage.getItem('chrono_auth_session');
    if (isLogged === 'true') {
      setUser({ uid: 'authenticated' });
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const signIn = async () => {
    // Actually we don't even need a password here, App.tsx checks it before calling signIn
    localStorage.setItem('chrono_auth_session', 'true');
    setUser({ uid: 'authenticated' });
  };

  const logOut = async () => {
    localStorage.removeItem('chrono_auth_session');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
