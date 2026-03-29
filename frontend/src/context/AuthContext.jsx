import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AuthContext = createContext({ user: null, login: () => {}, logout: () => {}, updateLeagueName: () => {} });

function getTokenExp(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const exp = getTokenExp(token);
  return exp === null || exp < Date.now();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const timerRef = useRef(null);

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function scheduleRefresh(accessToken) {
    clearTimer();
    const exp = getTokenExp(accessToken);
    if (!exp) return;
    const delay = exp - Date.now() - 60_000;
    if (delay <= 0) return;
    timerRef.current = setTimeout(async () => {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) return;
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });
        if (res.ok) {
          const { token: newToken, refreshToken: newRefreshToken } = await res.json();
          localStorage.setItem('token', newToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          setUser(prev => prev ? { ...prev, token: newToken } : null);
          scheduleRefresh(newToken);
        } else {
          clearLocalStorage();
          setUser(null);
        }
      } catch {}
    }, delay);
  }

  function clearLocalStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('leagueName');
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const username = localStorage.getItem('username');
    const leagueName = localStorage.getItem('leagueName');

    if (!username) return;

    if (token && !isTokenExpired(token)) {
      setUser({ token, username, leagueName: leagueName || '' });
      scheduleRefresh(token);
    } else if (refreshToken) {
      fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            setUser({ token: data.token, username, leagueName: leagueName || '' });
            scheduleRefresh(data.token);
          } else {
            clearLocalStorage();
          }
        })
        .catch(() => clearLocalStorage());
    } else {
      clearLocalStorage();
    }

    return clearTimer;
  }, []);

  const login = (token, refreshToken, username, leagueName) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('username', username);
    localStorage.setItem('leagueName', leagueName || '');
    setUser({ token, username, leagueName: leagueName || '' });
    scheduleRefresh(token);
  };

  const logout = async () => {
    clearTimer();
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {}
    clearLocalStorage();
    setUser(null);
  };

  const updateLeagueName = (leagueName) => {
    localStorage.setItem('leagueName', leagueName);
    setUser(prev => ({ ...prev, leagueName }));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateLeagueName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
