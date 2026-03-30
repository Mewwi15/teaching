import React, { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

function LoginPage() {
  const { loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false); // เพิ่ม State สำหรับปุ่มโหลด

  // ตัวนี้จะคอยเฝ้าดูว่า ถ้ามีข้อมูล user เข้ามาปุ๊บ ให้เด้งไปหน้าเกมทันที!
  useEffect(() => {
    if (user) {
      navigate("/game1");
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true); // เปลี่ยนปุ่มเป็นสถานะกำลังโหลด
      await loginWithGoogle();
      // ❌ เราเอา navigate('/game1') ตรงนี้ออกไป เพื่อป้องกันการวิ่งแข่งกันของโค้ด
      // ปล่อยให้ useEffect ด้านบนเป็นคนจัดการเปลี่ยนหน้าแทนครับ
    } catch (error) {
      console.error("Login Failed:", error);
      setIsLoggingIn(false); // ถ้าระบบพัง ให้ปุ่มกลับมาคลิกได้ใหม่
      alert("เกิดข้อผิดพลาดในการล็อกอิน กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="icon">⚡</div>
        <h1>Half Adder Lab</h1>
        <p>Department of Computer Education, KMUTNB</p>

        <button
          className="google-btn"
          onClick={handleLogin}
          disabled={isLoggingIn} // ป้องกันการกดเบิ้ล
          style={{
            opacity: isLoggingIn ? 0.7 : 1,
            cursor: isLoggingIn ? "not-allowed" : "pointer",
          }}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
            alt="Google"
            style={{ width: "20px", height: "20px" }}
          />
          {isLoggingIn
            ? "กำลังเข้าสู่ระบบ..."
            : "เข้าสู่ระบบด้วย Google Account"}
        </button>

        <div className="footer-text">เฉพาะนักศึกษาและบุคลากรภายในเท่านั้น</div>
      </div>
    </div>
  );
}

export default LoginPage;
