import React, { useState, useEffect } from "react";
// นำเข้า useAuth และฟังก์ชันฐานข้อมูล
import { useAuth } from "./auth/useAuth";
import { updateGameStatus } from "../services/db";
import "./Game2Jigsaw.css";
import { listenGameStatus } from "../services/db";

// รูปภาพสัญลักษณ์อุปกรณ์ Logic Gate มาตรฐาน
const imageUrls = {
  xor: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/XOR_ANSI.svg/200px-XOR_ANSI.svg.png",
  and: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/AND_ANSI.svg/200px-AND_ANSI.svg.png",
  inputA: "https://caseandme.com/cdn/shop/files/CMONLETTERAK.png?v=1730998188",
  inputB:
    "https://icon-icons.com/download-file?file=https%3A%2F%2Fimages.icon-icons.com%2F3302%2FPNG%2F512%2Fb_alphabet_letter_letters_icon_209013.png&id=209013&pack_or_individual=pack",
  outputS:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Unicode_0x0053.svg/1280px-Unicode_0x0053.svg.png",
  outputC: "https://cdn-icons-png.flaticon.com/512/10114/10114188.png",
};

function Game2Jigsaw() {
  const { user } = useAuth(); // ดึงข้อมูลนักเรียน

  const [gameState, setGameState] = useState("join");
  const [timeMs, setTimeMs] = useState(0);
  const [errors, setErrors] = useState(0);
  const [isError, setIsError] = useState(false);

  const piecesData = [
    { id: "inA", name: "Input A", img: imageUrls.inputA },
    { id: "inB", name: "Input B", img: imageUrls.inputB },
    { id: "xor", name: "XOR Gate", img: imageUrls.xor },
    { id: "and", name: "AND Gate", img: imageUrls.and },
    { id: "outS", name: "Output S", img: imageUrls.outputS },
    { id: "outC", name: "Output C", img: imageUrls.outputC },
  ];

  const [slots, setSlots] = useState({
    inA: {
      top: "15.5%",
      left: "4%",
      width: "10%",
      height: "10%",
      filled: false,
      label: "A",
    },
    inB: {
      top: "27.5%",
      left: "4%",
      width: "10%",
      height: "10%",
      filled: false,
      label: "B",
    },
    xor: {
      top: "13%",
      left: "45%",
      width: "20%",
      height: "26%",
      filled: false,
      label: "XOR",
    },
    and: {
      top: "57%",
      left: "45%",
      width: "20%",
      height: "26%",
      filled: false,
      label: "AND",
    },
    outS: {
      top: "21%",
      left: "86%",
      width: "10%",
      height: "10%",
      filled: false,
      label: "S",
    },
    outC: {
      top: "65%",
      left: "86%",
      width: "10%",
      height: "10%",
      filled: false,
      label: "C",
    },
  });

  const [bin, setBin] = useState([]);

  // ==========================================
  // ฟังก์ชันควบคุมสถานะห้องเรียน
  // ==========================================
  const handleJoinGame = async () => {
    await updateGameStatus(
      user.uid,
      user.displayName,
      "Jigsaw",
      "เข้าห้องแล้ว",
    );
    setGameState("ready");
  };

  const [selectedPieceId, setSelectedPieceId] = useState(null);

  const onDropManual = (draggedId, slotId) => {
    if (draggedId === slotId) {
      // ✅ วางถูกช่อง
      setSlots((prev) => ({
        ...prev,
        [slotId]: { ...prev[slotId], filled: true },
      }));
      setBin((prev) => prev.filter((p) => p.id !== draggedId));

      // เช็คว่าประกอบครบหรือยัง
      const updated = {
        ...slots,
        [slotId]: { ...slots[slotId], filled: true },
      };
      if (Object.values(updated).every((s) => s.filled)) {
        handleCompleteGame();
      }
    } else {
      // ❌ วางผิดช่อง
      setIsError(true);
      setErrors((prev) => prev + 1);
      setTimeMs((p) => p + 2000);
      setTimeout(() => setIsError(false), 400);
    }
  };

  // 3. ฟังก์ชันเมื่อกดเลือกชิ้นส่วน (สำหรับมือถือ)
  const handlePieceClick = (id) => {
    setSelectedPieceId(id);
  };

  // 4. ฟังก์ชันเมื่อกดที่ช่องวาง (สำหรับมือถือ)
  const handleSlotClick = (slotId) => {
    if (selectedPieceId) {
      onDropManual(selectedPieceId, slotId);
      setSelectedPieceId(null); // วางเสร็จแล้วล้างค่าที่เลือกไว้
    }
  };

  const handleReady = async () => {
    await updateGameStatus(user.uid, user.displayName, "Jigsaw", "พร้อม!");
    setGameState("waiting_teacher");
  };

  const handleCompleteGame = async () => {
    // ✅ แก้ไข: ส่งทั้งสถานะ และ timeMs เพื่อจัดลำดับความเร็ว
    await updateGameStatus(
      user.uid,
      user.displayName,
      "Jigsaw",
      "ผ่าน",
      timeMs,
    );
    setGameState("completed");
  };

  const handleStartPlaying = () => {
    setBin([...piecesData].sort(() => Math.random() - 0.5));
    setGameState("playing");
  };

  // ดักฟังสถานะเริ่มเกมจากคุณครู
  useEffect(() => {
    let unsubscribe;
    if (gameState === "waiting_teacher") {
      unsubscribe = listenGameStatus("Jigsaw", (data) => {
        if (data.isStarted === true) {
          handleStartPlaying();
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
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

  const onDragStart = (e, id) => {
    e.dataTransfer.setData("pieceId", id);
  };

  const onDrop = (e, slotId) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("pieceId");

    if (draggedId === slotId) {
      setSlots((prev) => ({
        ...prev,
        [slotId]: { ...prev[slotId], filled: true },
      }));
      setBin((prev) => prev.filter((p) => p.id !== draggedId));

      const updated = {
        ...slots,
        [slotId]: { ...slots[slotId], filled: true },
      };
      if (Object.values(updated).every((s) => s.filled)) {
        handleCompleteGame();
      }
    } else {
      setIsError(true);
      setErrors((prev) => prev + 1);
      setTimeMs((p) => p + 2000);
      setTimeout(() => setIsError(false), 400);
    }
  };

  return (
    <div className={`jigsaw-container ${isError ? "shake" : ""}`}>
      {/* HUD ส่วนหัว */}
      <div className="hud-header">
        <div>
          <div
            style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}
          >
            ภารกิจ: วาดวงจร HALF ADDER
          </div>
          <div style={{ fontWeight: "bold", color: "#10b981" }}>
            สถานะระบบ: {gameState === "join" && "รอเข้าห้อง"}
            {gameState === "ready" && "อ่านคำแนะนำ"}
            {gameState === "waiting_teacher" && "รอสัญญาณจากครู"}
            {gameState === "playing" && "กำลังปฏิบัติการ"}
            {gameState === "completed" && "ประกอบวงจรสำเร็จ"}
          </div>
        </div>
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

      {/* หน้าจอ 1: ก่อนเข้าเกม */}
      {gameState === "join" && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <h2 style={{ fontSize: "32px", marginBottom: "20px" }}>
            กิจกรรมที่ 2: ประกอบวงจร (Jigsaw)
          </h2>
          <p style={{ color: "#64748b", marginBottom: "40px" }}>
            กรุณากดปุ่มเพื่อเข้าสู่ห้องปฏิบัติการ
          </p>
          <button
            style={{
              padding: "15px 40px",
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "18px",
              fontWeight: "bold",
              boxShadow: "0 4px 6px rgba(16, 185, 129, 0.2)",
            }}
            onClick={handleJoinGame}
          >
            🚪 เข้าสู่ห้องกิจกรรม
          </button>
        </div>
      )}

      {/* หน้าจอ 2: คำแนะนำ */}
      {gameState === "ready" && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <h2 style={{ fontSize: "28px", marginBottom: "20px" }}>
            คำแนะนำก่อนเริ่มประกอบวงจร
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
                <strong>วิเคราะห์ผังวงจร:</strong> สังเกตเส้นทางเดินของสายไฟ
                (Blueprint)
              </li>
              <li>
                <strong>ติดตั้งอุปกรณ์:</strong>{" "}
                ลากชิ้นส่วนจากคลังอะไหล่ไปวางในช่องที่ถูกต้อง
              </li>
              <li>
                <strong>บทลงโทษ:</strong> หากวางผิดช่อง เวลาจะถูกบวกเพิ่ม 2
                วินาทีทันที
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

      {/* หน้าจอ 3: รอครู */}
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

      {/* หน้าจอ 4: เล่นเกม */}
      {(gameState === "playing" || gameState === "completed") && (
        <div className="fade-in">
          <div className="game-layout">
            <div className="piece-bin">
              <div className="bin-title">คลังอะไหล่</div>
              {bin.map((p) => (
                <div
                  className={`draggable-piece ${selectedPieceId === p.id ? "selected" : ""}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, p.id)}
                  onClick={() => handlePieceClick(p.id)} // ✅ รองรับการจิ้ม
                >
                  <img src={p.img} alt="" />
                  <span className="label-text">{p.name}</span>
                </div>
              ))}
              {bin.length === 0 && (
                <div className="bin-empty">ติดตั้งครบแล้ว</div>
              )}
            </div>

            <div className="blueprint-board">
              <svg
                className="circuit-lines-svg"
                viewBox="0 0 1000 500"
                preserveAspectRatio="none"
              >
                <g
                  fill="none"
                  stroke="#000000"
                  strokeWidth="4"
                  strokeLinecap="square"
                >
                  <path d="M 140 103 L 450 103" />
                  <circle cx="300" cy="103" r="6" fill="#000" />
                  <path d="M 300 103 L 300 323 L 450 323" />
                  <path d="M 140 163 L 450 163" />
                  <circle cx="240" cy="163" r="6" fill="#000" />
                  <path d="M 240 163 L 240 383 L 450 383" />
                  <path d="M 650 133 L 860 133" />
                  <path d="M 650 353 L 860 353" />
                </g>
              </svg>

              {Object.entries(slots).map(([id, s]) => (
                <div
                  key={id}
                  className={`drop-slot ${s.filled ? "filled" : ""}`}
                  style={{
                    top: s.top,
                    left: s.left,
                    width: s.width,
                    height: s.height,
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, id)}
                  onClick={() => handleSlotClick(id)}
                >
                  {s.filled ? (
                    <img
                      src={piecesData.find((p) => p.id === id).img}
                      alt=""
                      className="placed-img"
                    />
                  ) : (
                    <span className="slot-hint">{s.label}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* สรุปผล */}
      {gameState === "completed" && (
        <div className="success-panel-final fade-in">
          <div className="medal-icon">🏆</div>
          <h2>ต่อวงจรสำเร็จ! ระบบทำงานสมบูรณ์</h2>
          <div className="time-result" style={{ marginBottom: "10px" }}>
            เวลาที่ทำได้: {formatTime(timeMs)} วินาที
          </div>
          <div
            style={{
              color: "#ef4444",
              marginBottom: "20px",
              fontWeight: "bold",
            }}
          >
            พลาดไปทั้งหมด: {errors} ครั้ง
          </div>
          <div
            className="status-done"
            style={{
              marginBottom: "20px",
              color: "#10b981",
              fontWeight: "bold",
            }}
          >
            ✨ ส่งข้อมูลการทำภารกิจให้คุณครูเรียบร้อยแล้ว ✨
          </div>
        </div>
      )}
    </div>
  );
}

export default Game2Jigsaw;
