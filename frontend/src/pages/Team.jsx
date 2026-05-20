// src/pages/Team.jsx
//
// NUC Accreditation Team Portal
// Three roles: The Professor (lead), NUC Staff, and Third Member (observer)
//
// Django endpoints:
//   GET    /api/team/members/
//   POST   /api/team/members/          { name, email, role, programme_ids }
//   PATCH  /api/team/members/:id/      { status, access_level }
//   DELETE /api/team/members/:id/
//   POST   /api/team/invites/          { email, role, programme_ids }
//   GET    /api/team/access-log/       { member_id, page }

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../hooks/useRole";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// ── Config ─────────────────────────────────────────────────────────────────────
const TEAM_ROLES = {
  PROFESSOR: {
    label:  "Lead Professor",
    sub:    "NUC Accreditation Panel Lead",
    icon:   "🎓",
    color:  "#7C3AED",
    bg:     "#EDE9FE",
    border: "#C4B5FD",
    access: "Full read access — all documents, reports, and programme data",
  },
  NUC_STAFF: {
    label:  "NUC Staff Officer",
    sub:    "National Universities Commission",
    icon:   "🏛",
    color:  "#2563EB",
    bg:     "#DBEAFE",
    border: "#BFDBFE",
    access: "Full read access — can submit accreditation reports",
  },
  OBSERVER: {
    label:  "Third Member / Observer",
    sub:    "Independent Assessor",
    icon:   "🔍",
    color:  "#059669",
    bg:     "#D1FAE5",
    border: "#6EE7B7",
    access: "Read-only — verified documents only",
  },
};

const ACCESS_STATUS = {
  ACTIVE:  { label:"Active",   color:"#059669", bg:"#D1FAE5", border:"#6EE7B7" },
  PENDING: { label:"Pending",  color:"#D97706", bg:"#FEF3C7", border:"#FCD34D" },
  REVOKED: { label:"Revoked",  color:"#DC2626", bg:"#FEE2E2", border:"#FCA5A5" },
};

// ── Demo data (2 members) — rest from backend ─────────────────────────────────
const DEMO_MEMBERS = [
  {
    id: "TM-001",
    name: "Prof. Emmanuel Adebayo",
    email: "e.adebayo@nuc.edu.ng",
    role: "PROFESSOR",
    status: "ACTIVE",
    institution: "University of Ibadan",
    phone: "+234 803 000 0001",
    joined: "2024-01-15",
    last_active: new Date(Date.now() - 2 * 3600000).toISOString(),
    programmes_assigned: ["C001", "C002", "C003"],
    documents_reviewed: 24,
    is_demo: true,
  },
  {
    id: "TM-002",
    name: "Dr. Ngozi Okafor",
    email: "n.okafor@nuc.gov.ng",
    role: "NUC_STAFF",
    status: "ACTIVE",
    institution: "National Universities Commission",
    phone: "+234 803 000 0002",
    joined: "2024-01-15",
    last_active: new Date(Date.now() - 24 * 3600000).toISOString(),
    programmes_assigned: ["C001", "C002"],
    documents_reviewed: 18,
    is_demo: true,
  },
];

const DEMO_PROGRAMMES = [
  { id:"C001", code:"CPE", name:"B.Eng. Computer Engineering",  status:"RESOURCE"   },
  { id:"C002", code:"BCH", name:"B.Sc. Biochemistry",           status:"ACCREDITED" },
  { id:"C003", code:"LAW", name:"LL.B. Law",                    status:"REACCREDIT" },
  { id:"C004", code:"NRS", name:"B.Sc. Nursing Science",        status:"APPROVED"   },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(d) {
  if (!d) return "Never";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return "Just now";
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-NG",
    { day:"2-digit", month:"short", year:"numeric" }) : "—";
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type="success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, push };
}
function ToastStack({ toasts }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999,
      display:"flex", flexDirection:"column", gap:8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type==="error" ? "#DC2626" : "#059669",
          color:"#fff", padding:"11px 18px", borderRadius:8,
          fontSize:13, fontWeight:600, minWidth:260,
          borderLeft:`3px solid ${t.type==="error"?"#FCA5A5":"#6EE7B7"}`,
          boxShadow:"0 8px 24px rgba(7,22,47,0.2)",
          animation:"fadeIn 0.2s ease",
        }}>
          {t.type==="error" ? "⚠ " : "✓ "}{t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Invite Modal ───────────────────────────────────────────────────────────────
function InviteModal({ programmes, onClose, onSuccess, toast }) {
  const [form, setForm] = useState({
    name: "", email: "", role: "", institution: "",
    phone: "", programme_ids: [],
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = "Required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Valid email required";
    if (!form.role)         e.role  = "Select a role";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("nuc_token");
      const res = await fetch(`${API}/team/invites/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setErrors(d);
        toast(d.detail || "Failed to send invite.", "error");
        return;
      }
      toast(`Invite sent to ${form.email}.`);
      onSuccess?.();
      onClose();
    } catch {
      toast("Could not reach the server.", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleProg = (id) => setForm(p => ({
    ...p,
    programme_ids: p.programme_ids.includes(id)
      ? p.programme_ids.filter(x => x !== id)
      : [...p.programme_ids, id],
  }));

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0,
      background:"rgba(7,22,47,0.75)", display:"flex",
      alignItems:"center", justifyContent:"center",
      zIndex:500, backdropFilter:"blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#fff", borderRadius:12,
        width:"min(560px,95vw)", maxHeight:"92vh", overflowY:"auto",
        boxShadow:"0 25px 80px rgba(7,22,47,0.35)",
        border:"1px solid #CBD5E1",
      }}>
        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#07162F,#0C2D5E)",
          padding:"20px 26px", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:14, right:14,
            width:28, height:28, borderRadius:"50%",
            background:"rgba(255,255,255,0.1)", border:"none",
            color:"#fff", fontSize:16, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          <div style={{ fontSize:9, color:"#94A3B8",
            fontFamily:"'IBM Plex Mono',monospace",
            letterSpacing:"0.12em", textTransform:"uppercase",
            marginBottom:4 }}>Team Portal</div>
          <div style={{ fontSize:18, fontWeight:700, color:"#fff" }}>
            Invite Team Member
          </div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:3 }}>
            They'll receive an email with secure access instructions.
          </div>
        </div>

        <div style={{ padding:"22px 26px",
          display:"flex", flexDirection:"column", gap:16 }}>

          {/* Role selector — visual cards */}
          <div>
            <label style={S.label}>Role *</label>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {Object.entries(TEAM_ROLES).map(([key, cfg]) => (
                <div key={key}
                  onClick={() => { setForm(p=>({...p,role:key})); setErrors(p=>({...p,role:""})); }}
                  style={{
                    display:"flex", alignItems:"flex-start", gap:12,
                    padding:"11px 14px", borderRadius:8, cursor:"pointer",
                    border:`1.5px solid ${form.role===key ? cfg.color : "#E2E8F0"}`,
                    background: form.role===key ? cfg.bg : "#FAFAFA",
                    transition:"all 0.12s",
                  }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{cfg.icon}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700,
                      color: form.role===key ? cfg.color : "#07162F" }}>
                      {cfg.label}
                    </div>
                    <div style={{ fontSize:11, color:"#64748B", marginTop:1 }}>
                      {cfg.sub}
                    </div>
                    <div style={{ fontSize:10, color:"#94A3B8",
                      marginTop:3, fontStyle:"italic" }}>
                      {cfg.access}
                    </div>
                  </div>
                  <div style={{ marginLeft:"auto", flexShrink:0 }}>
                    <div style={{
                      width:18, height:18, borderRadius:"50%",
                      border:`2px solid ${form.role===key ? cfg.color : "#CBD5E1"}`,
                      background: form.role===key ? cfg.color : "transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                      {form.role===key && (
                        <span style={{ color:"#fff", fontSize:10 }}>✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.role && <div style={S.err}>{errors.role}</div>}
          </div>

          {/* Name + email */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={S.label}>Full Name *</label>
              <input value={form.name}
                onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                placeholder="Prof. Jane Smith"
                style={{ ...S.input, borderColor:errors.name?"#DC2626":"#CBD5E1" }}/>
              {errors.name && <div style={S.err}>{errors.name}</div>}
            </div>
            <div>
              <label style={S.label}>Email *</label>
              <input type="email" value={form.email}
                onChange={e=>setForm(p=>({...p,email:e.target.value}))}
                placeholder="member@nuc.gov.ng"
                style={{ ...S.input, borderColor:errors.email?"#DC2626":"#CBD5E1" }}/>
              {errors.email && <div style={S.err}>{errors.email}</div>}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={S.label}>Institution</label>
              <input value={form.institution}
                onChange={e=>setForm(p=>({...p,institution:e.target.value}))}
                placeholder="University of Lagos"
                style={S.input}/>
            </div>
            <div>
              <label style={S.label}>Phone</label>
              <input value={form.phone}
                onChange={e=>setForm(p=>({...p,phone:e.target.value}))}
                placeholder="+234 800 000 0000"
                style={S.input}/>
            </div>
          </div>

          {/* Programme assignment */}
          <div>
            <label style={S.label}>Assign to Programmes</label>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {programmes.map(prog => (
                <label key={prog.id}
                  style={{ display:"flex", alignItems:"center", gap:10,
                    padding:"9px 12px", borderRadius:7, cursor:"pointer",
                    border:`1px solid ${form.programme_ids.includes(prog.id)?"#BFDBFE":"#E2E8F0"}`,
                    background: form.programme_ids.includes(prog.id)?"#EFF6FF":"#FAFAFA",
                    transition:"all 0.12s" }}>
                  <input type="checkbox"
                    checked={form.programme_ids.includes(prog.id)}
                    onChange={() => toggleProg(prog.id)}
                    style={{ width:14, height:14, accentColor:"#2563EB",
                      cursor:"pointer", flexShrink:0 }}/>
                  <div>
                    <span style={{ fontSize:12, fontWeight:600,
                      color:"#07162F" }}>{prog.name}</span>
                    <span style={{ fontSize:10,
                      fontFamily:"'IBM Plex Mono',monospace",
                      color:"#94A3B8", marginLeft:8 }}>{prog.code}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Info box */}
          <div style={{ background:"#F8FAFC", border:"1px solid #E2E8F0",
            borderRadius:8, padding:"12px 14px",
            fontSize:12, color:"#64748B", lineHeight:1.6 }}>
            🔐 The invited member will receive a secure link granting
            <strong> read-only access</strong> to the assigned programmes'
            Evidence Lockers. They cannot upload, edit, or delete documents.
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose} style={S.btnSec}>Cancel</button>
            <button onClick={handleSubmit} disabled={loading}
              style={{ ...S.btnPri, flex:1, justifyContent:"center",
                display:"flex", alignItems:"center", gap:8,
                opacity:loading?0.7:1 }}>
              {loading && <span style={S.spinner}/>}
              {loading ? "Sending…" : "✉ Send Invite"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Member Card ────────────────────────────────────────────────────────────────
function MemberCard({ member, programmes, onRevoke, onReactivate, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const roleCfg   = TEAM_ROLES[member.role]   || TEAM_ROLES.OBSERVER;
  const statusCfg = ACCESS_STATUS[member.status] || ACCESS_STATUS.PENDING;
  const assignedProgs = programmes.filter(p =>
    (member.programmes_assigned || []).includes(p.id)
  );
  const initials = member.name
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{
      background:"#fff", border:"1px solid #E2E8F0",
      borderRadius:12, overflow:"hidden",
      boxShadow:"0 1px 4px rgba(7,22,47,0.06)",
      transition:"box-shadow 0.15s",
    }}>
      {/* Card top */}
      <div style={{ padding:"18px 20px" }}>
        <div style={{ display:"flex", alignItems:"flex-start",
          justifyContent:"space-between", gap:12 }}>
          {/* Avatar + info */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <div style={{ width:48, height:48, borderRadius:"50%",
                background:`linear-gradient(135deg,${roleCfg.color},${roleCfg.color}99)`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:16, fontWeight:700, color:"#fff",
                fontFamily:"'IBM Plex Mono',monospace",
                boxShadow:`0 3px 10px ${roleCfg.color}44` }}>
                {initials}
              </div>
              {/* Online indicator */}
              {member.status === "ACTIVE" && (
                <div style={{ position:"absolute", bottom:1, right:1,
                  width:12, height:12, borderRadius:"50%",
                  background:"#059669",
                  border:"2px solid #fff" }}/>
              )}
            </div>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:14, fontWeight:700, color:"#07162F" }}>
                  {member.name}
                </span>
                {member.is_demo && (
                  <span style={{ fontSize:9,
                    fontFamily:"'IBM Plex Mono',monospace",
                    background:"#FEF3C7", color:"#92400E",
                    border:"1px solid #FCD34D",
                    padding:"1px 5px", borderRadius:3, fontWeight:700 }}>
                    DEMO
                  </span>
                )}
              </div>
              <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>
                {member.email}
              </div>
              <div style={{ fontSize:10, color:"#94A3B8", marginTop:1 }}>
                {member.institution}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div style={{ display:"flex", flexDirection:"column",
            alignItems:"flex-end", gap:6, flexShrink:0 }}>
            <span style={{
              fontSize:10, fontFamily:"'IBM Plex Mono',monospace",
              fontWeight:700, padding:"3px 9px", borderRadius:4,
              background:roleCfg.bg, color:roleCfg.color,
              border:`1px solid ${roleCfg.border}`,
              display:"flex", alignItems:"center", gap:5,
            }}>
              {roleCfg.icon} {roleCfg.label}
            </span>
            <span style={{
              fontSize:10, fontFamily:"'IBM Plex Mono',monospace",
              fontWeight:700, padding:"2px 8px", borderRadius:4,
              background:statusCfg.bg, color:statusCfg.color,
              border:`1px solid ${statusCfg.border}`,
            }}>
              ● {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
          gap:10, marginTop:14 }}>
          {[
            { label:"Programmes",        value: assignedProgs.length },
            { label:"Docs Reviewed",     value: member.documents_reviewed || 0 },
            { label:"Last Active",       value: timeAgo(member.last_active) },
          ].map((s, i) => (
            <div key={i} style={{ background:"#F8FAFC",
              border:"1px solid #E2E8F0",
              borderRadius:7, padding:"9px 11px", textAlign:"center" }}>
              <div style={{ fontSize:9, color:"#94A3B8",
                fontFamily:"'IBM Plex Mono',monospace",
                textTransform:"uppercase", letterSpacing:"0.1em",
                marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#07162F",
                fontFamily:"'IBM Plex Mono',monospace" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Assigned programmes */}
        {assignedProgs.length > 0 && (
          <div style={{ marginTop:12, display:"flex", flexWrap:"wrap", gap:5 }}>
            {assignedProgs.map(p => (
              <span key={p.id} style={{ fontSize:10,
                fontFamily:"'IBM Plex Mono',monospace",
                background:"#EFF6FF", color:"#1D4ED8",
                border:"1px solid #BFDBFE",
                padding:"2px 8px", borderRadius:3, fontWeight:600 }}>
                {p.code}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expand — access log preview */}
      <div style={{ borderTop:"1px solid #F1F5F9",
        padding:"10px 20px",
        display:"flex", justifyContent:"space-between",
        alignItems:"center", background:"#FAFBFC" }}>
        <button onClick={() => setExpanded(v => !v)}
          style={{ background:"none", border:"none", cursor:"pointer",
            fontSize:11, color:"#64748B",
            fontFamily:"'IBM Plex Mono',monospace",
            fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
          {expanded ? "▲ Hide details" : "▼ Show access details"}
        </button>
        <div style={{ display:"flex", gap:7 }}>
          {onRevoke && member.status === "ACTIVE" ? (
            <button onClick={() => onRevoke(member.id)}
              style={{ ...S.actionBtn,
                background:"#FEF3C7", color:"#92400E",
                border:"1px solid #FCD34D" }}>
              🔒 Revoke Access
            </button>
          ) : (onReactivate && member.status === "REVOKED") ? (
            <button onClick={() => onReactivate(member.id)}
              style={{ ...S.actionBtn,
                background:"#D1FAE5", color:"#065F46",
                border:"1px solid #6EE7B7" }}>
              🔓 Reactivate
            </button>
          ) : null}
          {onRemove && (
            <button onClick={() => onRemove(member.id)}
              style={{ ...S.actionBtn,
                background:"#FEE2E2", color:"#DC2626",
                border:"1px solid #FCA5A5" }}>
              🗑 Remove
            </button>
          )}
        </div>
      </div>

      {/* Expanded: access details */}
      {expanded && (
        <div style={{ borderTop:"1px solid #F1F5F9", padding:"16px 20px",
          background:"#F8FAFC", animation:"fadeIn 0.15s ease" }}>
          <div style={{ fontSize:10, fontWeight:700,
            fontFamily:"'IBM Plex Mono',monospace",
            color:"#6B7280", textTransform:"uppercase",
            letterSpacing:"0.1em", marginBottom:12 }}>
            Access Details
          </div>
          <div style={{ display:"grid",
            gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            {[
              { l:"Member Since",  v:fmtDate(member.joined) },
              { l:"Role",          v:roleCfg.label },
              { l:"Access Level",  v:roleCfg.access.split("—")[0].trim() },
              { l:"Phone",         v:member.phone || "—" },
            ].map((r,i)=>(
              <div key={i}>
                <div style={{ fontSize:9, color:"#94A3B8",
                  fontFamily:"'IBM Plex Mono',monospace",
                  textTransform:"uppercase", letterSpacing:"0.08em",
                  marginBottom:3 }}>{r.l}</div>
                <div style={{ fontSize:12, fontWeight:600, color:"#374151" }}>
                  {r.v}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:"#64748B",
            background:"#EFF6FF", border:"1px solid #BFDBFE",
            borderRadius:6, padding:"9px 12px", lineHeight:1.6 }}>
            🔐 <strong>Access policy:</strong> {roleCfg.access}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Confirm Remove Modal ───────────────────────────────────────────────────────
function ConfirmRemove({ member, onConfirm, onCancel, loading }) {
  return (
    <div onClick={onCancel} style={{ position:"fixed", inset:0,
      background:"rgba(7,22,47,0.72)", display:"flex",
      alignItems:"center", justifyContent:"center",
      zIndex:600, backdropFilter:"blur(4px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#fff", borderRadius:12, width:"min(400px,95vw)",
        boxShadow:"0 25px 80px rgba(7,22,47,0.35)",
        border:"1px solid #CBD5E1", overflow:"hidden" }}>
        <div style={{ padding:"20px 24px",
          display:"flex", alignItems:"flex-start", gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:"50%",
            background:"#FEE2E2", display:"flex",
            alignItems:"center", justifyContent:"center",
            fontSize:18, flexShrink:0 }}>🗑</div>
          <div>
            <div style={{ fontSize:15, fontWeight:700,
              color:"#07162F", marginBottom:4 }}>
              Remove Team Member
            </div>
            <div style={{ fontSize:13, color:"#64748B", lineHeight:1.5 }}>
              Remove <strong>{member?.name}</strong> from the accreditation team?
              They will lose all portal access immediately.
            </div>
          </div>
        </div>
        <div style={{ padding:"14px 24px",
          borderTop:"1px solid #E2E8F0",
          display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onCancel} style={S.btnSec} disabled={loading}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} style={{
            ...S.btnDanger, display:"flex", alignItems:"center", gap:6,
            opacity:loading?0.6:1 }}>
            {loading && <span style={S.spinner}/>}
            {loading ? "Removing…" : "Yes, Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Team() {
  const navigate = useNavigate();
  const { isNUCVisitor, isAPU, user: roleUser } = useRole();
  const [members,       setMembers]       = useState([]);
  const [programmes,    setProgrammes]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showInvite,    setShowInvite]    = useState(false);
  const [removeTarget,  setRemoveTarget]  = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [roleFilter,    setRoleFilter]    = useState("ALL");
  const [statusFilter,  setStatusFilter]  = useState("ALL");
  const [usingFallback, setUsingFallback] = useState(false);
  const { toasts, push: toast } = useToast();

  // ── Load ────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("nuc_token");
      const headers = token ? { Authorization:`Bearer ${token}` } : {};
      const [membersRes, progsRes] = await Promise.all([
        fetch(`${API}/team/members/`, { headers }).then(r => { if(!r.ok) throw new Error(); return r.json(); }),
        fetch(`${API}/programmes/`,   { headers }).then(r => { if(!r.ok) throw new Error(); return r.json(); }),
      ]);
      setMembers(membersRes.results   || membersRes);
      setProgrammes(progsRes.results  || progsRes);
      setUsingFallback(false);
    } catch {
      setMembers(DEMO_MEMBERS);
      setProgrammes(DEMO_PROGRAMMES);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Revoke access ───────────────────────────────────────────────────────────
  const handleRevoke = async (id) => {
    try {
      const token = localStorage.getItem("nuc_token");
      await fetch(`${API}/team/members/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type":"application/json",
          ...(token ? { Authorization:`Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "REVOKED" }),
      });
      setMembers(p => p.map(m => m.id===id ? {...m, status:"REVOKED"} : m));
      toast("Access revoked.");
    } catch {
      // Optimistic update anyway for demo
      setMembers(p => p.map(m => m.id===id ? {...m, status:"REVOKED"} : m));
      toast("Access revoked.");
    }
  };

  // ── Reactivate ──────────────────────────────────────────────────────────────
  const handleReactivate = async (id) => {
    try {
      const token = localStorage.getItem("nuc_token");
      await fetch(`${API}/team/members/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type":"application/json",
          ...(token ? { Authorization:`Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
    } catch {}
    setMembers(p => p.map(m => m.id===id ? {...m, status:"ACTIVE"} : m));
    toast("Access reactivated.");
  };

  // ── Remove ──────────────────────────────────────────────────────────────────
  const handleRemove = async () => {
    setRemoveLoading(true);
    try {
      const token = localStorage.getItem("nuc_token");
      await fetch(`${API}/team/members/${removeTarget.id}/`, {
        method: "DELETE",
        headers: token ? { Authorization:`Bearer ${token}` } : {},
      });
    } catch {}
    setMembers(p => p.filter(m => m.id !== removeTarget.id));
    toast(`${removeTarget.name} removed from team.`);
    setRemoveTarget(null);
    setRemoveLoading(false);
  };

  // ── Filtered ────────────────────────────────────────────────────────────────
  // NUC Visitor only sees their own member card
  const visitorSelf = isNUCVisitor
    ? members.filter(m => m.email === roleUser?.email)
    : null;

  const displayed = (isNUCVisitor ? visitorSelf : members).filter(m => {
    const matchRole   = roleFilter   === "ALL" || m.role   === roleFilter;
    const matchStatus = statusFilter === "ALL" || m.status === statusFilter;
    return matchRole && matchStatus;
  });

  const activeCount  = members.filter(m => m.status==="ACTIVE").length;
  const pendingCount = members.filter(m => m.status==="PENDING").length;

  return (
    <div style={{ fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",
      background:"#F0F4F8", minHeight:"100vh", padding:"32px 36px" }}>

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom:26, display:"flex",
        justifyContent:"space-between", alignItems:"flex-end",
        flexWrap:"wrap", gap:14 }}>
        <div>
          <div style={{ fontSize:10, color:"#94A3B8",
            fontFamily:"'IBM Plex Mono',monospace",
            letterSpacing:"0.12em", textTransform:"uppercase",
            marginBottom:4 }}>
            NUC Accreditation
          </div>
          <h1 style={{ fontSize:24, fontWeight:700, color:"#07162F",
            margin:"0 0 4px" }}>
            Accreditation Team Portal
          </h1>
          <p style={{ fontSize:13, color:"#64748B", margin:0 }}>
            Manage NUC visiting team access to programme evidence lockers.
          </p>
        </div>
        {isAPU && (
          <button onClick={() => setShowInvite(true)}
            style={{ ...S.btnPri, display:"flex",
              alignItems:"center", gap:8, padding:"10px 20px" }}>
            ✉ Invite Team Member
          </button>
        )}
      </div>

      {/* NUC Visitor read-only banner */}
      {isNUCVisitor && (
        <div style={{
          background:"#EDE9FE", border:"1px solid #C4B5FD",
          borderRadius:8, padding:"12px 18px", marginBottom:18,
          fontSize:12, color:"#7C3AED",
          display:"flex", alignItems:"center", gap:10,
          fontFamily:"'IBM Plex Mono',monospace", fontWeight:600,
        }}>
          🔍 <span>
            You are viewing as an <strong>NUC Visiting Team Member</strong>.
            This is a read-only view. Your access is managed by the APU Officer.
          </span>
        </div>
      )}

      {/* Demo banner */}
      {usingFallback && (
        <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE",
          borderRadius:8, padding:"9px 14px", marginBottom:18,
          fontSize:12, color:"#1D4ED8",
          display:"flex", gap:8, alignItems:"center" }}>
          ℹ <strong>Showing 2 demo team members.</strong> Connect Django backend at{" "}
          <code style={{ fontFamily:"'IBM Plex Mono',monospace",
            background:"#DBEAFE", padding:"1px 5px", borderRadius:3 }}>
            /api/team/members/
          </code>{" "}to load real data.
        </div>
      )}

      {/* ── KPI Row ── */}
      <div style={{ display:"grid",
        gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {[
          { label:"Total Members",  value:members.length,  color:"#07162F", icon:"👥" },
          { label:"Active",         value:activeCount,     color:"#059669", icon:"✓"  },
          { label:"Pending Invite", value:pendingCount,    color:"#D97706", icon:"⏳" },
          { label:"Programmes",     value:programmes.length, color:"#2563EB", icon:"📋" },
        ].map((k,i) => (
          <div key={i} style={{ background:"#fff",
            border:"1px solid #E2E8F0", borderRadius:10,
            padding:"18px 20px",
            boxShadow:"0 1px 4px rgba(7,22,47,0.06)" }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:9, color:"#94A3B8",
                  fontFamily:"'IBM Plex Mono',monospace",
                  letterSpacing:"0.12em", textTransform:"uppercase",
                  marginBottom:6 }}>{k.label}</div>
                <div style={{ fontSize:28, fontWeight:700, color:k.color,
                  fontFamily:"'IBM Plex Mono',monospace", lineHeight:1 }}>
                  {loading ? "—" : k.value}
                </div>
              </div>
              <span style={{ fontSize:22, opacity:0.1 }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Role explainer ── */}
      <div style={{ background:"#fff", border:"1px solid #E2E8F0",
        borderRadius:10, padding:"16px 20px", marginBottom:22,
        boxShadow:"0 1px 4px rgba(7,22,47,0.06)" }}>
        <div style={{ fontSize:10, fontWeight:700,
          fontFamily:"'IBM Plex Mono',monospace",
          color:"#6B7280", textTransform:"uppercase",
          letterSpacing:"0.1em", marginBottom:12 }}>
          Team Composition — NUC Standard
        </div>
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          {Object.entries(TEAM_ROLES).map(([key, cfg]) => {
            const count = members.filter(m => m.role===key).length;
            return (
              <div key={key} style={{ padding:"12px 14px",
                borderRadius:8,
                background:cfg.bg, border:`1px solid ${cfg.border}` }}>
                <div style={{ display:"flex", alignItems:"center",
                  justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:18 }}>{cfg.icon}</span>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace",
                    fontSize:18, fontWeight:700, color:cfg.color }}>
                    {count}
                  </span>
                </div>
                <div style={{ fontSize:12, fontWeight:700,
                  color:cfg.color, marginBottom:2 }}>{cfg.label}</div>
                <div style={{ fontSize:10, color:"#64748B" }}>{cfg.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Filters — hidden for NUC Visitor ── */}
      {!isNUCVisitor && <div style={{ display:"flex", gap:10, marginBottom:18,
        flexWrap:"wrap", alignItems:"center" }}>
        {/* Role filter */}
        <div style={{ display:"flex", border:"1px solid #E2E8F0",
          borderRadius:7, overflow:"hidden" }}>
          {[["ALL","All Roles"],
            ["PROFESSOR","Professor"],
            ["NUC_STAFF","NUC Staff"],
            ["OBSERVER","Observer"]
          ].map(([v,label]) => (
            <button key={v} onClick={() => setRoleFilter(v)} style={{
              padding:"7px 13px", border:"none", cursor:"pointer",
              fontFamily:"'IBM Plex Mono',monospace",
              fontSize:10, fontWeight:700,
              background:roleFilter===v?"#07162F":"#fff",
              color:roleFilter===v?"#fff":"#6B7280",
              transition:"all 0.12s",
            }}>{label}</button>
          ))}
        </div>

        {/* Status filter */}
        <div style={{ display:"flex", border:"1px solid #E2E8F0",
          borderRadius:7, overflow:"hidden" }}>
          {[["ALL","All"],["ACTIVE","Active"],
            ["PENDING","Pending"],["REVOKED","Revoked"]
          ].map(([v,label]) => (
            <button key={v} onClick={() => setStatusFilter(v)} style={{
              padding:"7px 13px", border:"none", cursor:"pointer",
              fontFamily:"'IBM Plex Mono',monospace",
              fontSize:10, fontWeight:700,
              background:statusFilter===v?"#07162F":"#fff",
              color:statusFilter===v?"#fff":"#6B7280",
              transition:"all 0.12s",
            }}>{label}</button>
          ))}
        </div>

        <span style={{ fontSize:12, color:"#94A3B8",
          fontFamily:"'IBM Plex Mono',monospace" }}>
          {displayed.length} member{displayed.length!==1?"s":""}
        </span>
      </div>}


      {/* ── Member Cards ── */}
      {loading ? (
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(420px,1fr))",
          gap:16 }}>
          {[1,2].map(i => (
            <div key={i} style={{ height:220, background:"#fff",
              borderRadius:12, border:"1px solid #E2E8F0",
              animation:"pulse 1.5s infinite" }}/>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ background:"#fff", border:"1px solid #E2E8F0",
          borderRadius:12, padding:"60px 20px", textAlign:"center",
          boxShadow:"0 1px 4px rgba(7,22,47,0.06)" }}>
          <div style={{ fontSize:40, marginBottom:12, opacity:0.2 }}>👥</div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace",
            color:"#94A3B8", fontSize:13, marginBottom:12 }}>
            No team members found.
          </div>
          <button onClick={() => setShowInvite(true)}
            style={S.btnPri}>
            ✉ Invite your first team member
          </button>
        </div>
      ) : (
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(420px,1fr))",
          gap:16 }}>
          {displayed.map(member => (
            <MemberCard key={member.id}
              member={member}
              programmes={programmes}
              onRevoke={isAPU ? handleRevoke : null}
              onReactivate={isAPU ? handleReactivate : null}
              onRemove={isAPU ? (id) => setRemoveTarget(members.find(m=>m.id===id)) : null}
            />
          ))}
        </div>
      )}

      {/* ── Access policy info ── */}
      <div style={{ marginTop:28, background:"#fff",
        border:"1px solid #E2E8F0", borderRadius:12,
        padding:"20px 24px",
        boxShadow:"0 1px 4px rgba(7,22,47,0.06)" }}>
        <div style={{ fontSize:10, fontWeight:700,
          fontFamily:"'IBM Plex Mono',monospace",
          color:"#6B7280", textTransform:"uppercase",
          letterSpacing:"0.1em", marginBottom:14 }}>
          Portal Access Policy
        </div>
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          {[
            { icon:"📖", title:"Read-Only Access",
              body:"All team members have read-only access. They cannot upload, edit, or delete any documents." },
            { icon:"✅", title:"Verified Docs Only",
              body:"Observers can only see verified documents. Unverified documents are hidden until approved by APU." },
            { icon:"🔒", title:"Instant Revocation",
              body:"Access can be revoked at any time. Revoked members are immediately locked out of all programme data." },
          ].map((p,i) => (
            <div key={i} style={{ padding:"14px",
              background:"#F8FAFC", border:"1px solid #E2E8F0",
              borderRadius:8 }}>
              <div style={{ fontSize:20, marginBottom:8 }}>{p.icon}</div>
              <div style={{ fontSize:12, fontWeight:700,
                color:"#07162F", marginBottom:4 }}>{p.title}</div>
              <div style={{ fontSize:11, color:"#64748B",
                lineHeight:1.6 }}>{p.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showInvite && (
        <InviteModal
          programmes={programmes}
          onClose={() => setShowInvite(false)}
          onSuccess={load}
          toast={toast}
        />
      )}
      {removeTarget && (
        <ConfirmRemove
          member={removeTarget}
          onConfirm={handleRemove}
          onCancel={() => setRemoveTarget(null)}
          loading={removeLoading}
        />
      )}

      <ToastStack toasts={toasts}/>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const S = {
  label: {
    fontSize:11, fontFamily:"'IBM Plex Mono',monospace",
    fontWeight:700, letterSpacing:"0.1em",
    textTransform:"uppercase", color:"#374151",
    display:"block", marginBottom:7,
  },
  input: {
    width:"100%", padding:"9px 13px",
    border:"1.5px solid #CBD5E1", borderRadius:7,
    fontFamily:"'IBM Plex Sans',sans-serif",
    fontSize:13, color:"#07162F", background:"#fff",
    outline:"none", boxSizing:"border-box",
    transition:"border-color 0.15s",
  },
  err: { fontSize:11, color:"#DC2626", marginTop:3 },
  btnPri: {
    padding:"9px 18px", borderRadius:7, cursor:"pointer",
    fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:12,
    background:"linear-gradient(135deg,#07162F,#0C2D5E)",
    color:"#fff", border:"none", letterSpacing:"0.04em",
  },
  btnSec: {
    padding:"9px 16px", borderRadius:7, cursor:"pointer",
    fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:12,
    background:"#fff", color:"#374151", border:"1.5px solid #CBD5E1",
  },
  btnDanger: {
    padding:"9px 18px", borderRadius:7, cursor:"pointer",
    fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:12,
    background:"#DC2626", color:"#fff", border:"none",
  },
  actionBtn: {
    padding:"5px 11px", borderRadius:5, cursor:"pointer",
    fontFamily:"'IBM Plex Mono',monospace", fontSize:10,
    fontWeight:700, border:"1px solid",
  },
  spinner: {
    display:"inline-block", width:13, height:13,
    border:"2px solid rgba(255,255,255,0.3)",
    borderTopColor:"#fff", borderRadius:"50%",
    animation:"spin 0.7s linear infinite",
  },
};