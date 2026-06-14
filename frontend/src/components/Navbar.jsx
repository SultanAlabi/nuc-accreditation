// src/components/layout/Navbar.jsx
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../hooks/useRole";
import { useNavigate, useLocation, NavLink } from "react-router-dom";

const ALL_NAV_LINKS = [
  { to: "/dashboard",     label: "Dashboard",        icon: "▦",  roles: ["HOD","APU"] },
  { to: "/courses",       label: "Courses",           icon: "⊟",  roles: ["HOD","APU"] },
  { to: "/documents",     label: "Documents",         icon: "📁", roles: ["HOD","APU"] },
  { to: "/calculator",    label: "Ratio Calculator",  icon: "⊞",  roles: ["HOD","APU","NUC_VISITOR"] },
  { to: "/notifications", label: "Notifications",     icon: "🔔", roles: ["HOD","APU"] },
  { to: "/team",          label: "Team Portal",       icon: "👥", roles: ["HOD","APU","NUC_VISITOR"] },
];

// Page titles for the breadcrumb
const PAGE_TITLES = {
  "/dashboard":     "Dashboard",
  "/courses":       "All Programmes",
  "/courses/new":   "New Programme",
  "/documents":     "Document Management",
  "/calculator":    "Ratio Calculator",
  "/notifications": "Notifications",
  "/team":          "Team Portal",
  "/settings":      "Account Settings",
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/courses/")) return "Programme Detail";
  return "NUC Accreditation";
}

function Avatar({ name }) {
  const initials = name
    ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "AU";
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%",
      background: "linear-gradient(135deg,#22D3EE,#2563EB)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 700, color: "#fff",
      fontFamily: "'IBM Plex Mono',monospace",
      flexShrink: 0, cursor: "pointer",
      boxShadow: "0 2px 8px rgba(34,211,238,0.3)",
    }}>
      {initials}
    </div>
  );
}

export default function Navbar({ notifCount = 0 }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const profileRef = useRef(null);
  const searchRef  = useRef(null);

  const { user: authUser, logout } = useAuth();
  const { role } = useRole();
  const user = authUser || JSON.parse(localStorage.getItem("nuc_user") || "{}");
  const NAV_LINKS = ALL_NAV_LINKS.filter(n => !role || n.roles.includes(role));
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Dr. A. Okafor";
  const canGoBack = window.history.length > 1;
  const pageTitle = getPageTitle(location.pathname);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  // Quick search filter
  const searchResults = searchQuery.length > 1
    ? NAV_LINKS.filter(n =>
        n.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <>
      <style>{`
        @keyframes dropIn  { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:none } }
        @keyframes slideDown { from { opacity:0; max-height:0 } to { opacity:1; max-height:400px } }
        .nav-link-item:hover { background: rgba(255,255,255,0.06) !important; color: #fff !important; }
        .profile-item:hover  { background: #F1F5F9 !important; }
        .profile-item-danger:hover { background: #FEE2E2 !important; color: #DC2626 !important; }
        .icon-btn:hover { background: rgba(255,255,255,0.1) !important; }
      `}</style>

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0,
        height: 60, zIndex: 300,
        background: "linear-gradient(90deg, #07162F 0%, #0C2D5E 60%, #0F3A7A 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center",
        padding: "0 20px", gap: 8,
        boxShadow: "0 4px 24px rgba(7,22,47,0.3)",
        backdropFilter: "blur(12px)",
        fontFamily: "'IBM Plex Sans','Segoe UI',sans-serif",
      }}>

        {/* ── Logo ── */}
        <div onClick={() => navigate("/dashboard")}
          style={{ display:"flex", alignItems:"center", gap:9,
            cursor:"pointer", flexShrink:0, marginRight:4 }}>
          <div style={{ width:32, height:32,
            background:"rgba(34,211,238,0.12)",
            border:"1px solid rgba(34,211,238,0.25)",
            borderRadius:8, display:"flex",
            alignItems:"center", justifyContent:"center" }}>
            <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
              <rect x="2"  y="2"  width="10" height="10" rx="2" fill="#22D3EE"/>
              <rect x="16" y="2"  width="10" height="10" rx="2" fill="rgba(34,211,238,0.45)"/>
              <rect x="2"  y="16" width="10" height="10" rx="2" fill="rgba(34,211,238,0.45)"/>
              <rect x="16" y="16" width="10" height="10" rx="2" fill="rgba(34,211,238,0.2)"/>
            </svg>
          </div>
          <div style={{ display:"flex", flexDirection:"column" }}>
            <span style={{ fontSize:8, fontFamily:"'IBM Plex Mono',monospace",
              letterSpacing:"0.14em", color:"#22D3EE",
              textTransform:"uppercase", lineHeight:1.2 }}>
              NUC
            </span>
            <span style={{ fontSize:11, fontWeight:700,
              color:"#fff", lineHeight:1.1, letterSpacing:"-0.01em" }}>
              AccreditMS
            </span>
          </div>
        </div>

        {/* ── Back button ── */}
        {canGoBack && location.pathname !== "/dashboard" && (
          <button onClick={() => navigate(-1)}
            className="icon-btn"
            title="Go back"
            style={{ width:34, height:34, borderRadius:8,
              background:"rgba(255,255,255,0.06)",
              border:"1px solid rgba(255,255,255,0.1)",
              color:"#94A3B8", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0, transition:"all 0.15s", fontSize:14 }}>
            ←
          </button>
        )}

        {/* ── Page title breadcrumb ── */}
        <div style={{ display:"flex", alignItems:"center", gap:6,
          marginRight:"auto", minWidth:0 }}>
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)",
            fontFamily:"'IBM Plex Mono',monospace",
            textTransform:"uppercase", letterSpacing:"0.1em",
            display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ cursor:"pointer", color:"rgba(255,255,255,0.4)" }}
              onClick={() => navigate("/dashboard")}>
              Home
            </span>
            {location.pathname !== "/dashboard" && (
              <>
                <span style={{ opacity:0.4 }}>/</span>
                <span style={{ color:"#22D3EE", fontWeight:700 }}>
                  {pageTitle}
                </span>
              </>
            )}
          </span>
        </div>

        {/* ── Desktop nav links ── */}
        <div style={{ display:"flex", alignItems:"center", gap:2,
          "@media(max-width:768px)": { display:"none" } }}>
          {NAV_LINKS.map(n => (
            <NavLink key={n.to} to={n.to}
              className="nav-link-item"
              style={({ isActive }) => ({
                display:"flex", alignItems:"center", gap:5,
                padding:"6px 11px", borderRadius:7,
                textDecoration:"none",
                fontFamily:"'IBM Plex Mono',monospace",
                fontSize:10, fontWeight:600,
                color: isActive ? "#22D3EE" : "#94A3B8",
                background: isActive
                  ? "rgba(34,211,238,0.12)"
                  : "transparent",
                border: isActive
                  ? "1px solid rgba(34,211,238,0.2)"
                  : "1px solid transparent",
                transition:"all 0.12s",
                whiteSpace:"nowrap",
                position:"relative",
              })}>
              <span style={{ fontSize:11 }}>{n.icon}</span>
              {n.label}
              {/* Notification badge on bell */}
              {n.to === "/notifications" && notifCount > 0 && (
                <span style={{
                  position:"absolute", top:-4, right:-4,
                  background:"#DC2626", color:"#fff",
                  borderRadius:"50%", fontSize:8, fontWeight:700,
                  width:16, height:16, display:"flex",
                  alignItems:"center", justifyContent:"center",
                  border:"2px solid #07162F",
                }}>
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* ── Right side actions ── */}
        <div style={{ display:"flex", alignItems:"center",
          gap:6, marginLeft:8, flexShrink:0 }}>

          {/* Search button */}
          <div style={{ position:"relative" }}>
            <button
              className="icon-btn"
              onClick={() => { setSearchOpen(v => !v); setProfileOpen(false); }}
              title="Quick search"
              style={{ width:34, height:34, borderRadius:8,
                background: searchOpen
                  ? "rgba(34,211,238,0.12)"
                  : "rgba(255,255,255,0.06)",
                border: searchOpen
                  ? "1px solid rgba(34,211,238,0.25)"
                  : "1px solid rgba(255,255,255,0.1)",
                color: searchOpen ? "#22D3EE" : "#94A3B8",
                cursor:"pointer", display:"flex",
                alignItems:"center", justifyContent:"center",
                fontSize:14, transition:"all 0.15s" }}>
              🔍
            </button>

            {searchOpen && (
              <div style={{
                position:"absolute", top:42, right:0,
                width:280, background:"#0C2D5E",
                border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:10, padding:10,
                boxShadow:"0 12px 40px rgba(7,22,47,0.5)",
                animation:"dropIn 0.15s ease", zIndex:400,
              }}>
                <input
                  ref={searchRef}
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search pages…"
                  style={{
                    width:"100%", padding:"8px 12px",
                    background:"rgba(255,255,255,0.07)",
                    border:"1px solid rgba(255,255,255,0.1)",
                    borderRadius:7, color:"#fff", fontSize:12,
                    fontFamily:"'IBM Plex Mono',monospace",
                    outline:"none", boxSizing:"border-box",
                  }}
                />
                {searchResults.length > 0 && (
                  <div style={{ marginTop:8, display:"flex",
                    flexDirection:"column", gap:2 }}>
                    {searchResults.map(r => (
                      <button key={r.to}
                        onClick={() => { navigate(r.to); setSearchOpen(false); setSearchQuery(""); }}
                        style={{ display:"flex", alignItems:"center", gap:8,
                          padding:"8px 10px", borderRadius:6,
                          background:"rgba(255,255,255,0.05)",
                          border:"none", color:"#CBD5E1",
                          fontFamily:"'IBM Plex Mono',monospace",
                          fontSize:11, cursor:"pointer",
                          textAlign:"left", transition:"background 0.12s" }}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(34,211,238,0.1)"}
                        onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}>
                        <span>{r.icon}</span> {r.label}
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.length > 1 && searchResults.length === 0 && (
                  <div style={{ padding:"10px 8px", fontSize:11,
                    color:"rgba(255,255,255,0.3)",
                    fontFamily:"'IBM Plex Mono',monospace",
                    textAlign:"center" }}>
                    No pages match "{searchQuery}"
                  </div>
                )}
                {searchQuery.length === 0 && (
                  <div style={{ marginTop:8, display:"flex",
                    flexDirection:"column", gap:2 }}>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)",
                      fontFamily:"'IBM Plex Mono',monospace",
                      letterSpacing:"0.1em", textTransform:"uppercase",
                      padding:"4px 10px 6px" }}>
                      Quick Links
                    </div>
                    {NAV_LINKS.slice(0,4).map(r => (
                      <button key={r.to}
                        onClick={() => { navigate(r.to); setSearchOpen(false); }}
                        style={{ display:"flex", alignItems:"center", gap:8,
                          padding:"8px 10px", borderRadius:6,
                          background:"transparent", border:"none",
                          color:"#64748B", fontFamily:"'IBM Plex Mono',monospace",
                          fontSize:11, cursor:"pointer", textAlign:"left" }}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(34,211,238,0.08)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <span>{r.icon}</span> {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notifications bell */}
          <button className="icon-btn"
            onClick={() => navigate("/notifications")}
            title="Notifications"
            style={{ width:34, height:34, borderRadius:8,
              background:"rgba(255,255,255,0.06)",
              border:"1px solid rgba(255,255,255,0.1)",
              color:"#94A3B8", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:14, transition:"all 0.15s",
              position:"relative" }}>
            🔔
            {notifCount > 0 && (
              <span style={{
                position:"absolute", top:-3, right:-3,
                background:"#DC2626", color:"#fff",
                borderRadius:"50%", fontSize:8, fontWeight:700,
                width:15, height:15, display:"flex",
                alignItems:"center", justifyContent:"center",
                border:"2px solid #07162F",
              }}>
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>

          {/* New programme shortcut */}
          <button className="icon-btn"
            onClick={() => navigate("/courses/new")}
            title="New Programme"
            style={{ width:34, height:34, borderRadius:8,
              background:"rgba(34,211,238,0.1)",
              border:"1px solid rgba(34,211,238,0.2)",
              color:"#22D3EE", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16, fontWeight:700,
              transition:"all 0.15s", flexShrink:0 }}>
            +
          </button>

          {/* Divider */}
          <div style={{ width:1, height:24,
            background:"rgba(255,255,255,0.1)", margin:"0 4px" }}/>

          {/* Profile dropdown */}
          <div ref={profileRef} style={{ position:"relative" }}>
            <div onClick={() => { setProfileOpen(v => !v); setSearchOpen(false); }}
              style={{ display:"flex", alignItems:"center", gap:8,
                cursor:"pointer", padding:"4px 8px 4px 4px",
                borderRadius:9,
                background: profileOpen
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.04)",
                border: profileOpen
                  ? "1px solid rgba(255,255,255,0.15)"
                  : "1px solid rgba(255,255,255,0.08)",
                transition:"all 0.15s" }}>
              <Avatar name={fullName}/>
              <div style={{ display:"flex", flexDirection:"column" }}>
                <span style={{ fontSize:11, fontWeight:700,
                  color:"#E2E8F0", lineHeight:1.2,
                  maxWidth:100, overflow:"hidden",
                  textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {fullName}
                </span>
                <span style={{ fontSize:8,
                  fontFamily:"'IBM Plex Mono',monospace",
                  color:"#475569", letterSpacing:"0.06em",
                  textTransform:"uppercase", lineHeight:1.4 }}>
                  {role && role.length > 18 ? role.slice(0,18) + "…" : (role || "")}
                </span>
              </div>
              <span style={{ fontSize:10, color:"#475569",
                marginLeft:2, transition:"transform 0.15s",
                transform: profileOpen ? "rotate(180deg)" : "none" }}>
                ▾
              </span>
            </div>

            {/* Profile dropdown menu */}
            {profileOpen && (
              <div style={{
                position:"absolute", top:46, right:0,
                width:240, background:"#fff",
                border:"1px solid #E2E8F0", borderRadius:12,
                boxShadow:"0 16px 48px rgba(7,22,47,0.18)",
                overflow:"hidden", animation:"dropIn 0.15s ease",
                zIndex:400,
              }}>
                {/* Profile header */}
                <div style={{ padding:"16px",
                  background:"linear-gradient(135deg,#07162F,#0C2D5E)",
                  display:"flex", alignItems:"center", gap:10 }}>
                  <Avatar name={fullName}/>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700,
                      color:"#fff" }}>{fullName}</div>
                    <div style={{ fontSize:10,
                      fontFamily:"'IBM Plex Mono',monospace",
                      color:"#94A3B8", marginTop:1 }}>{role || ""}</div>
                    {user.email && (
                      <div style={{ fontSize:10, color:"#475569", marginTop:1 }}>
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Menu items */}
                <div style={{ padding:"6px" }}>
                  {[
                    { icon:"👤", label:"My Profile",       sub:"View account details",    action:()=>{ navigate("/settings"); setProfileOpen(false); } },
                    { icon:"⚙",  label:"Account Settings", sub:"Password, preferences",   action:()=>{ navigate("/settings"); setProfileOpen(false); } },
                    { icon:"🔔", label:"Notifications",    sub:`${notifCount} unread`,    action:()=>{ navigate("/notifications"); setProfileOpen(false); } },
                    { icon:"👥", label:"Team Portal",      sub:"NUC visiting team view",  action:()=>{ navigate("/team"); setProfileOpen(false); } },
                    { icon:"📊", label:"Ratio Calculator", sub:"Check NUC compliance",    action:()=>{ navigate("/calculator"); setProfileOpen(false); } },
                  ].map((item, i) => (
                    <button key={i}
                      className="profile-item"
                      onClick={item.action}
                      style={{ display:"flex", alignItems:"center", gap:10,
                        width:"100%", padding:"9px 10px",
                        borderRadius:7, border:"none",
                        background:"transparent", cursor:"pointer",
                        textAlign:"left", transition:"background 0.1s" }}>
                      <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600,
                          color:"#07162F" }}>{item.label}</div>
                        <div style={{ fontSize:10, color:"#94A3B8" }}>
                          {item.sub}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div style={{ height:1, background:"#F1F5F9", margin:"0 6px" }}/>

                {/* Logout */}
                <div style={{ padding:"6px" }}>
                  <button
                    className="profile-item-danger"
                    onClick={handleLogout}
                    style={{ display:"flex", alignItems:"center", gap:10,
                      width:"100%", padding:"9px 10px",
                      borderRadius:7, border:"none",
                      background:"transparent", cursor:"pointer",
                      textAlign:"left", transition:"all 0.1s" }}>
                    <span style={{ fontSize:16 }}>🚪</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700,
                        color:"#DC2626" }}>Sign Out</div>
                      <div style={{ fontSize:10, color:"#94A3B8" }}>
                        End your session
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="icon-btn"
            onClick={() => setMobileOpen(v => !v)}
            style={{ width:34, height:34, borderRadius:8,
              background:"rgba(255,255,255,0.06)",
              border:"1px solid rgba(255,255,255,0.1)",
              color:"#94A3B8", cursor:"pointer",
              display:"none", alignItems:"center",
              justifyContent:"center", fontSize:16,
              "@media(max-width:900px)": { display:"flex" } }}>
            ☰
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div style={{
          position:"fixed", top:60, left:0, right:0,
          background:"#07162F",
          borderBottom:"1px solid rgba(255,255,255,0.08)",
          padding:"10px 16px 16px", zIndex:299,
          animation:"slideDown 0.2s ease",
        }}>
          {NAV_LINKS.map(n => (
            <NavLink key={n.to} to={n.to}
              style={({ isActive }) => ({
                display:"flex", alignItems:"center", gap:10,
                padding:"10px 12px", borderRadius:7,
                textDecoration:"none", marginBottom:3,
                background: isActive
                  ? "rgba(34,211,238,0.1)"
                  : "transparent",
                color: isActive ? "#22D3EE" : "#94A3B8",
                fontFamily:"'IBM Plex Mono',monospace",
                fontSize:12, fontWeight:600,
              })}>
              <span>{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </div>
      )}
    </>
  );
}