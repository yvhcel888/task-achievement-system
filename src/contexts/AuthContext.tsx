import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

const TOKEN_KEY = 'bp_token';
const USER_KEY = 'bp_user';

interface AuthContextValue {
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  login: (userId: string, password: string) => Promise<string>;
  register: (userId: string, password: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStored(): { token: string | null; userId: string | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userId = localStorage.getItem(USER_KEY);
    return { token, userId };
  } catch {
    return { token: null, userId: null };
  }
}

async function callAuth(
  path: string,
  userId: string,
  password: string,
): Promise<{ ok: boolean; token?: string; userId?: string; message?: string }> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, password }),
  });
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => loadStored().token);
  const [userId, setUserId] = useState<string | null>(() => loadStored().userId);

  useEffect(() => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
      if (userId) localStorage.setItem(USER_KEY, userId);
      else localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  }, [token, userId]);

  const login = useCallback(async (name: string, password: string): Promise<string> => {
    const res = await callAuth('/api/auth/login', name, password);
    if (!res.ok || !res.token) {
      throw new Error(res.message || '登录失败');
    }
    setToken(res.token);
    setUserId(res.userId ?? name);
    return res.userId ?? name;
  }, []);

  const register = useCallback(async (name: string, password: string): Promise<string> => {
    const res = await callAuth('/api/auth/register', name, password);
    if (!res.ok || !res.token) {
      throw new Error(res.message || '注册失败');
    }
    setToken(res.token);
    setUserId(res.userId ?? name);
    return res.userId ?? name;
  }, []);

  const logout = useCallback(() => {
    const t = token;
    setToken(null);
    setUserId(null);
    if (t) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      }).catch(() => {});
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ token, userId, isAuthenticated: !!token, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
