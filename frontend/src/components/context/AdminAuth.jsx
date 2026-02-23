import { createContext, useState } from "react";

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const stored = localStorage.getItem("adminInfo");
  const [user, setUser] = useState(stored ? JSON.parse(stored) : null);

  const login = (admin) => {
    setUser(admin);
  };

  const logout = () => {
    localStorage.removeItem("adminInfo");
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};