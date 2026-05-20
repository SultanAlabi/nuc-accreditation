// src/pages/Settings.jsx
//
// Django endpoints:
//   GET   /api/auth/me/
//   PATCH /api/auth/profile/         { first_name, last_name, phone, university, department, faculty }
//   POST  /api/auth/change-password/ { old_password, new_password, confirm_password }
//   PATCH /api/auth/preferences/     { email_notifications, sms_notifications, milestone_alerts, document_alerts, ratio_alerts }
//   DELETE /api/auth/account/

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { settingsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

// ── Toast ─────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type="success") => {
    const id = Date.now();
    setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3500);
  },[]);
  return { toasts, push };
}

function ToastStack({ toasts }) {
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,
      display:"flex",flexDirection:"column",gap:8}}>
      {toasts.map(t=>(
        <div key={t.id} style={{
          background:t.type==="error"?"#DC2626":"#059669",
          color:"#fff",padding:"11px 18px",borderRadius:8,
          boxShadow:"0 8px 24px rgba(7,22,47,0.25)",
          fontSize:13,fontWeight:600,minWidth:260,
          borderLeft:`3px solid ${t.type==="error"?"#FCA5A5":"#6EE7B7"}`,
          animation:"fadeIn 0.2s ease",
        }}>
          {t.type==="error"?"⚠ ":"✓ "}{t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Shared field components ───────────────────────────────────────────────────
function Field({ label, name, value, onChange, type="text",
  placeholder="", hint="", error="", disabled=false }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <label style={S.label}>{label}</label>
      <input type={type} name={name} value={value}
        onChange={onChange} placeholder={placeholder}
        disabled={disabled}
        style={{...S.input,
          background:disabled?"#F8FAFC":"#fff",
          color:disabled?"#94A3B8":"#07162F",
          borderColor:error?"#DC2626":"#CBD5E1"}}/>
      {hint  && !error && <span style={S.hint}>{hint}</span>}
      {error && <span style={S.err}>{error}</span>}
    </div>
  );
}

function Toggle({ label, sub, checked, onChange }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",
      alignItems:"center",padding:"12px 0",
      borderBottom:"1px solid #F1F5F9"}}>
      <div>
        <div style={{fontSize:13,fontWeight:600,color:"#07162F"}}>{label}</div>
        {sub && <div style={{fontSize:11,color:"#64748B",marginTop:2}}>{sub}</div>}
      </div>
      <button onClick={()=>onChange(!checked)} style={{
        width:44,height:24,borderRadius:12,border:"none",
        background:checked?"#059669":"#CBD5E1",
        cursor:"pointer",position:"relative",transition:"background 0.2s",
        flexShrink:0,
      }}>
        <span style={{
          position:"absolute",top:2,
          left:checked?22:2,
          width:20,height:20,borderRadius:"50%",
          background:"#fff",transition:"left 0.2s",
          boxShadow:"0 1px 3px rgba(0,0,0,0.2)",
        }}/>
      </button>
    </div>
  );
}

function SectionCard({ title, subtitle, icon, children, action }) {
  return (
    <div style={{background:"#fff",border:"1px solid #E2E8F0",
      borderRadius:12,overflow:"hidden",
      boxShadow:"0 1px 4px rgba(7,22,47,0.06)"}}>
      <div style={{padding:"18px 22px",borderBottom:"1px solid #E2E8F0",
        display:"flex",justifyContent:"space-between",alignItems:"center",
        background:"#FAFBFC"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>{icon}</span>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#07162F"}}>{title}</div>
            {subtitle && <div style={{fontSize:11,color:"#64748B",marginTop:1}}>{subtitle}</div>}
          </div>
        </div>
        {action}
      </div>
      <div style={{padding:"22px"}}>{children}</div>
    </div>
  );
}

// ── Avatar with initials ──────────────────────────────────────────────────────
function BigAvatar({ name, role }) {
  const initials = name
    ? name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()
    : "AU";
  return (
    <div style={{display:"flex",alignItems:"center",gap:16}}>
      <div style={{width:72,height:72,borderRadius:"50%",
        background:"linear-gradient(135deg,#22D3EE,#2563EB)",
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:24,fontWeight:700,color:"#fff",
        fontFamily:"'IBM Plex Mono',monospace",
        boxShadow:"0 4px 16px rgba(34,211,238,0.3)",flexShrink:0}}>
        {initials}
      </div>
      <div>
        <div style={{fontSize:18,fontWeight:700,color:"#07162F"}}>{name}</div>
        <div style={{fontSize:12,color:"#64748B",marginTop:2}}>{role}</div>
        <div style={{fontSize:10,fontFamily:"'IBM Plex Mono',monospace",
          color:"#94A3B8",marginTop:4,letterSpacing:"0.06em",
          textTransform:"uppercase"}}>
          Avatar auto-generated from initials
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { toasts, push: toast } = useToast();

  // ── State: profile ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    first_name:"", last_name:"", email:"",
    phone:"", university:"", faculty:"", department:"",
    role:"", staff_id:"",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving,  setProfileSaving]  = useState(false);
  const [profileErrors,  setProfileErrors]  = useState({});

  // ── State: password ─────────────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({
    old_password:"", new_password:"", confirm_password:""
  });
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwErrors,  setPwErrors]  = useState({});
  const [showPws,   setShowPws]   = useState({ old:false, new:false, confirm:false });

  // ── State: preferences ──────────────────────────────────────────────────────
  const [prefs, setPrefs] = useState({
    email_notifications:   true,
    sms_notifications:     false,
    milestone_alerts:      true,
    document_alerts:       true,
    ratio_alerts:          true,
    weekly_digest:         false,
    team_portal_access:    false,
  });
  const [prefsSaving, setPrefsSaving] = useState(false);

  // ── State: danger zone ──────────────────────────────────────────────────────
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [deactivateText,    setDeactivateText]    = useState("");

  // ── Active tab ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState("profile");

  // ── Load profile ─────────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await settingsAPI.getProfile();
      const u = res.data;
      setProfile({
        first_name:  u.first_name  || "",
        last_name:   u.last_name   || "",
        email:       u.email       || "",
        phone:       u.phone       || "",
        university:  u.university  || "",
        faculty:     u.faculty     || "",
        department:  u.department  || "",
        role:        u.role        || "",
        staff_id:    u.staff_id    || "",
      });
      if (u.preferences) setPrefs(p => ({...p, ...u.preferences}));
      // Also update localStorage
      localStorage.setItem("nuc_user", JSON.stringify(u));
    } catch {
      // Pre-fill from localStorage if backend not ready
      const cached = JSON.parse(localStorage.getItem("nuc_user") || "{}");
      setProfile(p => ({...p, ...cached}));
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── Save profile ─────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    const errs = {};
    if (!profile.first_name.trim()) errs.first_name = "Required";
    if (!profile.last_name.trim())  errs.last_name  = "Required";
    if (!profile.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      errs.email = "Enter a valid email";
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }

    setProfileSaving(true);
    try {
      const res = await settingsAPI.updateProfile({
        first_name: profile.first_name,
        last_name:  profile.last_name,
        phone:      profile.phone,
        university: profile.university,
        faculty:    profile.faculty,
        department: profile.department,
      });
      localStorage.setItem("nuc_user", JSON.stringify(res.data));
      updateUser(res.data);
      toast("Profile updated successfully.");
      setProfileErrors({});
    } catch (err) {
      const d = err.response?.data || {};
      if (typeof d === "object") setProfileErrors(d);
      toast(d.detail || "Failed to save profile.", "error");
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    const errs = {};
    if (!passwords.old_password)   errs.old_password     = "Required";
    if (passwords.new_password.length < 8)
      errs.new_password = "Minimum 8 characters";
    if (passwords.new_password !== passwords.confirm_password)
      errs.confirm_password = "Passwords do not match";
    if (Object.keys(errs).length) { setPwErrors(errs); return; }

    setPwSaving(true);
    try {
      await settingsAPI.changePassword({
        old_password:     passwords.old_password,
        new_password:     passwords.new_password,
        confirm_password: passwords.confirm_password,
      });
      setPasswords({old_password:"",new_password:"",confirm_password:""});
      toast("Password changed successfully.");
      setPwErrors({});
    } catch (err) {
      const d = err.response?.data || {};
      if (d.old_password) setPwErrors({ old_password: d.old_password[0] });
      else toast(d.detail || "Failed to change password.", "error");
    } finally {
      setPwSaving(false);
    }
  };

  // ── Save preferences ─────────────────────────────────────────────────────────
  const handleSavePrefs = async () => {
    setPrefsSaving(true);
    try {
      await settingsAPI.updatePrefs(prefs);
      toast("Preferences saved.");
    } catch {
      toast("Failed to save preferences.", "error");
    } finally {
      setPrefsSaving(false);
    }
  };

  // ── Deactivate account ───────────────────────────────────────────────────────
  const handleDeactivate = async () => {
    if (deactivateText !== "DELETE") return;
    try {
      await settingsAPI.deactivate();
      localStorage.clear();
      navigate("/login");
    } catch {
      toast("Failed to deactivate account. Contact your admin.", "error");
    }
  };

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Your Name";
  const pw = (field) => ({
    value: passwords[field],
    onChange: e => setPasswords(p=>({...p,[field]:e.target.value})),
    error: pwErrors[field] || "",
  });

  const TABS = [
    { id:"profile",     label:"👤 Profile"       },
    { id:"security",    label:"🔒 Security"       },
    { id:"preferences", label:"🔔 Preferences"    },
    { id:"danger",      label:"⚠ Danger Zone"    },
  ];

  return (
    <div style={{fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",
      background:"#F0F4F8",minHeight:"100vh",padding:"32px 36px"}}>

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none} }
        @keyframes pulse  { 0%,100%{opacity:1}50%{opacity:0.4} }
        input:focus,select:focus,textarea:focus {
          border-color:#0C2D5E !important;
          box-shadow:0 0 0 3px rgba(12,45,94,0.08) !important;
          outline:none;
        }
      `}</style>

      {/* Header */}
      <div style={{marginBottom:28}}>
        <div style={{fontSize:10,color:"#94A3B8",
          fontFamily:"'IBM Plex Mono',monospace",
          letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>
          Account Management
        </div>
        <h1 style={{fontSize:24,fontWeight:700,color:"#07162F",margin:0}}>
          Settings
        </h1>
        <p style={{fontSize:13,color:"#64748B",margin:"4px 0 0"}}>
          Manage your profile, security, and notification preferences.
        </p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"220px 1fr",
        gap:24,alignItems:"start"}}>

        {/* ── Sidebar tabs ── */}
        <div style={{background:"#fff",border:"1px solid #E2E8F0",
          borderRadius:12,overflow:"hidden",
          boxShadow:"0 1px 4px rgba(7,22,47,0.06)",
          position:"sticky",top:80}}>
          {/* Avatar preview */}
          <div style={{padding:"20px 16px",
            background:"linear-gradient(135deg,#07162F,#0C2D5E)",
            borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:44,height:44,borderRadius:"50%",
                background:"linear-gradient(135deg,#22D3EE,#2563EB)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:16,fontWeight:700,color:"#fff",
                fontFamily:"'IBM Plex Mono',monospace",flexShrink:0}}>
                {fullName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"AU"}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:"#fff",
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {fullName}
                </div>
                <div style={{fontSize:9,color:"#64748B",
                  fontFamily:"'IBM Plex Mono',monospace",
                  textTransform:"uppercase",letterSpacing:"0.06em",marginTop:2}}>
                  {profile.role || "APU Officer"}
                </div>
              </div>
            </div>
          </div>

          {/* Tab list */}
          <div style={{padding:"8px 6px"}}>
            {TABS.map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                display:"flex",alignItems:"center",width:"100%",
                padding:"10px 12px",borderRadius:7,marginBottom:2,
                border:"none",cursor:"pointer",textAlign:"left",
                background: tab===t.id ? "#EFF6FF" : "transparent",
                color:      tab===t.id ? "#1D4ED8" : "#64748B",
                fontFamily:"'IBM Plex Mono',monospace",
                fontSize:11,fontWeight:600,
                borderLeft: tab===t.id ? "3px solid #2563EB" : "3px solid transparent",
                transition:"all 0.12s",
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{display:"flex",flexDirection:"column",gap:20}}>

          {/* ── PROFILE TAB ── */}
          {tab==="profile" && (
            <>
              <SectionCard icon="👤" title="Personal Information"
                subtitle="Your name and contact details">
                {profileLoading ? (
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    {[...Array(4)].map((_,i)=>(
                      <div key={i} style={{height:38,background:"#F1F5F9",
                        borderRadius:7,animation:"pulse 1.5s infinite"}}/>
                    ))}
                  </div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    <BigAvatar name={fullName} role={profile.role}/>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      <Field label="First Name *" name="first_name"
                        value={profile.first_name} error={profileErrors.first_name}
                        onChange={e=>setProfile(p=>({...p,first_name:e.target.value}))}
                        placeholder="Adaeze"/>
                      <Field label="Last Name *" name="last_name"
                        value={profile.last_name} error={profileErrors.last_name}
                        onChange={e=>setProfile(p=>({...p,last_name:e.target.value}))}
                        placeholder="Okafor"/>
                    </div>
                    <Field label="Email Address *" name="email" type="email"
                      value={profile.email} error={profileErrors.email}
                      onChange={e=>setProfile(p=>({...p,email:e.target.value}))}
                      placeholder="a.okafor@university.edu.ng"
                      hint="Contact your admin to change your email address."
                      disabled={true}/>
                    <Field label="Phone Number" name="phone" type="tel"
                      value={profile.phone}
                      onChange={e=>setProfile(p=>({...p,phone:e.target.value}))}
                      placeholder="+234 800 000 0000"/>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      <Field label="Staff / NUC ID" name="staff_id"
                        value={profile.staff_id} disabled={true}
                        hint="Assigned by admin — not editable."/>
                      <Field label="Role" name="role"
                        value={profile.role} disabled={true}
                        hint="Contact admin to change your role."/>
                    </div>
                  </div>
                )}
              </SectionCard>

              <SectionCard icon="🏛" title="Institutional Details"
                subtitle="Your university and department affiliation">
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <Field label="University / Institution" name="university"
                    value={profile.university}
                    onChange={e=>setProfile(p=>({...p,university:e.target.value}))}
                    placeholder="University of Lagos"/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <Field label="Faculty" name="faculty"
                      value={profile.faculty}
                      onChange={e=>setProfile(p=>({...p,faculty:e.target.value}))}
                      placeholder="Engineering & Technology"/>
                    <Field label="Department" name="department"
                      value={profile.department}
                      onChange={e=>setProfile(p=>({...p,department:e.target.value}))}
                      placeholder="Computer Science"/>
                  </div>
                </div>
              </SectionCard>

              <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
                <button onClick={loadProfile} style={S.btnSec}>
                  ↺ Reset
                </button>
                <button onClick={handleSaveProfile}
                  disabled={profileSaving}
                  style={{...S.btnPri,
                    display:"flex",alignItems:"center",gap:8,
                    opacity:profileSaving?0.7:1}}>
                  {profileSaving && <span style={S.spinner}/>}
                  {profileSaving ? "Saving…" : "💾 Save Profile"}
                </button>
              </div>
            </>
          )}

          {/* ── SECURITY TAB ── */}
          {tab==="security" && (
            <>
              <SectionCard icon="🔒" title="Change Password"
                subtitle="Use a strong password with at least 8 characters">
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  {/* Info box */}
                  <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",
                    borderRadius:8,padding:"12px 14px",fontSize:12,
                    color:"#1D4ED8",lineHeight:1.6}}>
                    🔐 Your password is encrypted and never stored in plain text.
                    After changing, you will remain logged in on this device.
                  </div>

                  {[
                    { label:"Current Password", field:"old_password" },
                    { label:"New Password",      field:"new_password" },
                    { label:"Confirm New Password", field:"confirm_password" },
                  ].map(({ label, field }) => (
                    <div key={field} style={{display:"flex",flexDirection:"column",gap:6}}>
                      <label style={S.label}>{label}</label>
                      <div style={{position:"relative"}}>
                        <input
                          type={showPws[field.split("_")[0]] ? "text" : "password"}
                          value={passwords[field]}
                          onChange={e=>setPasswords(p=>({...p,[field]:e.target.value}))}
                          placeholder="••••••••"
                          style={{...S.input,paddingRight:44,
                            borderColor:pwErrors[field]?"#DC2626":"#CBD5E1"}}/>
                        <button
                          type="button"
                          onClick={()=>setShowPws(p=>({...p,[field.split("_")[0]]:!p[field.split("_")[0]]}))}
                          style={{position:"absolute",right:12,top:"50%",
                            transform:"translateY(-50%)",background:"none",
                            border:"none",cursor:"pointer",
                            fontSize:15,color:"#94A3B8",padding:4}}>
                          {showPws[field.split("_")[0]] ? "🙈" : "👁"}
                        </button>
                      </div>
                      {pwErrors[field] && (
                        <span style={S.err}>{pwErrors[field]}</span>
                      )}
                      {/* Password strength for new_password */}
                      {field==="new_password" && passwords.new_password && (
                        <div style={{display:"flex",gap:4,marginTop:2}}>
                          {[1,2,3,4].map(i=>{
                            const strength = Math.min(4,
                              Math.floor(passwords.new_password.length / 3));
                            return (
                              <div key={i} style={{
                                flex:1,height:3,borderRadius:2,
                                background:i<=strength
                                  ? strength<=1?"#DC2626":strength<=2?"#D97706":"#059669"
                                  : "#E2E8F0",transition:"background 0.2s",
                              }}/>
                            );
                          })}
                          <span style={{fontSize:10,color:"#94A3B8",
                            fontFamily:"'IBM Plex Mono',monospace",marginLeft:4}}>
                            {passwords.new_password.length<6?"Weak":passwords.new_password.length<10?"Fair":"Strong"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  <div style={{display:"flex",justifyContent:"flex-end"}}>
                    <button onClick={handleChangePassword}
                      disabled={pwSaving}
                      style={{...S.btnPri,
                        display:"flex",alignItems:"center",gap:8,
                        opacity:pwSaving?0.7:1}}>
                      {pwSaving && <span style={S.spinner}/>}
                      {pwSaving ? "Changing…" : "🔒 Change Password"}
                    </button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon="📱" title="Active Sessions"
                subtitle="Devices currently logged into your account">
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {[
                    { device:"Chrome on Windows", location:"Lagos, Nigeria",   time:"Now — current session",   current:true  },
                    { device:"Safari on iPhone",  location:"Abuja, Nigeria",   time:"2 hours ago",             current:false },
                  ].map((s,i)=>(
                    <div key={i} style={{
                      display:"flex",justifyContent:"space-between",
                      alignItems:"center",padding:"12px 14px",
                      background:s.current?"#F0FDF4":"#F8FAFC",
                      border:`1px solid ${s.current?"#BBF7D0":"#E2E8F0"}`,
                      borderRadius:8,flexWrap:"wrap",gap:10}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:20}}>{s.device.includes("iPhone")?"📱":"💻"}</span>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:"#07162F"}}>
                            {s.device}
                            {s.current && (
                              <span style={{marginLeft:8,fontSize:9,
                                fontFamily:"'IBM Plex Mono',monospace",
                                background:"#D1FAE5",color:"#065F46",
                                border:"1px solid #6EE7B7",
                                padding:"1px 5px",borderRadius:3,fontWeight:700}}>
                                CURRENT
                              </span>
                            )}
                          </div>
                          <div style={{fontSize:11,color:"#64748B"}}>
                            {s.location} · {s.time}
                          </div>
                        </div>
                      </div>
                      {!s.current && (
                        <button style={{...S.btnSec,fontSize:11,
                          padding:"5px 12px",color:"#DC2626",
                          borderColor:"#FCA5A5"}}>
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          )}

          {/* ── PREFERENCES TAB ── */}
          {tab==="preferences" && (
            <>
              <SectionCard icon="🔔" title="Notification Preferences"
                subtitle="Control how and when the system contacts you">
                <div>
                  <Toggle label="Email Notifications"
                    sub="Receive alerts and updates via email"
                    checked={prefs.email_notifications}
                    onChange={v=>setPrefs(p=>({...p,email_notifications:v}))}/>
                  <Toggle label="SMS Notifications"
                    sub="Receive urgent alerts via SMS"
                    checked={prefs.sms_notifications}
                    onChange={v=>setPrefs(p=>({...p,sms_notifications:v}))}/>
                  <Toggle label="Weekly Digest"
                    sub="Summary of all programme activity every Monday"
                    checked={prefs.weekly_digest}
                    onChange={v=>setPrefs(p=>({...p,weekly_digest:v}))}/>
                </div>
              </SectionCard>

              <SectionCard icon="⏰" title="Alert Types"
                subtitle="Choose which NUC events trigger notifications">
                <div>
                  <Toggle label="Milestone Alerts"
                    sub="Resource Visit, Full Accreditation, Re-accreditation countdowns"
                    checked={prefs.milestone_alerts}
                    onChange={v=>setPrefs(p=>({...p,milestone_alerts:v}))}/>
                  <Toggle label="Document Alerts"
                    sub="When documents are uploaded, verified, or flagged"
                    checked={prefs.document_alerts}
                    onChange={v=>setPrefs(p=>({...p,document_alerts:v}))}/>
                  <Toggle label="Ratio Warnings"
                    sub="When student:lecturer ratio exceeds the NUC 30:1 standard"
                    checked={prefs.ratio_alerts}
                    onChange={v=>setPrefs(p=>({...p,ratio_alerts:v}))}/>
                  <Toggle label="Team Portal Access Requests"
                    sub="When an NUC visiting team member requests access"
                    checked={prefs.team_portal_access}
                    onChange={v=>setPrefs(p=>({...p,team_portal_access:v}))}/>
                </div>
              </SectionCard>

              <div style={{display:"flex",justifyContent:"flex-end"}}>
                <button onClick={handleSavePrefs}
                  disabled={prefsSaving}
                  style={{...S.btnPri,
                    display:"flex",alignItems:"center",gap:8,
                    opacity:prefsSaving?0.7:1}}>
                  {prefsSaving && <span style={S.spinner}/>}
                  {prefsSaving ? "Saving…" : "💾 Save Preferences"}
                </button>
              </div>
            </>
          )}

          {/* ── DANGER ZONE ── */}
          {tab==="danger" && (
            <SectionCard icon="⚠" title="Danger Zone"
              subtitle="Irreversible actions — proceed with extreme caution">
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                {/* Warning */}
                <div style={{background:"#FEF3C7",border:"1px solid #FCD34D",
                  borderRadius:8,padding:"14px 16px",
                  fontSize:13,color:"#92400E",lineHeight:1.6}}>
                  <strong>Warning:</strong> Deactivating your account will immediately
                  revoke your access to the NUC Accreditation portal. All your data
                  will be retained but your login will be disabled. Contact your
                  Academic Planning Unit administrator to reactivate.
                </div>

                {!confirmDeactivate ? (
                  <button onClick={()=>setConfirmDeactivate(true)}
                    style={{...S.btnSec,color:"#DC2626",
                      borderColor:"#FCA5A5",alignSelf:"flex-start",
                      display:"flex",alignItems:"center",gap:8}}>
                    🚨 Deactivate My Account
                  </button>
                ) : (
                  <div style={{background:"#FEF2F2",
                    border:"1px solid #FCA5A5",
                    borderRadius:10,padding:"20px"}}>
                    <div style={{fontSize:14,fontWeight:700,
                      color:"#DC2626",marginBottom:8}}>
                      Confirm Account Deactivation
                    </div>
                    <div style={{fontSize:12,color:"#6B7280",
                      marginBottom:14,lineHeight:1.6}}>
                      Type <strong>DELETE</strong> below to confirm you want to
                      deactivate your account.
                    </div>
                    <input value={deactivateText}
                      onChange={e=>setDeactivateText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      style={{...S.input,marginBottom:12,
                        borderColor:"#FCA5A5",
                        background:"#fff"}}/>
                    <div style={{display:"flex",gap:10}}>
                      <button onClick={()=>{setConfirmDeactivate(false);setDeactivateText("");}}
                        style={S.btnSec}>
                        Cancel
                      </button>
                      <button onClick={handleDeactivate}
                        disabled={deactivateText!=="DELETE"}
                        style={{...S.btnPri,
                          background:deactivateText==="DELETE"
                            ?"#DC2626":"#94A3B8",
                          opacity:deactivateText==="DELETE"?1:0.6}}>
                        Yes, Deactivate Account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      <ToastStack toasts={toasts}/>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  label: {
    fontSize:11,fontFamily:"'IBM Plex Mono',monospace",
    fontWeight:700,letterSpacing:"0.1em",
    textTransform:"uppercase",color:"#374151",display:"block",
  },
  input: {
    width:"100%",padding:"10px 13px",
    border:"1.5px solid #CBD5E1",borderRadius:7,
    fontFamily:"'IBM Plex Sans',sans-serif",
    fontSize:13,color:"#07162F",background:"#fff",
    outline:"none",boxSizing:"border-box",
    transition:"border-color 0.15s,box-shadow 0.15s",
  },
  hint: { fontSize:11,color:"#94A3B8",marginTop:3,lineHeight:1.5 },
  err:  { fontSize:11,color:"#DC2626",fontWeight:500,marginTop:3 },
  btnPri: {
    padding:"10px 20px",borderRadius:7,cursor:"pointer",
    fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:12,
    background:"linear-gradient(135deg,#07162F,#0C2D5E)",
    color:"#fff",border:"none",letterSpacing:"0.04em",
  },
  btnSec: {
    padding:"10px 18px",borderRadius:7,cursor:"pointer",
    fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:12,
    background:"#fff",color:"#374151",border:"1.5px solid #CBD5E1",
  },
  spinner: {
    display:"inline-block",width:14,height:14,
    border:"2px solid rgba(255,255,255,0.3)",
    borderTopColor:"#fff",borderRadius:"50%",
    animation:"spin 0.7s linear infinite",
  },
};