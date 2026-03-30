import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./pages/auth/AuthContext";
import { useAuth } from "./pages/auth/useAuth"; // ดึง useAuth แยกมาตามที่เราแก้ไว้
import MainLayout from "./components/layout/MainLayout";
import Game1Carry from "./pages/Game1Carry";
import Game2Jigsaw from "./pages/Game2Jigsaw";
import TeacherDashboard from "./pages/TeacherDashboard";
import LoginPage from "./pages/auth/LoginPage";
import "./index.css";

// 1. ตัวเช็คสิทธิ์ (ต้อง Login ถึงจะผ่านได้)
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, role, loading } = useAuth();

  if (loading)
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        กำลังโหลดข้อมูล...
      </div>
    );
  if (!user) return <Navigate to="/login" />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/" />; // ถ้าไม่ใช่ครู เด้งกลับหน้าแรก

  return children;
};

// 2. ตัวรวม Layout + ตัวเช็คสิทธิ์ (หน้าไหนใช้ Sidebar ให้ครอบด้วยตัวนี้)
const ProtectedLayout = ({ children, allowedRole }) => {
  return (
    <ProtectedRoute allowedRole={allowedRole}>
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* สังเกตว่าเราเอา <MainLayout> ที่เคยครอบตรงนี้ออกไปแล้ว */}
        <Routes>
          {/* ==========================================
              หน้า Login (แยกเดี่ยวๆ ไม่มี Sidebar)
              ========================================== */}
          <Route path="/login" element={<LoginPage />} />

          {/* ==========================================
              หน้ากิจกรรม (มี Sidebar และต้อง Login)
              ========================================== */}
          <Route path="/" element={<Navigate to="/game1" />} />

          <Route
            path="/game1"
            element={
              <ProtectedLayout>
                <Game1Carry />
              </ProtectedLayout>
            }
          />

          <Route
            path="/game2"
            element={
              <ProtectedLayout>
                <Game2Jigsaw />
              </ProtectedLayout>
            }
          />

          {/* ==========================================
              หน้า Teacher Dashboard (มี Sidebar + เฉพาะครู)
              ========================================== */}
          <Route
            path="/teacher"
            element={
              <ProtectedLayout allowedRole="teacher">
                <TeacherDashboard />
              </ProtectedLayout>
            }
          />

          {/* กรณีเข้า URL มั่วให้กลับหน้าแรก */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
