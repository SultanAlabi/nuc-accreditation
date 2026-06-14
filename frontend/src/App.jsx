

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth }   from "./context/AuthContext";
import { useRole }   from "./hooks/useRole";
import Layout        from "./components/Layout";
import Login         from "./pages/Login";
import Register      from "./pages/Register";
import Dashboard     from "./pages/Dashboard";
import Courses       from "./pages/Courses";
import CourseDetail  from "./pages/CourseDetail";
import NewCourse     from "./pages/NewCourse";
import Documents     from "./pages/Documents";
import Calculator    from "./pages/Calculator";
import Notifications from "./pages/Notification";
import Settings      from "./pages/Settings";
import Team          from "./pages/Team";
import AccessDenied  from "./pages/AccessDenied";

function Splash() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      minHeight:"100vh", background:"#07162F", flexDirection:"column", gap:16 }}>
      <svg width="44" height="44" viewBox="0 0 28 28" fill="none"
        style={{ animation:"pulse 1.4s ease-in-out infinite" }}>
        <rect x="2"  y="2"  width="10" height="10" rx="2" fill="#22D3EE"/>
        <rect x="16" y="2"  width="10" height="10" rx="2" fill="rgba(34,211,238,0.4)"/>
        <rect x="2"  y="16" width="10" height="10" rx="2" fill="rgba(34,211,238,0.4)"/>
        <rect x="16" y="16" width="10" height="10" rx="2" fill="rgba(34,211,238,0.15)"/>
      </svg>
      <div style={{ color:"#475569", fontSize:11, fontFamily:"monospace",
        letterSpacing:"0.14em", textTransform:"uppercase" }}>Loading…</div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
    </div>
  );
}

// Must be logged in
function PrivateRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <Splash />;
  return token ? children : <Navigate to="/login" replace />;
}

// Already logged in → skip to dashboard
function PublicRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? <Navigate to="/dashboard" replace /> : children;
}

// Restrict route to specific roles only
function RoleRoute({ allow, children }) {
  const { user } = useAuth();
  if (!user) return <Splash />;
  if (!allow.includes(user.role)) return <AccessDenied />;
  return children;
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* ✅ Dashboard — ALL roles, no restriction.
            The Dashboard component renders HOD/APU/NUC view internally. */}
        <Route path="dashboard" element={<Dashboard />} />

        {/* All roles */}
        <Route path="courses/:id"   element={<CourseDetail />} />
        <Route path="calculator"    element={<Calculator />} />
        <Route path="settings"      element={<Settings />} />
        <Route path="team"          element={<Team />} />
        <Route path="notifications" element={<Notifications />} />

        {/* HOD + APU only */}
        <Route path="courses" element={
          <RoleRoute allow={["HOD","APU"]}>
            <Courses />
          </RoleRoute>
        }/>
        <Route path="documents" element={
          <RoleRoute allow={["HOD","APU"]}>
            <Documents />
          </RoleRoute>
        }/>

        {/* HOD only */}
        <Route path="courses/new" element={
          <RoleRoute allow={["HOD"]}>
            <NewCourse />
          </RoleRoute>
        }/>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;