import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({ user: null, login: () => {}, logout: () => {}, updateLeagueName: () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const leagueName = localStorage.getItem('leagueName');
    if (token && username) {
      setUser({ token, username, leagueName: leagueName || '' });
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
