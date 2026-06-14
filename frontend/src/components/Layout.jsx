// src/components/layout/Layout.jsx
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";
import { notificationsAPI } from "../services/api";

export default function Layout() {
  const { user } = useAuth();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await notificationsAPI.list({ page_size: 1 });
        const data = res.data;
        const total = data.count ?? (data.results ? data.results.length : (Array.isArray(data) ? data.length : 0));
        if (!cancelled) setNotifCount(total);
      } catch {
        // Silently fail — navbar will show 0
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

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
