import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const item = window.localStorage.getItem('currentUser');
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("Lỗi khi đọc 'currentUser' từ localStorage", error);
      return null;
    }
  });

  useEffect(() => {
    try {
      if (currentUser) {
        window.localStorage.setItem('currentUser', JSON.stringify(currentUser));
      } else {
        window.localStorage.removeItem('currentUser');
      }
    } catch (error) {
      console.error("Lỗi khi lưu 'currentUser' vào localStorage", error);
    }
  }, [currentUser]);

  const login = (userData) => {
    setCurrentUser(userData);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateUser = (updatedData) => {
    setCurrentUser(prevUser => ({ ...prevUser, ...updatedData }));
  };

  const value = { currentUser, login, logout, updateUser, setCurrentUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong một AuthProvider');
  }
  return context;
};