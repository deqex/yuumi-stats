import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({ user: null, login: () => {}, logout: () => {}, updateLeagueName: () => {} });

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const leagueName = localStorage.getItem('leagueName');
    if (token && username && !isTokenExpired(token)) {
      setUser({ token, username, leagueName: leagueName || '' });
    } else if (token) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('leagueName');
    }
  }, []);

  const login = (token, username, leagueName) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('leagueName', leagueName || '');
    setUser({ token, username, leagueName: leagueName || '' });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('leagueName');
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
