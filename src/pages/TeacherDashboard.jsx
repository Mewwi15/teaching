import React, { useEffect, useState } from "react";
import {
  getAllStudentScores,
  getAllStudents,
  startGameRemote,
  stopGameRemote,
} from "../services/db";
import "./TeacherDashboard.css";

function TeacherDashboard() {
  const [activities, setActivities] = useState([]);
  const [students, setStudents] = useState([]);
  const [showStudents, setShowStudents] = useState(true);
  const [showGame1, setShowGame1] = useState(true);
  const [showGame2, setShowGame2] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [scoresData, studentsData] = await Promise.all([
        getAllStudentScores(),
        getAllStudents(),
      ]);
      setActivities(scoresData);
      setStudents(studentsData);
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms) => {
    if (!ms) return "-";
    const s = Math.floor((ms / 1000) % 60);
    const ms2 = Math.floor((ms % 1000) / 10);
    return `${s.toString().padStart(2, "0")}:${ms2.toString().padStart(2, "0")} วิ`;
  };

  const game1Scores = activities
    .filter((a) => a.gameType === "Carry Equation" || a.gameType === "SOP")
    .sort((a, b) => (a.timeMs || Infinity) - (b.timeMs || Infinity));

  const game2Scores = activities
    .filter((a) => a.gameType === "Jigsaw" || a.gameType === "Jigsaw Assembly")
    .sort((a, b) => (a.timeMs || Infinity) - (b.timeMs || Infinity));

  const handleStartGame = async (gameId, gameName) => {
    if (window.confirm(`ยืนยันการเริ่ม ${gameName} พร้อมกันทั้งห้อง?`)) {
      const success = await startGameRemote(gameId);
      if (success) alert(`🚀 สั่งเริ่ม ${gameName} เรียบร้อย!`);
    }
  };

  // ✅ ฟังก์ชันหยุดเกม (ใหม่)
  const handleStopGame = async (gameId, gameName) => {
    if (window.confirm(`ยืนยันการหยุด ${gameName}?`)) {
      const success = await stopGameRemote(gameId);
      if (success) alert(`⏹ หยุด ${gameName} เรียบร้อย!`);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>👨‍🏫 แผงควบคุมสำหรับคุณครู</h1>
      </div>

      {/* รายชื่อนักศึกษา */}
      <div className="collapsible-section">
        <button
          className={`modern-toggle ${showStudents ? "active" : ""}`}
          onClick={() => setShowStudents(!showStudents)}
        >
          <span className="toggle-label">👥 รายชื่อนักศึกษาทั้งหมดในระบบ</span>
          <span className="toggle-icon">{showStudents ? "✕" : "＋"}</span>
        </button>

        {showStudents && (
          <div className="score-card fade-in">
            <div className="card-inner-header">
              <h2>รายชื่อนักศึกษา ({students.length} คน)</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>ชื่อนักศึกษา</th>
                  <th>อีเมล</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td className="student-name-cell">{student.displayName}</td>
                    <td className="email-cell">{student.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="divider-line" />

      <div className="leaderboard-grid-vertical">
        {/* กิจกรรมที่ 1 */}
        <div className="collapsible-section">
          <button
            className={`modern-toggle game1-accent ${showGame1 ? "active" : ""}`}
            onClick={() => setShowGame1(!showGame1)}
          >
            <span className="toggle-label">
              🏆 อันดับความเร็ว: กิจกรรมที่ 1
            </span>
            <span className="toggle-icon">{showGame1 ? "✕" : "＋"}</span>
          </button>

          {showGame1 && (
            <div className="score-card fade-in">
              <div className="card-action-header">
                <h2>กิจกรรมที่ 1: ตารางความจริง (SOP)</h2>
                {/* ✅ ปุ่มเริ่ม + หยุด คู่กัน */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() =>
                      handleStartGame("Carry Equation", "กิจกรรมที่ 1")
                    }
                    className="btn-action-start"
                  >
                    ▶ เริ่มกิจกรรม
                  </button>
                  <button
                    onClick={() =>
                      handleStopGame("Carry Equation", "กิจกรรมที่ 1")
                    }
                    className="btn-action-stop"
                  >
                    ⏹ หยุดกิจกรรม
                  </button>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>อันดับ</th>
                    <th>ชื่อนักศึกษา</th>
                    <th>สถานะ</th>
                    <th>เวลา</th>
                  </tr>
                </thead>
                <tbody>
                  {game1Scores.map((s, index) => (
                    <tr key={s.id} className={index === 0 ? "top-rank" : ""}>
                      <td className="rank-number">{index + 1}</td>
                      <td className="student-name-cell">{s.studentName}</td>
                      <td>
                        <span
                          className={`status-tag ${s.status === "ผ่าน" ? "success" : "pending"}`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="time-value">{formatTime(s.timeMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* กิจกรรมที่ 2 */}
        <div className="collapsible-section" style={{ marginTop: "20px" }}>
          <button
            className={`modern-toggle game2-accent ${showGame2 ? "active" : ""}`}
            onClick={() => setShowGame2(!showGame2)}
          >
            <span className="toggle-label">
              🏆 อันดับความเร็ว: กิจกรรมที่ 2
            </span>
            <span className="toggle-icon">{showGame2 ? "✕" : "＋"}</span>
          </button>

          {showGame2 && (
            <div className="score-card fade-in">
              <div className="card-action-header">
                <h2>กิจกรรมที่ 2: ประกอบวงจร (Jigsaw)</h2>
                {/* ✅ ปุ่มเริ่ม + หยุด คู่กัน */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => handleStartGame("Jigsaw", "กิจกรรมที่ 2")}
                    className="btn-action-start green"
                  >
                    ▶ เริ่มกิจกรรม
                  </button>
                  <button
                    onClick={() => handleStopGame("Jigsaw", "กิจกรรมที่ 2")}
                    className="btn-action-stop"
                  >
                    ⏹ หยุดกิจกรรม
                  </button>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>อันดับ</th>
                    <th>ชื่อนักศึกษา</th>
                    <th>สถานะ</th>
                    <th>เวลา</th>
                  </tr>
                </thead>
                <tbody>
                  {game2Scores.map((s, index) => (
                    <tr key={s.id} className={index === 0 ? "top-rank" : ""}>
                      <td className="rank-number">{index + 1}</td>
                      <td className="student-name-cell">{s.studentName}</td>
                      <td>
                        <span
                          className={`status-tag ${s.status === "ผ่าน" ? "success" : "pending"}`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="time-value">{formatTime(s.timeMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
