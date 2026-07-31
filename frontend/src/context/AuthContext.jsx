import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [partner, setPartner] = useState(null); // stores delivery partner profile/token

  const login = (phoneData) => {
    setPartner({ phone: phoneData, name: 'Partner #402' });
  };

  const logout = () => {
    setPartner(null);
  };

  return (
    <AuthContext.Provider value={{ partner, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
