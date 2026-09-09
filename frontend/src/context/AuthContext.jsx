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

  const [savedAccounts, setSavedAccounts] = useState(() => {
    try {
      const item = window.localStorage.getItem('saved_accounts');
      return item ? JSON.parse(item) : [];
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    try {
      if (currentUser) {
        window.localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Cập nhật danh sách các tài khoản đã lưu
        setSavedAccounts(prev => {
          const currentToken = window.localStorage.getItem('token') || '';
          const newEntry = {
            user_id: currentUser.user_id,
            username: currentUser.username,
            full_name: currentUser.full_name || currentUser.username,
            profile_photo_url: currentUser.profile_photo_url || currentUser.avatar || null,
            token: currentToken
          };
          const filtered = prev.filter(acc => Number(acc.user_id) !== Number(currentUser.user_id));
          const updated = [...filtered, newEntry];
          window.localStorage.setItem('saved_accounts', JSON.stringify(updated));
          return updated;
        });
      } else {
        window.localStorage.removeItem('currentUser');
      }
    } catch (error) {
      console.error("Lỗi khi lưu 'currentUser' vào localStorage", error);
    }
  }, [currentUser]);

  const login = (userData, token) => {
    if (token) {
      window.localStorage.setItem('token', token);
    }
    setCurrentUser(userData);
  };

  const logout = () => {
    setCurrentUser(null);
    window.localStorage.removeItem('currentUser');
    window.localStorage.removeItem('token');
  };

  const switchAccount = (userId) => {
    try {
      const raw = window.localStorage.getItem('saved_accounts');
      const accounts = raw ? JSON.parse(raw) : savedAccounts;
      const target = accounts.find(a => Number(a.user_id) === Number(userId));
      if (target) {
        window.localStorage.setItem('currentUser', JSON.stringify(target));
        if (target.token) {
          window.localStorage.setItem('token', target.token);
        }
        setCurrentUser(target);
        return true;
      }
    } catch (err) {
      console.error('Lỗi khi chuyển đổi tài khoản:', err);
    }
    return false;
  };

  const removeSavedAccount = (userId) => {
    try {
      const filtered = savedAccounts.filter(a => Number(a.user_id) !== Number(userId));
      setSavedAccounts(filtered);
      window.localStorage.setItem('saved_accounts', JSON.stringify(filtered));
      if (currentUser && Number(currentUser.user_id) === Number(userId)) {
        if (filtered.length > 0) {
          switchAccount(filtered[0].user_id);
        } else {
          logout();
        }
      }
    } catch (err) {
      console.error('Lỗi khi xóa tài khoản đã lưu:', err);
    }
  };

  const addAccountSession = () => {
    window.localStorage.removeItem('currentUser');
    window.localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const updateUser = (updatedData) => {
    setCurrentUser(prevUser => ({ ...prevUser, ...updatedData }));
  };

  const value = {
    currentUser,
    login,
    logout,
    updateUser,
    setCurrentUser,
    savedAccounts,
    switchAccount,
    removeSavedAccount,
    addAccountSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong một AuthProvider');
  }
  return context;
};