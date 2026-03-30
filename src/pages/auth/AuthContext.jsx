// src/pages/auth/AuthContext.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../../services/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
// 1. นำเข้า serverTimestamp มาเพื่อใช้เก็บเวลาจริงจากเซิร์ฟเวอร์ Firebase
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { AuthContext } from "./useAuth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  };

  const logout = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        // อ้างอิงไปที่ Collection 'users' ตาม UID ของคนที่ล็อกอิน
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          // 🟢 กรณีที่ 1: เคยเข้าสู่ระบบแล้ว (มีข้อมูลในฐานข้อมูล)
          setRole(userDoc.data().role);

          // อัปเดตแค่ "เวลาเข้าใช้งานล่าสุด" (ใช้ merge: true เพื่อไม่ให้ข้อมูลอื่นเช่น role หาย)
          await setDoc(
            userRef,
            {
              lastLogin: serverTimestamp(),
            },
            { merge: true },
          );
        } else {
          // 🔵 กรณีที่ 2: เข้าสู่ระบบครั้งแรก (ยังไม่มีข้อมูล)
          // ให้สร้างเรคคอร์ดใหม่ และเก็บข้อมูลทั้งหมดลงฐานข้อมูลทันที!
          await setDoc(userRef, {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            role: "student", // กำหนดค่าเริ่มต้นเป็นนักเรียน
            createdAt: serverTimestamp(), // เวลาสมัคร
            lastLogin: serverTimestamp(), // เวลาเข้าใช้งานล่าสุด
          });
          setRole("student");
        }

        setUser(currentUser);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = { user, role, loginWithGoogle, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
