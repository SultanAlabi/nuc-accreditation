// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";

export default function Login() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState(1); // 1 = Request Code, 2 = Verify & Reset
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotDebugCode, setForgotDebugCode] = useState("");

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email address.");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess("");
    setForgotDebugCode("");
    try {
      const res = await authAPI.forgotPassword({ email: forgotEmail.trim() });
      setForgotSuccess(res.data.message || "Verification code sent!");
      if (res.data.debug_code) {
        setForgotDebugCode(res.data.debug_code);
      }
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.error || "Failed to send reset code. Please verify your email.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setForgotError("Please enter the 6-digit verification code.");
      return;
    }
    if (!newPassword) {
      setForgotError("Please enter your new password.");
      return;
    }
    if (newPassword.length < 8) {
      setForgotError("Password must be at least 8 characters long.");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    try {
      const res = await authAPI.resetPassword({
        email: forgotEmail.trim(),
        code: verificationCode.trim(),
        new_password: newPassword,
      });
      setForgotSuccess(res.data.message || "Password reset successfully!");
      setForgotStep(3);
      
      setTimeout(() => {
        setShowForgotModal(false);
        setEmail(forgotEmail.trim());
      }, 2000);
    } catch (err) {
      setForgotError(err.response?.data?.error || "Invalid or expired code. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!password)     { setError("Please enter your password."); return; }
    setLoading(true);
    setError("");
    try {
      const user = await login({ email: email.trim(), password });
      navigate(user.role === "NUC_VISITOR" ? "/team" : "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display:"flex", minHeight:"100vh",
      fontFamily:"'Segoe UI', Arial, sans-serif",
      background:"#07162F",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        .l-input {
          display: block;
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #CBD5E1;
          border-radius: 8px;
          font-size: 14px;
          color: #07162F;
          background: #fff;
          font-family: 'Segoe UI', Arial, sans-serif;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .l-input:focus {
          outline: none;
          border-color: #22D3EE;
          box-shadow: 0 0 0 3px rgba(34,211,238,0.15);
        }
        .l-input::placeholder { color: #94A3B8; }
        .l-input.error { border-color: #DC2626; }
        .l-btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #07162F, #0C2D5E);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          font-family: monospace;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .l-btn-primary:hover:not(:disabled) { opacity: 0.88; }
        .l-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
        .l-btn-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 12px;
          background: #fff;
          color: #07162F;
          border: 1.5px solid #CBD5E1;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          font-family: monospace;
          cursor: pointer;
          transition: background 0.15s;
        }
        .l-btn-secondary:hover { background: #E2E8F0; }
        .l-label {
          display: block;
          font-size: 11px;
          font-family: monospace;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #374151;
          margin-bottom: 8px;
        }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
          flex-shrink: 0;
        }
        .eye-btn {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; font-size: 18px;
          color: #94A3B8; padding: 4px;
          line-height: 1; display: flex; align-items: center;
        }
        .eye-btn:hover { color: #64748B; }
        .step-item { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
        .step-num {
          font-family: monospace; font-size: 11px;
          font-weight: 700; color: #22D3EE; min-width: 24px;
        }
        .step-label { font-size: 13px; color: #64748B; }
        .role-chip {
          font-size: 9px; font-family: monospace; font-weight: 700;
          color: #0C2D5E; background: #DBEAFE;
          border: 1px solid #BFDBFE;
          padding: 2px 8px; border-radius: 3px;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .divider-line { flex: 1; height: 1px; background: #E2E8F0; }
        .divider-text {
          font-size: 11px; color: #94A3B8;
          font-family: monospace; white-space: nowrap;
        }
        .error-box {
          display: flex; align-items: center; gap: 10px;
          background: #FEE2E2; border: 1px solid #FCA5A5;
          color: #DC2626; border-radius: 8px;
          padding: 12px 16px; font-size: 13px;
          font-weight: 500; margin-bottom: 22px;
          animation: fadeIn 0.2s ease;
        }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(7, 22, 47, 0.75);
          backdrop-filter: blur(8px); display: flex; align-items: center;
          justify-content: center; z-index: 1000; animation: fadeIn 0.2s ease-out;
        }
        .modal-card {
          background: #fff; width: 100%; max-width: 440px;
          border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          border: 1px solid #E2E8F0; padding: 32px; animation: fadeIn 0.25s ease-out;
          position: relative;
        }
        .modal-close {
          position: absolute; right: 20px; top: 20px;
          background: none; border: none; font-size: 20px; cursor: pointer;
          color: #94A3B8; transition: color 0.15s;
        }
        .modal-close:hover { color: #64748B; }
        .success-box {
          display: flex; align-items: center; gap: 10px;
          background: #ECFDF5; border: 1px solid #A7F3D0;
          color: #059669; border-radius: 8px;
          padding: 12px 16px; font-size: 13px;
          font-weight: 500; margin-bottom: 22px;
          animation: fadeIn 0.2s ease;
        }
        .debug-box {
          background: #EFF6FF; border: 1px dashed #3B82F6;
          color: #1D4ED8; border-radius: 8px; padding: 12px;
          font-size: 12px; margin-bottom: 20px; font-family: monospace;
          line-height: 1.5;
        }
      `}</style>

      {/* ── Left panel ── */}
      <div style={{
        flex:"0 0 50%", display:"flex",
        alignItems:"center", justifyContent:"center",
        padding:"48px 52px", position:"relative", overflow:"hidden",
      }}>
        {/* Subtle grid pattern */}
        <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.05,pointerEvents:"none" }}
          xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="lgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22D3EE" strokeWidth="0.8"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lgrid)"/>
        </svg>

        <div style={{ maxWidth:440, width:"100%", position:"relative" }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:44 }}>
            <div style={{
              width:46, height:46, borderRadius:10, flexShrink:0,
              background:"rgba(34,211,238,0.1)",
              border:"1px solid rgba(34,211,238,0.25)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <rect x="2"  y="2"  width="10" height="10" rx="2" fill="#22D3EE"/>
                <rect x="16" y="2"  width="10" height="10" rx="2" fill="rgba(34,211,238,0.45)"/>
                <rect x="2"  y="16" width="10" height="10" rx="2" fill="rgba(34,211,238,0.45)"/>
                <rect x="16" y="16" width="10" height="10" rx="2" fill="rgba(34,211,238,0.2)"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize:8, fontFamily:"monospace", letterSpacing:"0.14em",
                color:"#22D3EE", textTransform:"uppercase", marginBottom:3 }}>
                National Universities Commission
              </div>
              <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>
                Accreditation Portal
              </div>
            </div>
          </div>

          {/* Hero */}
          <h1 style={{ fontSize:36, fontWeight:700, color:"#fff",
            lineHeight:1.2, margin:"0 0 16px", letterSpacing:"-0.02em" }}>
            Course Accreditation<br/>
            <span style={{ color:"#22D3EE" }}>Management System</span>
          </h1>
          <p style={{ fontSize:14, color:"#64748B", lineHeight:1.7,
            margin:"0 0 40px", maxWidth:380 }}>
            Track milestones, manage evidence lockers, and ensure your
            programmes meet NUC standards — from application to full accreditation.
          </p>

          {/* Workflow steps */}
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:24 }}>
            {[
              ["01","Application & Approval"],
              ["02","Resource Visit — Year 3"],
              ["03","Full Accreditation — Year 5"],
              ["04","Re-accreditation — Every 5 Years"],
            ].map(([n,label]) => (
              <div key={n} className="step-item">
                <span className="step-num">{n}</span>
                <span className="step-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        flex:1, display:"flex",
        alignItems:"center", justifyContent:"center",
        padding:"48px 40px",
        background:"#F0F4F8",
        borderRadius:"24px 0 0 24px",
        overflowY:"auto",
      }}>
        <div style={{ width:"100%", maxWidth:420 }}>

          <h2 style={{ fontSize:26, fontWeight:700, color:"#07162F",
            margin:"0 0 6px", letterSpacing:"-0.02em" }}>
            Welcome back
          </h2>
          <p style={{ fontSize:13, color:"#64748B", margin:"0 0 28px" }}>
            Sign in to your account to continue
          </p>

          {/* Error */}
          {error && (
            <div className="error-box">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div style={{ marginBottom:18 }}>
              <label className="l-label">Email Address</label>
              <input
                className={`l-input${error ? " error" : ""}`}
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                placeholder="you@university.edu.ng"
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom:8 }}>
                <label className="l-label" style={{ marginBottom:0 }}>Password</label>
                <button type="button"
                  onClick={() => {
                    setForgotEmail("");
                    setVerificationCode("");
                    setNewPassword("");
                    setForgotStep(1);
                    setForgotError("");
                    setForgotSuccess("");
                    setForgotDebugCode("");
                    setShowForgotModal(true);
                  }}
                  style={{ background:"none", border:"none", cursor:"pointer",
                    fontSize:12, color:"#2563EB", fontWeight:600,
                    padding:0, fontFamily:"inherit" }}>
                  Forgot password?
                </button>
              </div>
              <div style={{ position:"relative" }}>
                <input
                  className={`l-input${error ? " error" : ""}`}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight:48 }}
                />
                <button type="button" className="eye-btn"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Role info strip */}
            <div style={{
              display:"flex", alignItems:"center", gap:8, flexWrap:"wrap",
              padding:"10px 14px", background:"#F8FAFC",
              border:"1px solid #E2E8F0", borderRadius:8, marginBottom:22,
            }}>
              <span style={{ fontSize:10, fontFamily:"monospace",
                color:"#94A3B8", textTransform:"uppercase",
                letterSpacing:"0.08em", flexShrink:0 }}>
                Roles
              </span>
              {["HOD","APU Officer","NUC Visitor"].map(r => (
                <span key={r} className="role-chip">{r}</span>
              ))}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="l-btn-primary"
              style={{ marginBottom:24 }}>
              {loading && <span className="spinner"/>}
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display:"flex", alignItems:"center",
            gap:12, marginBottom:16 }}>
            <span className="divider-line"/>
            <span className="divider-text">New to the system?</span>
            <span className="divider-line"/>
          </div>

          <Link to="/register" style={{ textDecoration:"none",
            display:"block", marginBottom:20 }}>
            <button type="button" className="l-btn-secondary">
              Create an Account
            </button>
          </Link>

          <p style={{ fontSize:11, color:"#94A3B8",
            textAlign:"center", lineHeight:1.6, margin:0 }}>
            For access issues, contact your Academic Planning Unit
            or the NUC ICT Helpdesk.
          </p>
        </div>
      </div>

      {/* ── Forgot Password Modal Overlay ── */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowForgotModal(false)} aria-label="Close modal">
              ×
            </button>

            <h3 style={{ fontSize:20, fontWeight:700, color:"#07162F", margin:"0 0 8px" }}>
              Account Recovery
            </h3>
            <p style={{ fontSize:13, color:"#64748B", margin:"0 0 24px", lineHeight:1.5 }}>
              {forgotStep === 1 && "Enter the email associated with your account to receive a 6-digit recovery verification code."}
              {forgotStep === 2 && "Enter the 6-digit verification code and choose your new account password."}
              {forgotStep === 3 && "Recovery complete!"}
            </p>

            {forgotError && (
              <div className="error-box" style={{ marginBottom: 16 }}>
                <span>⚠</span>
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="success-box" style={{ marginBottom: 16 }}>
                <span>✓</span>
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotDebugCode && (
              <div className="debug-box">
                <strong>🔑 Development Mode Helper:</strong><br />
                The system generated code: <strong>{forgotDebugCode}</strong>. Use this code to complete verification without checking console logs.
              </div>
            )}

            {forgotStep === 1 && (
              <form onSubmit={handleRequestCode}>
                <div style={{ marginBottom: 20 }}>
                  <label className="l-label">Email Address</label>
                  <input
                    className="l-input"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={e => { setForgotEmail(e.target.value); setForgotError(""); }}
                    placeholder="you@university.edu.ng"
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={forgotLoading} className="l-btn-primary">
                  {forgotLoading && <span className="spinner" />}
                  {forgotLoading ? "Requesting..." : "Send Verification Code →"}
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: 16 }}>
                  <label className="l-label">6-Digit Verification Code</label>
                  <input
                    className="l-input"
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={e => { setVerificationCode(e.target.value); setForgotError(""); }}
                    placeholder="123456"
                    style={{ letterSpacing: "0.2em", textAlign: "center", fontSize: "16px", fontWeight: "bold" }}
                    autoFocus
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="l-label">New Password</label>
                  <input
                    className="l-input"
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setForgotError(""); }}
                    placeholder="••••••••"
                  />
                </div>

                <button type="submit" disabled={forgotLoading} className="l-btn-primary">
                  {forgotLoading && <span className="spinner" />}
                  {forgotLoading ? "Resetting..." : "Reset Password & Log In →"}
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎉</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#059669" }}>
                  Your password has been updated!
                </div>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
                  Returning to the login screen...
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}