// src/components/layout/Layout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user } = useAuth();

  // You can fetch real notif count here later
  // For now read from a stored value or default to 0
  const notifCount = 3;

  return (
    <div style={{
      minHeight:"100vh",
      fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",
      background:"#F0F4F8",
    }}>
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <Navbar notifCount={notifCount} />
      <main style={{ paddingTop:60, minHeight:"100vh" }}>
        <Outlet />
      </main>
    </div>
  );
}