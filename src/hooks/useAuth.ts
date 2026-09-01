import { useCallback, useEffect, useState } from 'react';

interface AuthUser {
  id: number;
  username: string;
}

const TOKEN_STORAGE_KEY = 'authToken';

async function parseErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return typeof body?.error === 'string' ? body.error : fallback;
  } catch {
    return fallback;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setStatus('ready');
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('invalid session');
        const body = await res.json();
        setUser(body.user);
        setToken(storedToken);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      })
      .finally(() => setStatus('ready'));
  }, []);

  const signup = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Sign up failed'));
    }
    const body = await res.json();
    localStorage.setItem(TOKEN_STORAGE_KEY, body.token);
    setUser(body.user);
    setToken(body.token);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Log in failed'));
    }
    const body = await res.json();
    localStorage.setItem(TOKEN_STORAGE_KEY, body.token);
    setUser(body.user);
    setToken(body.token);
  }, []);

  const logout = useCallback(async () => {
    const currentToken = token;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    setToken(null);
    if (currentToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` },
      }).catch(() => {});
    }
  }, [token]);

  return { user, token, status, signup, login, logout };
}
