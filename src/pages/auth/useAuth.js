// src/pages/auth/useAuth.js
import { createContext, useContext } from "react";

export const AuthContext = createContext();

// Hook สำหรับดึงข้อมูล User ไปใช้ในหน้าอื่นๆ
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
