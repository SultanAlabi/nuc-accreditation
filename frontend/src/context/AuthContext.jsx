// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const AuthContext = createContext(null);

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("nuc_token");
  const res = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) {
    const message =
      data.error ||
      data.non_field_errors?.[0] ||
      data.detail ||
      data.email?.[0] ||
      data.password?.[0] ||
      "Something went wrong. Please try again.";
    throw Object.assign(new Error(message), { status: res.status, data });
  }
  return data;
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem("nuc_token") || null);
  const [loading, setLoading] = useState(true);

  // Re-hydrate on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("nuc_token");
    const savedUser  = localStorage.getItem("nuc_user");
    if (!savedToken) { setLoading(false); return; }
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch {}
    }
    apiFetch("/auth/me/")
      .then(freshUser => {
        setUser(freshUser);
        localStorage.setItem("nuc_user", JSON.stringify(freshUser));
      })
      .catch(() => {
        localStorage.removeItem("nuc_token");
        localStorage.removeItem("nuc_user");
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await apiFetch("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("nuc_token", data.token);
    localStorage.setItem("nuc_user",  JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const data = await apiFetch("/auth/register/", {
      method: "POST",
      body: JSON.stringify(formData),
    });
    localStorage.setItem("nuc_token", data.token);
    localStorage.setItem("nuc_user",  JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    apiFetch("/auth/logout/", { method: "POST" }).catch(() => {});
    localStorage.removeItem("nuc_token");
    localStorage.removeItem("nuc_user");
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => {
    const merged = { ...user, ...updated };
    localStorage.setItem("nuc_user", JSON.stringify(merged));
    setUser(merged);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
