// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useRole } from "./hooks/useRole";
import Layout        from "./components/Layout";
import Dashboard     from "./pages/Dashboard";
import Courses       from "./pages/Courses";
import CourseDetail  from "./pages/CourseDetail";
import NewCourse     from "./pages/NewCourse";
import Calculator    from "./pages/Calculator";
import Documents     from "./pages/Documents";
import Notification from "./pages/Notification";
import Settings      from "./pages/Settings";
import Team          from "./pages/Team";
import Login         from "./pages/Login";
import Register      from "./pages/Register";
import AccessDenied  from "./pages/AccessDenied";

// ── Loading splash ────────────────────────────────────────────────────────────
function LoadingSplash() {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"center",
      minHeight:"100vh", background:"#07162F",
      flexDirection:"column", gap:16,
      fontFamily:"'IBM Plex Mono',monospace",
    }}>
      <svg width="44" height="44" viewBox="0 0 28 28" fill="none"
        style={{ animation:"pulse 1.5s ease-in-out infinite" }}>
        <rect x="2"  y="2"  width="10" height="10" rx="2" fill="#22D3EE"/>
        <rect x="16" y="2"  width="10" height="10" rx="2" fill="rgba(34,211,238,0.4)"/>
        <rect x="2"  y="16" width="10" height="10" rx="2" fill="rgba(34,211,238,0.4)"/>
        <rect x="16" y="16" width="10" height="10" rx="2" fill="rgba(34,211,238,0.15)"/>
      </svg>
      <div style={{ color:"#475569", fontSize:11,
        letterSpacing:"0.14em", textTransform:"uppercase" }}>
        NUC Accreditation System
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}

// ── Private route — must be logged in ────────────────────────────────────────
function PrivateRoute({ children }) {
  //return children; backend is ready
  const { token, loading } = useAuth();
  if (loading) return <LoadingSplash />;
  return token ? children : <Navigate to="/login" replace />;
}

// ── Public route — bounce to dashboard if already logged in ──────────────────
function PublicRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? <Navigate to="/dashboard" replace /> : children;
}

// ── Role-protected route ──────────────────────────────────────────────────────
// allow: array of roles that CAN access this route
// If user's role isn't in the list, render <AccessDenied />
function RoleRoute({ allow, children }) {
  const { user } = useAuth();
  if (!user) return null;
  if (!allow.includes(user.role)) return <AccessDenied />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* ── Protected ── */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<RoleIndex />} />

        {/* HOD + APU only */}
        <Route path="dashboard" element={
          <RoleRoute allow={["HOD","APU_OFFICER"]}>
            <Dashboard />
          </RoleRoute>
        }/>

        {/* HOD + APU only — courses list */}
        <Route path="courses" element={
          <RoleRoute allow={["HOD","APU_OFFICER"]}>
            <Courses />
          </RoleRoute>
        }/>

        {/* HOD + APU only — new programme */}
        <Route path="courses/new" element={
          <RoleRoute allow={["HOD","APU_OFFICER"]}>
            <NewCourse />
          </RoleRoute>
        }/>

        {/* All roles can view course detail — but NUC Visitor is read-only
            (enforced inside the component via RoleGate) */}
        <Route path="courses/:id" element={<CourseDetail />} />

        {/* All roles */}
        <Route path="calculator" element={<Calculator />} />
        <Route path="settings"   element={<Settings />} />

        {/* HOD + APU only — documents */}
        <Route path="documents" element={
          <RoleRoute allow={["HOD","APU_OFFICER"]}>
            <Documents />
          </RoleRoute>
        }/>

        {/* HOD + APU only — notifications */}
        <Route path="notifications" element={
          <RoleRoute allow={["HOD","APU_OFFICER"]}>
            <Notification />
          </RoleRoute>
        }/>

        {/* All roles — but different views inside */}
        <Route path="team" element={<Team />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// ── Smart index redirect based on role ────────────────────────────────────────
function RoleIndex() {
  const { role } = useRole();
  if (role === "NUC_VISITOR") return <Navigate to="/team"      replace />;
  if (role === "APU_OFFICER") return <Navigate to="/dashboard" replace />;
  if (role === "HOD")         return <Navigate to="/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}