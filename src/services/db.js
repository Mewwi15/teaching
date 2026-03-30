// src/services/db.js
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  where,
  doc, // 👈 เพิ่ม doc
  setDoc, // 👈 เพิ่ม setDoc
  onSnapshot,
} from "firebase/firestore";

// ---------------------------------------------------
// 1. ฟังก์ชันสำหรับ "นักเรียน": บันทึกผลการเล่นเกม (แบบสร้างบรรทัดใหม่)
// ---------------------------------------------------
export const saveActivityScore = async (studentName, gameType, isPassed) => {
  try {
    const activitiesRef = collection(db, "activities");

    const newRecord = {
      studentName: studentName,
      gameType: gameType,
      status: isPassed ? "ผ่าน" : "ไม่ผ่าน",
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(activitiesRef, newRecord);
    console.log("บันทึกข้อมูลสำเร็จ ID:", docRef.id);
    return true;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล:", error);
    return false;
  }
};

// ---------------------------------------------------
// 2. ฟังก์ชันสำหรับ "ครู": ดึงข้อมูลคะแนนและสถานะเกมไปแสดงผล
// ---------------------------------------------------
export const getAllStudentScores = async () => {
  try {
    const activitiesRef = collection(db, "activities");
    // เรียงลำดับจากอัปเดตล่าสุดอยู่บนสุด
    const q = query(activitiesRef, orderBy("timestamp", "desc"));

    const querySnapshot = await getDocs(q);
    const scores = [];

    querySnapshot.forEach((doc) => {
      scores.push({ id: doc.id, ...doc.data() });
    });

    return scores;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลคะแนน:", error);
    return [];
  }
};

// ---------------------------------------------------
// 3. ฟังก์ชันสำหรับ "ครู": ดึงรายชื่อนักเรียนทั้งหมดในระบบ
// ---------------------------------------------------
export const getAllStudents = async () => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "student"));
    const querySnapshot = await getDocs(q);

    const students = [];
    querySnapshot.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() });
    });

    return students;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงรายชื่อนักเรียน:", error);
    return [];
  }
};

// ---------------------------------------------------
// 4. ฟังก์ชันสำหรับ "นักเรียน": อัปเดตสถานะเกมแบบเรียลไทม์
// (อัปเดตทับบรรทัดเดิม ไม่สร้างข้อมูลซ้ำซ้อน)
// ---------------------------------------------------

export const updateGameStatus = async (
  uid,
  studentName,
  gameType,
  statusText,
  timeMs = null,
) => {
  try {
    const gameDocId = `${uid}_${gameType}`;
    const docRef = doc(db, "activities", gameDocId);

    const data = {
      studentName: studentName,
      gameType: gameType,
      status: statusText,
      timestamp: serverTimestamp(),
    };

    // ✅ ถ้ามีเวลาส่งมา ให้เก็บลงฐานข้อมูลเพื่อเอาไปจัดลำดับ
    if (timeMs !== null) {
      data.timeMs = timeMs;
    }

    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error("อัปเดตสถานะไม่สำเร็จ:", error);
    return false;
  }
};

// 1. ฟังก์ชันสำหรับครู: กดเริ่มเกม (เขียนสถานะลง Firestore)
export const startGameRemote = async (gameType) => {
  try {
    const settingsRef = doc(db, "settings", gameType);
    await setDoc(settingsRef, {
      isStarted: true,
      startTime: Date.now(), // ส่งเวลาเริ่มไปด้วยเผื่อซิงค์เวลา
    });
    return true;
  } catch (error) {
    console.error("Start Game Error:", error);
    return false;
  }
};

// 2. ฟังก์ชันสำหรับนักเรียน: ฟังคำสั่งเริ่มเกมจากครู (Real-time)
export const listenGameStatus = (gameType, callback) => {
  const settingsRef = doc(db, "settings", gameType);
  // ใช้ onSnapshot เพื่อฟังข้อมูลแบบ Real-time (ไม่ต้องสั่ง Refresh)
  return onSnapshot(settingsRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    }
  });
};

export const stopGameRemote = async (gameType) => {
  try {
    const settingsRef = doc(db, "settings", gameType);
    await setDoc(settingsRef, {
      isStarted: false,
    });
    return true;
  } catch (error) {
    console.error("Stop Game Error:", error);
    return false;
  }
};
