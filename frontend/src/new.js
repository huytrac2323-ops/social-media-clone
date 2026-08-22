// frontend/src/AuthContext.jsx
import React, {createContext, useState, useContext} from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
    const [currentUser, setCurrentUser] = useState(null);
    // Thêm các hàm login, logout ở đây

    return (
        <AuthContext.Provider value={{currentUser, setCurrentUser}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
    