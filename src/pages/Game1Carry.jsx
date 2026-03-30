import React, { useState, useEffect } from "react";
// นำเข้า useAuth และฟังก์ชันอัปเดตสถานะจากฐานข้อมูล
import { useAuth } from "./auth/useAuth";
import { updateGameStatus } from "../services/db";
import "./Game1Carry.css";
import { listenGameStatus } from "../services/db"; // import เพิ่ม

function Game1Carry() {
  const { user } = useAuth(); // ดึงข้อมูลนักเรียนที่ล็อกอินอยู่

  // สถานะเกม: 'join' -> 'ready' -> 'waiting_teacher' -> 'playing' -> 'completed'
  const [gameState, setGameState] = useState("join");
  const [timeMs, setTimeMs] = useState(0);
  const [phase, setPhase] = useState(1);
  const [errors, setErrors] = useState(0);

  const [selectedRow, setSelectedRow] = useState(null);
  const [signalA, setSignalA] = useState(null);
  const [signalB, setSignalB] = useState(null);

  const truthTable = [
    { a: 0, b: 0, c: 0 },
    { a: 0, b: 1, c: 0 },
    { a: 1, b: 0, c: 0 },
    { a: 1, b: 1, c: 1 },
  ];

  // 1. ฟังก์ชันเมื่อกด "เข้าห้องเกม"
  const handleJoinGame = async () => {
    // ส่งสถานะไปบอกครูว่า "เข้าห้องแล้ว"
    await updateGameStatus(
      user.uid,
      user.displayName,
      "Carry Equation",
      "เข้าห้องแล้ว",
    );
    setGameState("ready");
  };

  // 2. ฟังก์ชันเมื่อกด "เตรียมพร้อม"
  const handleReady = async () => {
    // ส่งสถานะไปบอกครูว่า "พร้อม!"
    await updateGameStatus(
      user.uid,
      user.displayName,
      "Carry Equation",
      "พร้อม!",
    );
    setGameState("waiting_teacher");
  };

  // 3. ฟังก์ชันเมื่อจบเกม
  const handleCompleteGame = async () => {
    // ส่งสถานะไปบอกครูว่า "ผ่าน"
    await updateGameStatus(
      user.uid,
      user.displayName,
      "Carry Equation",
      "ผ่าน",
      timeMs,
    );
    setGameState("completed");
  };

  useEffect(() => {
    let unsubscribe;

    if (gameState === "waiting_teacher") {
      // 👂 นักเรียนเงี่ยหูรอฟังคำสั่งจากครูในชื่อเกม "Carry Equation"
      unsubscribe = listenGameStatus("Carry Equation", (data) => {
        if (data.isStarted) {
          setGameState("playing"); // พอครูกดปุ่มปุ๊บ นักเรียนจะเข้าหน้าเล่นทันที!
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe(); // เลิกฟังเมื่อเปลี่ยนหน้า
    };
  }, [gameState]);

  // ระบบตัวจับเวลา
  useEffect(() => {
    let interval;
    if (gameState === "playing") {
      const start = Date.now() - timeMs;
      interval = setInterval(() => setTimeMs(Date.now() - start), 10);
    }
    return () => clearInterval(interval);
  }, [gameState, timeMs]);

  const formatTime = (ms) => {
    const s = Math.floor((ms / 1000) % 60);
    const ms2 = Math.floor((ms % 1000) / 10);
    return `${s.toString().padStart(2, "0")}:${ms2.toString().padStart(2, "0")}`;
  };

  const handleRowSelect = (index, cValue) => {
    if (phase !== 1) return;
    if (cValue === 1) {
      setSelectedRow(index);
      setPhase(2);
    } else {
      setErrors((prev) => prev + 1);
      setTimeMs((prev) => prev + 2000);
    }
  };

  const handleExecute = () => {
    if (!signalA || !signalB) return;
    if (signalA === "A" && signalB === "B") {
      setPhase(3);
      handleCompleteGame(); // เรียกใช้ฟังก์ชันจบเกมเพื่อบันทึกสถานะ
    } else {
      setErrors((prev) => prev + 1);
      setTimeMs((prev) => prev + 3000);
      alert("ข้อผิดพลาด: สัญญาณไม่เสถียร (บทลงโทษ +3 วินาที)");
    }
  };

  return (
    <div className="game-container">
      {/* ==========================================
          HUD ส่วนหัวหน้าจอ (โชว์เวลาและจำนวนครั้งที่พลาด)
          ========================================== */}
      <div className="hud-header">
        <div>
          <div
            style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}
          >
            ภารกิจ: สมการตัวทด (CARRY_C)
          </div>
          <div style={{ fontWeight: "bold", color: "#2563eb" }}>
            สถานะระบบ: {gameState === "join" && "รอเข้าห้อง"}
            {gameState === "ready" && "อ่านคำแนะนำ"}
            {gameState === "waiting_teacher" && "รอสัญญาณจากครู"}
            {gameState === "playing" && "กำลังปฏิบัติการ"}
            {gameState === "completed" && "เจาะระบบสำเร็จ"}
          </div>
        </div>

        {/* แสดงเวลาและข้อผิดพลาด (แก้ ESLint แล้ว) */}
        <div style={{ textAlign: "right" }}>
          <div className="timer-display">{formatTime(timeMs)}</div>
          {errors > 0 && (
            <div
              style={{
                color: "#ef4444",
                fontSize: "14px",
                fontWeight: "bold",
                marginTop: "5px",
              }}
            >
              ❌ พลาด {errors} ครั้ง
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          หน้าจอ 1: ก่อนเข้าเกม
          ========================================== */}
      {gameState === "join" && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <h2 style={{ fontSize: "32px", marginBottom: "20px" }}>
            กิจกรรมที่ 1: ตารางความจริง (SOP)
          </h2>
          <p style={{ color: "#64748b", marginBottom: "40px" }}>
            กรุณากดปุ่มเพื่อเข้าสู่ห้องปฏิบัติการ
          </p>
          <button
            style={{
              padding: "15px 40px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "18px",
              fontWeight: "bold",
              boxShadow: "0 4px 6px rgba(37, 99, 235, 0.2)",
            }}
            onClick={handleJoinGame}
          >
            🚪 เข้าสู่ห้องกิจกรรม
          </button>
        </div>
      )}

      {/* ==========================================
          หน้าจอ 2: อ่านกติกาและเตรียมพร้อม
          ========================================== */}
      {gameState === "ready" && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <h2 style={{ fontSize: "28px", marginBottom: "20px" }}>
            คำแนะนำก่อนเริ่มเกม
          </h2>
          <div
            style={{
              background: "#f8fafc",
              padding: "30px",
              borderRadius: "12px",
              border: "1px dashed #cbd5e1",
              marginBottom: "30px",
              textAlign: "left",
              maxWidth: "600px",
              margin: "0 auto 30px",
            }}
          >
            <ol
              style={{
                paddingLeft: "20px",
                lineHeight: "1.8",
                color: "#334155",
              }}
            >
              <li>
                <strong>หาเป้าหมาย:</strong> คลิกเลือกแถวที่ค่า Carry (C) เป็น 1
              </li>
              <li>
                <strong>สกัดสัญญาณ:</strong> เลือกตัวแปร A, B
                ให้ถูกต้องตามหลักการ
              </li>
              <li>
                <strong>ส่งข้อมูล:</strong>{" "}
                ระบบจะหยุดเวลาทันทีเมื่อส่งสมการที่ถูกต้อง
              </li>
            </ol>
          </div>
          <button
            style={{
              padding: "15px 40px",
              background: "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "18px",
              fontWeight: "bold",
              boxShadow: "0 4px 6px rgba(15, 23, 42, 0.2)",
            }}
            onClick={handleReady}
          >
            ✅ เตรียมพร้อม
          </button>
        </div>
      )}

      {/* ==========================================
          หน้าจอ 3: รอครูกดเริ่ม
          ========================================== */}
      {gameState === "waiting_teacher" && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: "50px", animation: "pulse 2s infinite" }}>
            ⏳
          </div>
          <h2 style={{ fontSize: "28px", marginTop: "20px", color: "#475569" }}>
            กำลังรอครูผู้สอนส่งสัญญาณ...
          </h2>
          <p style={{ color: "#94a3b8" }}>
            กรุณารอสักครู่ เมื่อคุณครูเปิดระบบ เกมจะเริ่มอัตโนมัติ
          </p>
        </div>
      )}

      {/* ==========================================
          หน้าจอ 4: ระหว่างเล่นและจบเกม (โค้ดเดิม)
          ========================================== */}
      {(gameState === "playing" || gameState === "completed") && (
        <div className="fade-in">
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h3
              style={{
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: "#475569",
              }}
            >
              {phase === 1 && "ขั้นตอนที่ 1: ค้นหาเงื่อนไขที่ Carry เป็น 1"}
              {phase === 2 && "ขั้นตอนที่ 2: ปรับจูนตัวแปรตามหลักการ SOP"}
              {phase === 3 && "เจาะระบบสำเร็จเรียบร้อย"}
            </h3>
          </div>

          <table className="matrix-table">
            <thead>
              <tr>
                <th>อินพุต A</th>
                <th>อินพุต B</th>
                <th>ตัวทด (C)</th>
              </tr>
            </thead>
            <tbody>
              {truthTable.map((row, i) => (
                <tr
                  key={i}
                  className={`matrix-row ${selectedRow === i ? "locked" : ""}`}
                  onClick={() => handleRowSelect(i, row.c)}
                >
                  <td>{row.a}</td>
                  <td>{row.b}</td>
                  <td>{row.c}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {phase >= 2 && (
            <div className="calibrator-panel">
              <div className="signal-card">
                <div className="signal-title">สกัดสัญญาณ A (เมื่อ A=1)</div>
                <button
                  className={`btn-signal ${signalA === "A'" ? "active" : ""}`}
                  onClick={() => phase === 2 && setSignalA("A'")}
                >
                  A' (Bar)
                </button>
                <button
                  className={`btn-signal ${signalA === "A" ? "active" : ""}`}
                  onClick={() => phase === 2 && setSignalA("A")}
                >
                  A (ปกติ)
                </button>
              </div>
              <div className="signal-card">
                <div className="signal-title">สกัดสัญญาณ B (เมื่อ B=1)</div>
                <button
                  className={`btn-signal ${signalB === "B'" ? "active" : ""}`}
                  onClick={() => phase === 2 && setSignalB("B'")}
                >
                  B' (Bar)
                </button>
                <button
                  className={`btn-signal ${signalB === "B" ? "active" : ""}`}
                  onClick={() => phase === 2 && setSignalB("B")}
                >
                  B (ปกติ)
                </button>
              </div>
            </div>
          )}

          {phase === 2 && (
            <button
              className="btn-execute"
              style={{
                width: "100%",
                marginTop: "30px",
                padding: "20px",
                background: "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "18px",
                fontWeight: "bold",
              }}
              onClick={handleExecute}
            >
              ยืนยันคำตอบ
            </button>
          )}

          {phase === 3 && (
            <div
              style={{
                textAlign: "center",
                marginTop: "40px",
                borderTop: "2px solid #f1f5f9",
                paddingTop: "30px",
              }}
              className="fade-in"
            >
              <div style={{ fontSize: "14px", color: "#64748b" }}>
                สมการที่ได้รับจากการเจาะระบบ
              </div>
              <h1
                style={{ color: "#2563eb", fontSize: "64px", margin: "10px 0" }}
              >
                C = A · B
              </h1>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "15px",
                  marginTop: "20px",
                }}
              ></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Game1Carry;
