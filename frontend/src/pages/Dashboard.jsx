// src/pages/Dashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ── Config ────────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const STATUS_CONFIG = {
  PENDING:    { label: "Pending",        bg: "#FEF3C7", color: "#D97706", border: "#FCD34D", dot: "#D97706" },
  APPROVED:   { label: "Approved",       bg: "#DBEAFE", color: "#2563EB", border: "#BFDBFE", dot: "#2563EB" },
  RESOURCE:   { label: "Resource Visit", bg: "#FEE2E2", color: "#DC2626", border: "#FCA5A5", dot: "#DC2626" },
  ACCREDITED: { label: "Accredited",     bg: "#D1FAE5", color: "#059669", border: "#6EE7B7", dot: "#059669" },
  REACCREDIT: { label: "Re-accredit",    bg: "#EDE9FE", color: "#7C3AED", border: "#C4B5FD", dot: "#7C3AED" },
};

const FALLBACK = [
  { id:"C001", faculty:"Engineering",    department:"Computer Science", name:"B.Eng. Computer Engineering", code:"CPE", start_date:"2022-09-01", status:"RESOURCE",   student_count:187, lecturer_count:14, document_counts:{marking_schemes:12,lesson_notes:45,ca_records:8,examiner_reports:3,staff_files:14} },
  { id:"C002", faculty:"Sciences",       department:"Biochemistry",     name:"B.Sc. Biochemistry",           code:"BCH", start_date:"2021-03-15", status:"ACCREDITED", student_count:134, lecturer_count:11, document_counts:{marking_schemes:24,lesson_notes:78,ca_records:16,examiner_reports:6,staff_files:11} },
  { id:"C003", faculty:"Law",            department:"Public Law",       name:"LL.B. Law",                    code:"LAW", start_date:"2020-01-10", status:"REACCREDIT", student_count:312, lecturer_count:22, document_counts:{marking_schemes:36,lesson_notes:120,ca_records:24,examiner_reports:10,staff_files:22} },
  { id:"C004", faculty:"Medicine",       department:"Nursing Science",  name:"B.Sc. Nursing Science",        code:"NRS", start_date:"2024-09-01", status:"APPROVED",   student_count:89,  lecturer_count:9,  document_counts:{marking_schemes:4,lesson_notes:12,ca_records:2,examiner_reports:0,staff_files:9} },
  { id:"C005", faculty:"Social Sciences",department:"Economics",        name:"B.Sc. Economics",              code:"ECN", start_date:"2023-06-01", status:"APPROVED",   student_count:210, lecturer_count:16, document_counts:{marking_schemes:8,lesson_notes:29,ca_records:5,examiner_reports:1,staff_files:16} },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function addYears(d, y) {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + y);
  return x.toISOString().split("T")[0];
}
function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
function fmt(d) {
  return d ? new Date(d).toLocaleDateString("en-NG",
    { day:"2-digit", month:"short", year:"numeric" }) : "—";
}
function getMilestone(p) {
  const today = new Date().toISOString().split("T")[0];
  const s = p.start_date;
  if (["PENDING","APPROVED"].includes(p.status)) {
    const days = daysBetween(today, addYears(s, 3));
    return { label:"Resource Visit", date:addYears(s,3), days,
      urgency: days < 0 ? "overdue" : days < 90 ? "urgent" : "normal" };
  }
  if (["RESOURCE","ACCREDITED"].includes(p.status)) {
    const days = daysBetween(today, addYears(s, 5));
    return { label:"Full Accreditation", date:addYears(s,5), days,
      urgency: days < 0 ? "overdue" : days < 180 ? "urgent" : "normal" };
  }
  const days = daysBetween(today, addYears(s, 10));
  return { label:"Re-accreditation", date:addYears(s,10), days,
    urgency: days < 0 ? "overdue" : days < 365 ? "urgent" : "normal" };
}
function getRatio(s, l) {
  if (!l) return { ratio:"N/A", pass:false };
  const n = s / l;
  return { ratio:`${n.toFixed(1)}:1`, pass: n <= 30 };
}
function getReadiness(p) {
  const d = p.document_counts || {};
  const { pass } = getRatio(p.student_count, p.lecturer_count);
  const checks = [
    (d.marking_schemes||0)>0, (d.lesson_notes||0)>10,
    (d.ca_records||0)>0, (d.examiner_reports||0)>0,
    (d.staff_files||0)>0, pass,
  ];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}
function uc(u) { return u==="overdue"?"#DC2626":u==="urgent"?"#D97706":"#059669"; }
function ubg(u){ return u==="overdue"?"#FEE2E2":u==="urgent"?"#FEF3C7":"#D1FAE5"; }

// ── Atoms ─────────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 9px", borderRadius:4,
      background:c.bg, color:c.color, border:`1px solid ${c.border}`,
      fontFamily:"'IBM Plex Mono',monospace", fontSize:10,
      fontWeight:700, textTransform:"uppercase", whiteSpace:"nowrap" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.dot }}/>
      {c.label}
    </span>
  );
}

function Bar({ value }) {
  const color = value>=80?"#059669":value>=50?"#D97706":"#DC2626";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:5, background:"#E5E7EB",
        borderRadius:9999, overflow:"hidden" }}>
        <div style={{ width:`${value}%`, height:"100%",
          background:color, borderRadius:9999,
          transition:"width 0.7s ease" }}/>
      </div>
      <span style={{ fontFamily:"'IBM Plex Mono',monospace",
        fontSize:10, fontWeight:700, color, minWidth:32 }}>
        {value}%
      </span>
    </div>
  );
}

// ── Programme Detail Modal ────────────────────────────────────────────────────
function ProgrammeModal({ programme, onClose, onNavigate }) {
  if (!programme) return null;
  const m = getMilestone(programme);
  const { ratio, pass } = getRatio(programme.student_count, programme.lecturer_count);
  const docs = programme.document_counts || {};
  const readiness = getReadiness(programme);

  const workflow = [
    { step:"Application",            done:true },
    { step:"Approval / Take-off",    done:["APPROVED","RESOURCE","ACCREDITED","REACCREDIT"].includes(programme.status) },
    { step:"Resource Visit (Yr 3)",  done:["RESOURCE","ACCREDITED","REACCREDIT"].includes(programme.status) },
    { step:"Full Accreditation (Yr 5)", done:["ACCREDITED","REACCREDIT"].includes(programme.status) },
    { step:"Re-accreditation",       done:programme.status==="REACCREDIT" },
  ];

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0,
      background:"rgba(7,22,47,0.75)", display:"flex",
      alignItems:"center", justifyContent:"center",
      zIndex:500, backdropFilter:"blur(4px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#fff", borderRadius:12,
        width:"min(800px,95vw)", maxHeight:"90vh", overflowY:"auto",
        boxShadow:"0 25px 80px rgba(7,22,47,0.35)",
        border:"1px solid #CBD5E1" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#07162F,#0C2D5E)",
          padding:"24px 28px 20px", borderRadius:"12px 12px 0 0",
          position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:14, right:14,
            width:30, height:30, borderRadius:"50%",
            background:"rgba(255,255,255,0.1)", border:"none",
            color:"#fff", fontSize:18, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            ×
          </button>
          <div style={{ color:"#94A3B8", fontSize:9,
            fontFamily:"'IBM Plex Mono',monospace",
            letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:5 }}>
            {programme.code} · {programme.faculty} · {programme.department}
          </div>
          <div style={{ color:"#fff", fontSize:20,
            fontWeight:700, marginBottom:10 }}>
            {programme.name}
          </div>
          <Badge status={programme.status}/>
        </div>

        <div style={{ padding:"24px 28px",
          display:"flex", flexDirection:"column", gap:22 }}>

          {/* Workflow */}
          <div>
            <div style={SL}>NUC Accreditation Workflow</div>
            <div style={{ display:"flex", alignItems:"center" }}>
              {workflow.map((w,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center",
                  flex:i<4?1:0 }}>
                  <div style={{ display:"flex", flexDirection:"column",
                    alignItems:"center", gap:4 }}>
                    <div style={{ width:26, height:26, borderRadius:"50%",
                      background:w.done?"#059669":"#E5E7EB",
                      color:w.done?"#fff":"#9CA3AF",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:10, fontWeight:700,
                      border:`2px solid ${w.done?"#047857":"#D1D5DB"}` }}>
                      {w.done?"✓":i+1}
                    </div>
                    <span style={{ fontSize:8, textAlign:"center", maxWidth:60,
                      color:w.done?"#065F46":"#9CA3AF",
                      fontFamily:"'IBM Plex Mono',monospace",
                      fontWeight:w.done?700:400, lineHeight:1.3 }}>
                      {w.step}
                    </span>
                  </div>
                  {i<4 && <div style={{ flex:1, height:2, margin:"0 3px",
                    marginBottom:20,
                    background:w.done?"#059669":"#E5E7EB" }}/>}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
            {[
              {l:"Students",      v:(programme.student_count||0).toLocaleString()},
              {l:"Lecturers",     v:programme.lecturer_count||0},
              {l:"Ratio",         v:ratio, note:pass?"✓ Meets NUC Standard":"✗ Below Standard", nc:pass?"#059669":"#DC2626"},
              {l:"Start Date",    v:fmt(programme.start_date)},
              {l:"Next Milestone",v:m.label},
              {l:"Readiness",     v:`${readiness}%`},
            ].map((s,i)=>(
              <div key={i} style={{ background:"#F8FAFC",
                border:"1px solid #E2E8F0", borderRadius:7,
                padding:"11px 13px" }}>
                <div style={{ fontSize:9, color:"#94A3B8",
                  fontFamily:"'IBM Plex Mono',monospace",
                  textTransform:"uppercase", letterSpacing:"0.1em",
                  marginBottom:4 }}>{s.l}</div>
                <div style={{ fontSize:18, fontWeight:700, color:"#07162F",
                  fontFamily:"'IBM Plex Mono',monospace" }}>{s.v}</div>
                {s.note && <div style={{ fontSize:10, color:s.nc,
                  marginTop:2, fontWeight:600 }}>{s.note}</div>}
              </div>
            ))}
          </div>

          {/* Evidence locker */}
          <div>
            <div style={SL}>Evidence Locker</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {[
                ["Marking Schemes","marking_schemes"],
                ["Lesson Notes","lesson_notes"],
                ["CA Records","ca_records"],
                ["Examiner Reports","examiner_reports"],
                ["Staff Files","staff_files"],
              ].map(([label,key])=>{
                const count = docs[key]||0;
                return (
                  <span key={key} style={{ display:"inline-flex",
                    alignItems:"center", gap:4, padding:"3px 9px",
                    borderRadius:4, fontSize:11,
                    fontFamily:"'IBM Plex Mono',monospace",
                    background:count>0?"#EFF6FF":"#F9FAFB",
                    border:`1px solid ${count>0?"#BFDBFE":"#E5E7EB"}`,
                    color:count>0?"#1D4ED8":"#9CA3AF" }}>
                    {count>0?"📄":"○"} {label} ({count})
                  </span>
                );
              })}
            </div>
          </div>

          {/* Readiness */}
          <div>
            <div style={SL}>Accreditation Readiness</div>
            <Bar value={readiness}/>
          </div>

          {/* Action buttons — navigate to real pages */}
          <div style={{ display:"flex", gap:9, flexWrap:"wrap" }}>
            <button onClick={()=>{ onClose(); onNavigate(`/courses/${programme.id}`); }}
              style={BP}>
              📋 View Full Detail
            </button>
            <button onClick={()=>{ onClose(); onNavigate(`/documents?programme=${programme.id}`); }}
              style={BS}>
              📤 Upload Documents
            </button>
            <button onClick={()=>{ onClose(); onNavigate(`/courses/${programme.id}`); }}
              style={BS}>
              ✏ Edit Programme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SL = {
  fontSize:10, fontWeight:700, letterSpacing:"0.12em",
  color:"#6B7280", textTransform:"uppercase", marginBottom:12,
  fontFamily:"'IBM Plex Mono',monospace",
};
const BP = {
  padding:"9px 16px", borderRadius:7, cursor:"pointer",
  fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:12,
  background:"linear-gradient(135deg,#07162F,#0C2D5E)",
  color:"#fff", border:"none",
};
const BS = {
  padding:"9px 16px", borderRadius:7, cursor:"pointer",
  fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:12,
  background:"#fff", color:"#374151", border:"1.5px solid #CBD5E1",
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [programmes,    setProgrammes]    = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [selected,      setSelected]      = useState(null);
  const [filter,        setFilter]        = useState("ALL");
  const [usingFallback, setUsingFallback] = useState(false);

  const user = JSON.parse(localStorage.getItem("nuc_user") || '{}');
  const now  = new Date();

  // ── Load data ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("nuc_token");
      const headers = token ? { Authorization:`Token ${token}` } : {};

      const [progRes, statsRes] = await Promise.all([
        fetch(`${API}/programmes/`, { headers }).then(r => { if(!r.ok) throw new Error(); return r.json(); }),
        fetch(`${API}/dashboard/summary/`, { headers }).then(r => { if(!r.ok) throw new Error(); return r.json(); }),
      ]);
      setProgrammes(progRes.results || progRes);
      setStats(statsRes);
      setUsingFallback(false);
    } catch {
      setProgrammes(FALLBACK);
      setUsingFallback(true);
      setStats({
        total_programmes: FALLBACK.length,
        accredited:       FALLBACK.filter(p=>p.status==="ACCREDITED").length,
        alerts_count:     FALLBACK.filter(p=>getMilestone(p).urgency!=="normal").length,
        total_documents:  847,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = filter === "ALL"
    ? programmes
    : programmes.filter(p => p.status === filter);

  const alerts = programmes.filter(p => getMilestone(p).urgency !== "normal");

  return (
    <div style={{ fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",
      background:"#F0F4F8", minHeight:"100vh", padding:"32px 36px" }}>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:10, color:"#94A3B8",
          fontFamily:"'IBM Plex Mono',monospace",
          letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>
          Academic Planning Unit · {now.toLocaleDateString("en-NG",
            { weekday:"long", day:"2-digit", month:"long", year:"numeric" })}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"flex-end", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontSize:26, fontWeight:700,
              color:"#07162F", margin:"0 0 4px" }}>
              Accreditation Readiness Dashboard
            </h1>
            <p style={{ fontSize:13, color:"#64748B", margin:0 }}>
              Welcome back, {user.first_name || "Officer"} — here's your programme overview.
            </p>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={load} style={{ ...BS,
              display:"flex", alignItems:"center", gap:6,
              opacity: loading ? 0.6 : 1 }}>
              🔄 Refresh
            </button>
            <button onClick={() => navigate("/courses/new")}
              style={{ ...BP, display:"flex", alignItems:"center", gap:6 }}>
              + New Programme
            </button>
          </div>
        </div>
      </div>

      {/* Demo banner */}
      {usingFallback && (
        <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE",
          borderRadius:8, padding:"10px 16px", marginBottom:20,
          fontSize:12, color:"#1D4ED8",
          display:"flex", gap:8, alignItems:"center" }}>
          ℹ <strong>Demo mode</strong> — connect your Django backend at{" "}
          <code style={{ fontFamily:"'IBM Plex Mono',monospace",
            background:"#DBEAFE", padding:"1px 5px", borderRadius:3 }}>
            {API}
          </code>{" "}to load live data.
        </div>
      )}

      {/* ── KPI Row ── */}
      <div style={{ display:"grid",
        gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { icon:"◈", label:"Total Programmes",    value:stats?.total_programmes ?? "—", sub:"Under Management",  color:"#07162F", click: ()=>navigate("/courses") },
          { icon:"⚠", label:"Accreditation Alerts",value:stats?.alerts_count ?? "—",    sub:"Require Attention", color:"#DC2626", click: ()=>navigate("/notifications") },
          { icon:"✓", label:"Fully Accredited",    value:stats?.accredited ?? "—",       sub:"Programmes",        color:"#059669", click: ()=>navigate("/courses") },
          { icon:"📄", label:"Documents Stored",   value:(stats?.total_documents??0).toLocaleString(), sub:"Across All Lockers", color:"#2563EB", click: ()=>navigate("/documents") },
        ].map((k,i) => (
          <div key={i} onClick={k.click} style={{
            background:"#fff", border:"1px solid #E2E8F0",
            borderRadius:10, padding:"20px 22px",
            boxShadow:"0 1px 4px rgba(7,22,47,0.06)",
            cursor:"pointer", transition:"all 0.15s",
          }}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 6px 20px rgba(7,22,47,0.1)";e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 4px rgba(7,22,47,0.06)";e.currentTarget.style.transform="none";}}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:10, color:"#94A3B8",
                  fontFamily:"'IBM Plex Mono',monospace",
                  letterSpacing:"0.12em", textTransform:"uppercase",
                  marginBottom:8 }}>{k.label}</div>
                {loading
                  ? <div style={{ height:32, width:64, background:"#F1F5F9",
                      borderRadius:6, animation:"pulse 1.5s infinite" }}/>
                  : <div style={{ fontSize:32, fontWeight:700, color:k.color,
                      fontFamily:"'IBM Plex Mono',monospace", lineHeight:1 }}>
                      {k.value}
                    </div>}
                <div style={{ fontSize:11, color:"#94A3B8", marginTop:6 }}>
                  {k.sub}
                </div>
              </div>
              <span style={{ fontSize:24, opacity:0.12 }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Alert Banner ── */}
      {!loading && alerts.length > 0 && (
        <div style={{ background:"linear-gradient(135deg,#FEF3C7,#FDE68A)",
          border:"1px solid #F59E0B", borderRadius:8,
          padding:"14px 20px", marginBottom:24,
          display:"flex", alignItems:"flex-start", gap:12 }}>
          <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>⚠</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, color:"#92400E",
              fontSize:13, marginBottom:4 }}>
              {alerts.length} programme{alerts.length>1?"s":""} require immediate attention
            </div>
            <div style={{ fontSize:12, color:"#78350F", lineHeight:1.6 }}>
              {alerts.map(a=>{
                const m=getMilestone(a);
                return `${a.code}: ${m.label} — ${m.urgency==="overdue"?`${Math.abs(m.days)}d overdue`:`${m.days}d`}`;
              }).join("  ·  ")}
            </div>
          </div>
          <button onClick={()=>navigate("/notifications")}
            style={{ ...BS, fontSize:11, padding:"6px 12px", flexShrink:0 }}>
            View All →
          </button>
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div style={{ display:"flex", gap:7, marginBottom:18, flexWrap:"wrap" }}>
        {["ALL","PENDING","APPROVED","RESOURCE","ACCREDITED","REACCREDIT"].map(s=>{
          const cfg = STATUS_CONFIG[s];
          const count = s==="ALL"
            ? programmes.length
            : programmes.filter(p=>p.status===s).length;
          return (
            <button key={s} onClick={()=>setFilter(s)} style={{
              padding:"6px 14px", borderRadius:20, cursor:"pointer",
              fontFamily:"'IBM Plex Mono',monospace",
              fontSize:10, fontWeight:700, border:"1.5px solid",
              borderColor: filter===s ? (cfg?.color||"#07162F") : "#E2E8F0",
              background:  filter===s ? (cfg?.bg||"#07162F")    : "#fff",
              color:       filter===s ? (cfg?.color||"#fff")    : "#6B7280",
              transition:"all 0.12s",
            }}>
              {s==="ALL" ? `All (${count})` : `${cfg?.label} (${count})`}
            </button>
          );
        })}
      </div>

      {/* ── Programme Cards ── */}
      {loading ? (
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
          {[1,2,3,4].map(i=>(
            <div key={i} style={{ height:200, background:"#fff",
              borderRadius:10, border:"1px solid #E2E8F0",
              animation:"pulse 1.5s infinite" }}/>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign:"center", padding:60,
          color:"#94A3B8", fontFamily:"'IBM Plex Mono',monospace",
          fontSize:12 }}>
          No programmes match this filter.
        </div>
      ) : (
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",
          gap:16 }}>
          {displayed.map(p => {
            const m = getMilestone(p);
            const { ratio, pass } = getRatio(p.student_count, p.lecturer_count);
            const readiness = getReadiness(p);
            const urgent = m.urgency !== "normal";
            return (
              <div key={p.id}
                onClick={()=>setSelected(p)}
                style={{
                  background:"#fff", border:"1px solid #E2E8F0",
                  borderLeft:`4px solid ${urgent?uc(m.urgency):"#E2E8F0"}`,
                  borderRadius:10, padding:"18px 20px", cursor:"pointer",
                  boxShadow:"0 1px 4px rgba(7,22,47,0.06)",
                  transition:"transform 0.18s,box-shadow 0.18s",
                  animation:"fadeIn 0.25s ease",
                }}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 20px rgba(7,22,47,0.12)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 1px 4px rgba(7,22,47,0.06)";}}>

                {/* Card header */}
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"flex-start", marginBottom:10, gap:6 }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:9, color:"#94A3B8",
                      fontFamily:"'IBM Plex Mono',monospace",
                      letterSpacing:"0.08em", textTransform:"uppercase",
                      marginBottom:2 }}>
                      {p.code} · {p.department}
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#07162F",
                      overflow:"hidden", textOverflow:"ellipsis",
                      whiteSpace:"nowrap", maxWidth:200 }}>
                      {p.name}
                    </div>
                  </div>
                  <Badge status={p.status}/>
                </div>

                {/* Milestone */}
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:9, color:"#94A3B8",
                    fontFamily:"'IBM Plex Mono',monospace",
                    textTransform:"uppercase", letterSpacing:"0.1em",
                    marginBottom:3 }}>
                    {m.label}
                  </div>
                  <span style={{ display:"inline-block",
                    background:ubg(m.urgency), color:uc(m.urgency),
                    padding:"2px 8px", borderRadius:3, fontSize:10,
                    fontWeight:700, fontFamily:"'IBM Plex Mono',monospace",
                    border:`1px solid ${uc(m.urgency)}33` }}>
                    {fmt(m.date)} · {m.urgency==="overdue"
                      ? `${Math.abs(m.days)}d OVERDUE`
                      : `${m.days}d remaining`}
                  </span>
                </div>

                {/* Stats row */}
                <div style={{ display:"flex", alignItems:"center",
                  gap:8, marginBottom:9,
                  fontSize:11, color:"#64748B", flexWrap:"wrap" }}>
                  <span>👨‍🎓 {(p.student_count||0).toLocaleString()}</span>
                  <span>👨‍🏫 {p.lecturer_count||0}</span>
                  <span style={{ fontSize:10,
                    fontFamily:"'IBM Plex Mono',monospace", fontWeight:700,
                    padding:"1px 6px", borderRadius:3,
                    background:pass?"#D1FAE5":"#FEE2E2",
                    color:pass?"#065F46":"#991B1B",
                    border:`1px solid ${pass?"#6EE7B7":"#FCA5A5"}` }}>
                    {pass?"✓":"✗"} {ratio}
                  </span>
                </div>

                <Bar value={readiness}/>
                <div style={{ fontSize:9, color:"#94A3B8", marginTop:3,
                  fontFamily:"'IBM Plex Mono',monospace",
                  letterSpacing:"0.1em", textTransform:"uppercase" }}>
                  Accreditation Readiness
                </div>

                {/* Quick action buttons */}
                <div style={{ display:"flex", gap:6, marginTop:12 }}
                  onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>navigate(`/courses/${p.id}`)}
                    style={{ flex:1, padding:"6px", borderRadius:5,
                      cursor:"pointer", fontSize:10, fontWeight:700,
                      fontFamily:"'IBM Plex Mono',monospace",
                      background:"#EFF6FF", color:"#1D4ED8",
                      border:"1px solid #BFDBFE" }}>
                    View Detail →
                  </button>
                  <button onClick={()=>navigate(`/documents?programme=${p.id}`)}
                    style={{ padding:"6px 10px", borderRadius:5,
                      cursor:"pointer", fontSize:10, fontWeight:700,
                      fontFamily:"'IBM Plex Mono',monospace",
                      background:"#F0FDF4", color:"#059669",
                      border:"1px solid #6EE7B7" }}>
                    📤 Docs
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Upcoming Milestones Table ── */}
      {!loading && alerts.length > 0 && (
        <div style={{ marginTop:32, background:"#fff",
          borderRadius:10, border:"1px solid #E2E8F0",
          boxShadow:"0 1px 4px rgba(7,22,47,0.06)" }}>
          <div style={{ padding:"14px 20px",
            borderBottom:"1px solid #E2E8F0",
            display:"flex", justifyContent:"space-between",
            alignItems:"center" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#07162F" }}>
              Upcoming Milestones
            </div>
            <button onClick={()=>navigate("/courses")}
              style={{ ...BS, fontSize:11, padding:"6px 12px" }}>
              View All Courses →
            </button>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  {["Programme","Status","Milestone","Due Date","Days Left","Readiness",""].map(h=>(
                    <th key={h} style={{ padding:"10px 14px", textAlign:"left",
                      fontSize:9, color:"#94A3B8",
                      fontFamily:"'IBM Plex Mono',monospace",
                      letterSpacing:"0.1em", textTransform:"uppercase",
                      fontWeight:700, borderBottom:"1px solid #E2E8F0",
                      whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.map((p,i)=>{
                  const m=getMilestone(p);
                  return (
                    <tr key={p.id}
                      style={{ borderBottom:"1px solid #F1F5F9",
                        background:i%2===0?"#fff":"#FAFBFC",
                        cursor:"pointer", transition:"background 0.1s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#EFF6FF"}
                      onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#fff":"#FAFBFC"}
                      onClick={()=>setSelected(p)}>
                      <td style={{ padding:"11px 14px" }}>
                        <div style={{ fontSize:12, fontWeight:600, color:"#07162F" }}>{p.name}</div>
                        <div style={{ fontSize:10, color:"#94A3B8", fontFamily:"'IBM Plex Mono',monospace" }}>{p.code}</div>
                      </td>
                      <td style={{ padding:"11px 14px" }}><Badge status={p.status}/></td>
                      <td style={{ padding:"11px 14px", fontSize:12, color:"#374151", fontWeight:600 }}>{m.label}</td>
                      <td style={{ padding:"11px 14px", fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>{fmt(m.date)}</td>
                      <td style={{ padding:"11px 14px" }}>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace",
                          fontSize:12, fontWeight:700, color:uc(m.urgency) }}>
                          {m.urgency==="overdue"?`${Math.abs(m.days)}d OVERDUE`:`${m.days}d`}
                        </span>
                      </td>
                      <td style={{ padding:"11px 14px", minWidth:120 }}>
                        <Bar value={getReadiness(p)}/>
                      </td>
                      <td style={{ padding:"11px 14px" }}>
                        <button onClick={e=>{e.stopPropagation();navigate(`/courses/${p.id}`);}}
                          style={{ padding:"4px 10px", borderRadius:5,
                            background:"#EFF6FF", border:"1px solid #BFDBFE",
                            color:"#1D4ED8", fontFamily:"'IBM Plex Mono',monospace",
                            fontSize:10, fontWeight:700, cursor:"pointer" }}>
                          Open →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <ProgrammeModal
        programme={selected}
        onClose={()=>setSelected(null)}
        onNavigate={navigate}
      />
    </div>
  );
}