// src/components/layout/Navbar.jsx
import React from "react";
// 1. นำเข้า useAuth (ถอย 2 ก้าวไปที่ pages/auth)
import { useAuth } from "../../pages/auth/useAuth";

function Navbar() {
  // 2. ดึงข้อมูล user และ role ออกมาจากระบบ
  const { user, role } = useAuth();

  return (
    <nav className="navbar">
      {/* 3. ปรับชื่อห้องเรียนให้เปลี่ยนตาม Role (ครู/นักเรียน) */}
      <div className="nav-title">
        ห้องเรียนกิจกรรม ({role === "teacher" ? "Teacher Mode" : "Student Mode"}
        )
      </div>

      <div className="nav-profile">
        {/* เปลี่ยนไอคอนตาม Role นิดหน่อยครับ */}
        <span style={{ fontSize: "20px" }}>
          {role === "teacher" ? "👨‍🏫" : "👨‍🎓"}
        </span>

        {/* 4. ตรงนี้แหละครับที่จะแสดงชื่อจริงจาก Google Account! */}
        <span style={{ fontWeight: "500" }}>
          {user ? user.displayName : "กำลังโหลด..."}
        </span>
      </div>
    </nav>
  );
}

export default Navbar;
