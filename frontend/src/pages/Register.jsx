// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value:"HOD",         label:"Head of Department",   desc:"Manage programmes, upload documents",    icon:"🎓" },
  { value:"APU_OFFICER", label:"APU Officer",           desc:"Review and approve programmes",          icon:"🏛" },
  { value:"NUC_VISITOR", label:"NUC Visiting Team",     desc:"Read-only access to evidence lockers",   icon:"🔍" },
];

const FACULTIES = [
  "Engineering & Technology","Natural Sciences","Medicine & Health Sciences",
  "Law","Social Sciences","Arts & Humanities",
  "Management Sciences","Education","Agriculture","Environmental Sciences",
];

export default function Register() {
  const navigate      = useNavigate();
  const { register }  = useAuth();

  const [step, setStep] = useState(1);
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState({});
  const [showPw,    setShowPw]    = useState(false);
  const [showCPw,   setShowCPw]   = useState(false);

  const [form, setForm] = useState({
    first_name:"", last_name:"", email:"",
    phone:"", role:"", university:"",
    staff_id:"", faculty:"", department:"",
    password:"", confirm_password:"",
  });

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]:"", general:"" }));
  };

  const selectRole = (value) => {
    setForm(prev => ({ ...prev, role: value }));
    setErrors(prev => ({ ...prev, role:"" }));
  };

  // ── Step 1 validation ──────────────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "First name is required";
    if (!form.last_name.trim())  e.last_name  = "Last name is required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      e.email = "Enter a valid email address";
    if (!form.role)              e.role       = "Please select your role";
    if (!form.university.trim()) e.university = "University name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Step 2 validation ──────────────────────────────────────────────────────
  const validateStep2 = () => {
    const e = {};
    if (!form.staff_id.trim())     e.staff_id        = "Staff / NUC ID is required";
    if (form.password.length < 8)  e.password        = "Password must be at least 8 characters";
    if (form.password !== form.confirm_password)
      e.confirm_password = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setLoading(true);
    try {
      await register({
        first_name: form.first_name,
        last_name:  form.last_name,
        email:      form.email,
        phone:      form.phone,
        role:       form.role,
        university: form.university,
        staff_id:   form.staff_id,
        faculty:    form.faculty,
        department: form.department,
        password:   form.password,
      });
      navigate(form.role === "NUC_VISITOR" ? "/team" : "/dashboard", { replace:true });
    } catch (err) {
      if (err.data && typeof err.data === "object") {
        setErrors(err.data);
        // If email error, go back to step 1
        if (err.data.email) setStep(1);
      } else {
        setErrors({ general: err.message || "Registration failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const pwLen      = form.password.length;
  const pwStrength = pwLen === 0 ? 0 : pwLen < 6 ? 1 : pwLen < 10 ? 2 : pwLen < 14 ? 3 : 4;
  const pwColors   = ["#E2E8F0","#DC2626","#D97706","#059669","#059669"];
  const pwLabels   = ["","Weak","Fair","Good","Strong"];

  return (
    <div style={{
      display:"flex", minHeight:"100vh",
      fontFamily:"'Segoe UI', Arial, sans-serif",
      background:"#07162F",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:none; } }
        .r-input {
          display: block; width: 100%;
          padding: 10px 13px;
          border: 1.5px solid #CBD5E1;
          border-radius: 8px;
          font-size: 13px; color: #07162F;
          background: #fff;
          font-family: 'Segoe UI', Arial, sans-serif;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .r-input:focus {
          outline: none;
          border-color: #22D3EE;
          box-shadow: 0 0 0 3px rgba(34,211,238,0.15);
        }
        .r-input::placeholder { color: #94A3B8; }
        .r-input.error { border-color: #DC2626 !important; }
        .r-input:disabled { background: #F8FAFC; color: #94A3B8; cursor: not-allowed; }
        .r-label {
          display: block; font-size: 11px;
          font-family: monospace; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #374151; margin-bottom: 7px;
        }
        .r-err { font-size: 11px; color: #DC2626; font-weight: 500; margin-top: 4px; }
        .r-btn-pri {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 12px;
          background: linear-gradient(135deg, #07162F, #0C2D5E);
          color: #fff; border: none; border-radius: 8px;
          font-size: 13px; font-weight: 700; font-family: monospace;
          letter-spacing: 0.04em; cursor: pointer;
          transition: opacity 0.15s;
        }
        .r-btn-pri:hover:not(:disabled) { opacity: 0.88; }
        .r-btn-pri:disabled { opacity: 0.65; cursor: not-allowed; }
        .r-btn-sec {
          display: flex; align-items: center; justify-content: center;
          width: 100%; padding: 11px;
          background: #fff; color: #07162F;
          border: 1.5px solid #CBD5E1; border-radius: 8px;
          font-size: 13px; font-weight: 700; font-family: monospace;
          cursor: pointer; transition: background 0.15s;
        }
        .r-btn-sec:hover { background: #E2E8F0; }
        .r-btn-back {
          display: inline-flex; align-items: center;
          padding: 10px 18px;
          background: #fff; color: #374151;
          border: 1.5px solid #CBD5E1; border-radius: 8px;
          font-size: 12px; font-weight: 700; font-family: monospace;
          cursor: pointer; transition: background 0.15s;
        }
        .r-btn-back:hover { background: #E2E8F0; }
        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block; flex-shrink: 0;
        }
        .role-card {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px 14px; border-radius: 8px; cursor: pointer;
          border: 1.5px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          transition: all 0.12s; margin-bottom: 8px;
        }
        .role-card:hover { background: rgba(255,255,255,0.06); }
        .role-card.selected {
          background: rgba(34,211,238,0.08);
          border-color: rgba(34,211,238,0.35);
        }
        .step-circle {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; flex-shrink: 0;
          transition: all 0.2s;
        }
        .form-step { animation: slideIn 0.2s ease; }
        .error-box {
          display: flex; align-items: center; gap: 10px;
          background: #FEE2E2; border: 1px solid #FCA5A5;
          color: #DC2626; border-radius: 8px;
          padding: 12px 16px; font-size: 13px;
          font-weight: 500; margin-bottom: 18px;
          animation: fadeIn 0.2s ease;
        }
        .eye-btn {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          font-size: 17px; color: #94A3B8; padding: 4px;
          line-height: 1;
        }
        .eye-btn:hover { color: #64748B; }
      `}</style>

      {/* ── Left panel ── */}
      <div style={{
        flex:"0 0 44%", display:"flex",
        alignItems:"center", justifyContent:"center",
        padding:"48px 44px", position:"relative",
        overflow:"hidden",
      }}>
        <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.05,pointerEvents:"none" }}
          xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="rgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22D3EE" strokeWidth="0.8"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#rgrid)"/>
        </svg>

        <div style={{ maxWidth:380, width:"100%", position:"relative" }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:36 }}>
            <div style={{
              width:44, height:44, borderRadius:9, flexShrink:0,
              background:"rgba(34,211,238,0.1)",
              border:"1px solid rgba(34,211,238,0.25)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                <rect x="2"  y="2"  width="10" height="10" rx="2" fill="#22D3EE"/>
                <rect x="16" y="2"  width="10" height="10" rx="2" fill="rgba(34,211,238,0.45)"/>
                <rect x="2"  y="16" width="10" height="10" rx="2" fill="rgba(34,211,238,0.45)"/>
                <rect x="16" y="16" width="10" height="10" rx="2" fill="rgba(34,211,238,0.2)"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize:8, fontFamily:"monospace", letterSpacing:"0.14em",
                color:"#22D3EE", textTransform:"uppercase", marginBottom:3 }}>
                NUC · Accreditation
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>
                Accreditation Portal
              </div>
            </div>
          </div>

          <h1 style={{ fontSize:32, fontWeight:700, color:"#fff",
            lineHeight:1.2, margin:"0 0 12px", letterSpacing:"-0.02em" }}>
            Join the<br/>
            <span style={{ color:"#22D3EE" }}>Accreditation</span><br/>
            Network
          </h1>
          <p style={{ fontSize:13, color:"#64748B", lineHeight:1.7,
            margin:"0 0 32px" }}>
            Register to manage your department's NUC accreditation
            cycle from first application to full accreditation.
          </p>

          {/* Role cards */}
          <div>
            <div style={{ fontSize:9, fontFamily:"monospace", color:"rgba(255,255,255,0.3)",
              letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
              Select your role on the right →
            </div>
            {ROLES.map(r => (
              <div key={r.value}
                className={`role-card${form.role === r.value ? " selected" : ""}`}
                onClick={() => selectRole(r.value)}>
                <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>{r.icon}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, marginBottom:2,
                    color: form.role === r.value ? "#22D3EE" : "#CBD5E1" }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize:10, color:"#475569" }}>{r.desc}</div>
                </div>
              </div>
            ))}
            {errors.role && (
              <div style={{ fontSize:11, color:"#FCA5A5", marginTop:4 }}>
                ⚠ {errors.role}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        flex:1, display:"flex",
        alignItems:"flex-start", justifyContent:"center",
        padding:"48px 40px",
        background:"#F0F4F8",
        borderRadius:"24px 0 0 24px",
        overflowY:"auto",
      }}>
        <div style={{ width:"100%", maxWidth:440, paddingTop:8 }}>

          {/* Step indicator */}
          <div style={{ display:"flex", alignItems:"center",
            gap:0, marginBottom:28 }}>
            {[
              { n:1, label:"Personal Info" },
              { n:2, label:"Account Setup" },
            ].map((s, i) => (
              <div key={s.n} style={{ display:"flex", alignItems:"center",
                flex: i < 1 ? 1 : 0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div className="step-circle" style={{
                    background: step > s.n
                      ? "#059669"
                      : step === s.n
                      ? "#1D4ED8"
                      : "#E2E8F0",
                    color: step >= s.n ? "#fff" : "#9CA3AF",
                  }}>
                    {step > s.n ? "✓" : s.n}
                  </div>
                  <span style={{ fontSize:10, fontFamily:"monospace",
                    fontWeight:600, letterSpacing:"0.06em",
                    textTransform:"uppercase", whiteSpace:"nowrap",
                    color: step >= s.n ? "#07162F" : "#94A3B8" }}>
                    {s.label}
                  </span>
                </div>
                {i < 1 && (
                  <div style={{ flex:1, height:2, margin:"0 12px",
                    background: step > 1 ? "#059669" : "#E2E8F0",
                    transition:"background 0.3s" }}/>
                )}
              </div>
            ))}
          </div>

          <h2 style={{ fontSize:22, fontWeight:700, color:"#07162F",
            margin:"0 0 5px", letterSpacing:"-0.02em" }}>
            {step === 1 ? "Create your account" : "Secure your access"}
          </h2>
          <p style={{ fontSize:13, color:"#64748B", margin:"0 0 24px" }}>
            {step === 1
              ? "Enter your institutional details"
              : "Set a strong password to protect your account"}
          </p>

          {/* General error */}
          {errors.general && (
            <div className="error-box">
              <span>⚠</span>
              <span>{errors.general}</span>
            </div>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <form onSubmit={handleNext} noValidate className="form-step">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
                gap:14, marginBottom:14 }}>
                <div>
                  <label className="r-label">
                    First Name <span style={{ color:"#DC2626" }}>*</span>
                  </label>
                  <input className={`r-input${errors.first_name?" error":""}`}
                    type="text" value={form.first_name}
                    onChange={set("first_name")}
                    placeholder="Adaeze" autoFocus/>
                  {errors.first_name && <div className="r-err">{errors.first_name}</div>}
                </div>
                <div>
                  <label className="r-label">
                    Last Name <span style={{ color:"#DC2626" }}>*</span>
                  </label>
                  <input className={`r-input${errors.last_name?" error":""}`}
                    type="text" value={form.last_name}
                    onChange={set("last_name")}
                    placeholder="Okafor"/>
                  {errors.last_name && <div className="r-err">{errors.last_name}</div>}
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label className="r-label">
                  Institutional Email <span style={{ color:"#DC2626" }}>*</span>
                </label>
                <input className={`r-input${errors.email?" error":""}`}
                  type="email" value={form.email}
                  onChange={set("email")}
                  placeholder="a.okafor@university.edu.ng"
                  autoComplete="email"/>
                {errors.email && <div className="r-err">{errors.email}</div>}
              </div>

              <div style={{ marginBottom:14 }}>
                <label className="r-label">Phone Number</label>
                <input className="r-input"
                  type="tel" value={form.phone}
                  onChange={set("phone")}
                  placeholder="+234 800 000 0000"/>
              </div>

              <div style={{ marginBottom:14 }}>
                <label className="r-label">
                  University / Institution <span style={{ color:"#DC2626" }}>*</span>
                </label>
                <input className={`r-input${errors.university?" error":""}`}
                  type="text" value={form.university}
                  onChange={set("university")}
                  placeholder="University of Lagos"/>
                {errors.university && <div className="r-err">{errors.university}</div>}
              </div>

              <div style={{ marginBottom:22 }}>
                <label className="r-label">
                  Role <span style={{ color:"#DC2626" }}>*</span>
                </label>
                <select className={`r-input${errors.role?" error":""}`}
                  value={form.role}
                  onChange={e => { selectRole(e.target.value); }}
                  style={{ color: form.role ? "#07162F" : "#94A3B8" }}>
                  <option value="">Select your role…</option>
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.icon} {r.label}</option>
                  ))}
                </select>
                {errors.role && <div className="r-err">{errors.role}</div>}
              </div>

              <button type="submit" className="r-btn-pri">
                Continue →
              </button>
            </form>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} noValidate className="form-step">

              <div style={{ marginBottom:14 }}>
                <label className="r-label">
                  Staff / NUC ID <span style={{ color:"#DC2626" }}>*</span>
                </label>
                <input className={`r-input${errors.staff_id?" error":""}`}
                  type="text" value={form.staff_id}
                  onChange={set("staff_id")}
                  placeholder="UNILAG/2024/STA/001"
                  autoFocus/>
                {errors.staff_id && <div className="r-err">{errors.staff_id}</div>}
              </div>

              {form.role !== "NUC_VISITOR" && (
                <>
                  <div style={{ marginBottom:14 }}>
                    <label className="r-label">Faculty</label>
                    <select className="r-input" value={form.faculty}
                      onChange={set("faculty")}
                      style={{ color: form.faculty ? "#07162F" : "#94A3B8" }}>
                      <option value="">Select faculty…</option>
                      {FACULTIES.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label className="r-label">Department</label>
                    <input className="r-input"
                      type="text" value={form.department}
                      onChange={set("department")}
                      placeholder="e.g. Computer Science"/>
                  </div>
                </>
              )}

              {/* Password */}
              <div style={{ marginBottom:14 }}>
                <label className="r-label">
                  Password <span style={{ color:"#DC2626" }}>*</span>
                </label>
                <div style={{ position:"relative" }}>
                  <input className={`r-input${errors.password?" error":""}`}
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder="Minimum 8 characters"
                    style={{ paddingRight:48 }}/>
                  <button type="button" className="eye-btn"
                    onClick={() => setShowPw(v => !v)}>
                    {showPw ? "🙈" : "👁"}
                  </button>
                </div>
                {errors.password && <div className="r-err">{errors.password}</div>}
                {/* Strength meter */}
                {form.password.length > 0 && (
                  <div style={{ marginTop:8, display:"flex",
                    alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, display:"flex", gap:3 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          flex:1, height:3, borderRadius:2,
                          background: i <= pwStrength
                            ? pwColors[pwStrength]
                            : "#E2E8F0",
                          transition:"background 0.2s",
                        }}/>
                      ))}
                    </div>
                    <span style={{ fontSize:10, fontFamily:"monospace",
                      color: pwColors[pwStrength], fontWeight:700,
                      minWidth:36 }}>
                      {pwLabels[pwStrength]}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div style={{ marginBottom:18 }}>
                <label className="r-label">
                  Confirm Password <span style={{ color:"#DC2626" }}>*</span>
                </label>
                <div style={{ position:"relative" }}>
                  <input className={`r-input${errors.confirm_password?" error":""}`}
                    type={showCPw ? "text" : "password"}
                    value={form.confirm_password}
                    onChange={set("confirm_password")}
                    placeholder="Re-enter your password"
                    style={{ paddingRight:48 }}/>
                  <button type="button" className="eye-btn"
                    onClick={() => setShowCPw(v => !v)}>
                    {showCPw ? "🙈" : "👁"}
                  </button>
                </div>
                {errors.confirm_password && (
                  <div className="r-err">{errors.confirm_password}</div>
                )}
              </div>

              <div style={{ padding:"11px 14px", background:"#F8FAFC",
                border:"1px solid #E2E8F0", borderRadius:8,
                fontSize:11, color:"#94A3B8", lineHeight:1.6,
                marginBottom:20 }}>
                By registering, you agree to the NUC data handling policy
                and confirm all information provided is accurate.
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button type="button" className="r-btn-back"
                  onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  className="r-btn-pri" style={{ flex:1 }}>
                  {loading && <span className="spinner"/>}
                  {loading ? "Creating account…" : "Create Account →"}
                </button>
              </div>
            </form>
          )}

          {/* Divider + login link */}
          <div style={{ display:"flex", alignItems:"center",
            gap:12, margin:"22px 0 14px" }}>
            <span style={{ flex:1, height:1, background:"#E2E8F0" }}/>
            <span style={{ fontSize:11, color:"#94A3B8",
              fontFamily:"monospace", whiteSpace:"nowrap" }}>
              Already registered?
            </span>
            <span style={{ flex:1, height:1, background:"#E2E8F0" }}/>
          </div>

          <Link to="/login" style={{ textDecoration:"none", display:"block" }}>
            <button type="button" className="r-btn-sec">
              Sign In to Your Account
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}