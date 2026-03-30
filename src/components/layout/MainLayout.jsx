// src/components/layout/MainLayout.jsx
import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";

function MainLayout({ children }) {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar />
        <div className="content-area">{children}</div>
        <Footer />
      </div>
    </div>
  );
}
export default MainLayout;
