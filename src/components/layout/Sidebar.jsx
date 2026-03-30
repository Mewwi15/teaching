import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../pages/auth/useAuth";

function Sidebar() {
  const location = useLocation();
  const { role, logout } = useAuth();

  const handleLogout = async () => {
    if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      try {
        await logout();
      } catch (error) {
        console.error("Logout Error:", error);
      }
    }
  };

  return (
    <aside
      className="sidebar"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <div className="sidebar-logo">LogicLab</div>
      <ul className="sidebar-menu" style={{ flexGrow: 1 }}>
        <Link to="/game1" style={{ textDecoration: "none" }}>
          <li className={location.pathname === "/game1" ? "active" : ""}>
            กิจกรรมที่ 1: วิเคราะห์ SOP
          </li>
        </Link>
        <Link to="/game2" style={{ textDecoration: "none" }}>
          <li className={location.pathname === "/game2" ? "active" : ""}>
            กิจกรรมที่ 2: ประกอบวงจร
          </li>
        </Link>
        {role === "teacher" && (
          <Link to="/teacher" style={{ textDecoration: "none" }}>
            <li className={location.pathname === "/teacher" ? "active" : ""}>
              👨‍🏫 แผงควบคุม (ครู)
            </li>
          </Link>
        )}
      </ul>
      <div style={{ padding: "20px", borderTop: "1px solid #e2e8f0" }}>
        <button
          onClick={handleLogout}
          className="btn-logout-sidebar"
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#fee2e2",
            color: "#ef4444",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🚪 ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
export default Sidebar;
