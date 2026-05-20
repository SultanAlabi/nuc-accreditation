// src/pages/Courses.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { programmesAPI } from "../services/api";

// ── Constants ─────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const STATUS_CONFIG = {
  PENDING:    { label: "Pending",        bg: "#FEF3C7", color: "#D97706", border: "#FCD34D", dot: "#D97706" },
  APPROVED:   { label: "Approved",       bg: "#DBEAFE", color: "#2563EB", border: "#BFDBFE", dot: "#2563EB" },
  RESOURCE:   { label: "Resource Visit", bg: "#FEE2E2", color: "#DC2626", border: "#FCA5A5", dot: "#DC2626" },
  ACCREDITED: { label: "Accredited",     bg: "#D1FAE5", color: "#059669", border: "#6EE7B7", dot: "#059669" },
  REACCREDIT: { label: "Re-accredit",    bg: "#EDE9FE", color: "#7C3AED", border: "#C4B5FD", dot: "#7C3AED" },
};

const FACULTIES = [
  "All Faculties", "Engineering", "Sciences", "Medicine",
  "Law", "Social Sciences", "Education", "Management Sciences", "Arts & Humanities",
];

const FALLBACK = [
  { id:"C001", faculty:"Engineering",     department:"Computer Science",      name:"B.Eng. Computer Engineering", code:"CPE", start_date:"2022-09-01", status:"RESOURCE",   student_count:187, lecturer_count:14, document_counts:{marking_schemes:12,lesson_notes:45,ca_records:8,examiner_reports:3,staff_files:14} },
  { id:"C002", faculty:"Sciences",        department:"Biochemistry",          name:"B.Sc. Biochemistry",           code:"BCH", start_date:"2021-03-15", status:"ACCREDITED", student_count:134, lecturer_count:11, document_counts:{marking_schemes:24,lesson_notes:78,ca_records:16,examiner_reports:6,staff_files:11} },
  { id:"C003", faculty:"Law",             department:"Public Law",            name:"LL.B. Law",                    code:"LAW", start_date:"2020-01-10", status:"REACCREDIT", student_count:312, lecturer_count:22, document_counts:{marking_schemes:36,lesson_notes:120,ca_records:24,examiner_reports:10,staff_files:22} },
  { id:"C004", faculty:"Medicine",        department:"Nursing Science",       name:"B.Sc. Nursing Science",        code:"NRS", start_date:"2024-09-01", status:"APPROVED",   student_count:89,  lecturer_count:9,  document_counts:{marking_schemes:4,lesson_notes:12,ca_records:2,examiner_reports:0,staff_files:9} },
  { id:"C005", faculty:"Social Sciences", department:"Economics",             name:"B.Sc. Economics",              code:"ECN", start_date:"2023-06-01", status:"APPROVED",   student_count:210, lecturer_count:16, document_counts:{marking_schemes:8,lesson_notes:29,ca_records:5,examiner_reports:1,staff_files:16} },
  { id:"C006", faculty:"Education",       department:"Educational Management",name:"B.Ed. Educational Management", code:"EDM", start_date:"2019-09-01", status:"REACCREDIT", student_count:156, lecturer_count:10, document_counts:{marking_schemes:40,lesson_notes:130,ca_records:28,examiner_reports:12,staff_files:10} },
  { id:"C007", faculty:"Engineering",     department:"Electrical Engineering", name:"B.Eng. Electrical Engineering",code:"EEE", start_date:"2023-09-01", status:"PENDING",    student_count:0,   lecturer_count:8,  document_counts:{marking_schemes:0,lesson_notes:0,ca_records:0,examiner_reports:0,staff_files:8} },
];

// ── Helpers (all inline — no external imports needed) ─────────────────────────
function addYears(d, y) { const x = new Date(d); x.setFullYear(x.getFullYear()+y); return x.toISOString().split("T")[0]; }
function daysBetween(a, b) { return Math.round((new Date(b)-new Date(a))/86400000); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString("en-NG",{day:"2-digit",month:"short",year:"numeric"}) : "—"; }

function getNextMilestone(p) {
  const today = new Date().toISOString().split("T")[0];
  const s = p.start_date;
  if (["PENDING","APPROVED"].includes(p.status)) {
    const days = daysBetween(today, addYears(s,3));
    return { label:"Resource Visit", date:addYears(s,3), days, urgency:days<0?"overdue":days<90?"urgent":"normal" };
  }
  if (["RESOURCE","ACCREDITED"].includes(p.status)) {
    const days = daysBetween(today, addYears(s,5));
    return { label:"Full Accreditation", date:addYears(s,5), days, urgency:days<0?"overdue":days<180?"urgent":"normal" };
  }
  const days = daysBetween(today, addYears(s,10));
  return { label:"Re-accreditation", date:addYears(s,10), days, urgency:days<0?"overdue":days<365?"urgent":"normal" };
}

function getNUCRatio(students, lecturers) {
  if (!lecturers) return { ratio:"N/A", pass:false };
  const n = students/lecturers;
  return { ratio:`${n.toFixed(1)}:1`, pass:n<=30 };
}

function getReadinessScore(p) {
  const d = p.document_counts || {};
  const { pass } = getNUCRatio(p.student_count, p.lecturer_count);
  const checks = [
    (d.marking_schemes||0)>0, (d.lesson_notes||0)>10,
    (d.ca_records||0)>0, (d.examiner_reports||0)>0,
    (d.staff_files||0)>0, pass,
  ];
  return Math.round(checks.filter(Boolean).length/checks.length*100);
}

function urgencyColor(u) { return u==="overdue"?"#DC2626":u==="urgent"?"#D97706":"#059669"; }
function urgencyBg(u)    { return u==="overdue"?"#FEE2E2":u==="urgent"?"#FEF3C7":"#D1FAE5"; }

// ── Atoms ─────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
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

function ReadinessBar({ value }) {
  const color = value>=80?"#059669":value>=50?"#D97706":"#DC2626";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
      <div style={{ flex:1, height:5, background:"#E5E7EB",
        borderRadius:9999, overflow:"hidden", minWidth:80 }}>
        <div style={{ width:`${value}%`, height:"100%", background:color,
          borderRadius:9999, transition:"width 0.6s" }}/>
      </div>
      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10,
        fontWeight:700, color, minWidth:28 }}>{value}%</span>
    </div>
  );
}

// ── Add Programme Modal ───────────────────────────────────────────────────────
function AddProgrammeModal({ onClose, onSuccess }) {
  const [form, setForm]   = useState({ name:"", code:"", faculty:"", department:"", start_date:"", student_count:"", lecturer_count:"" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())       e.name       = "Required";
    if (!form.code.trim())       e.code       = "Required";
    if (!form.faculty)           e.faculty    = "Required";
    if (!form.department.trim()) e.department = "Required";
    if (!form.start_date)        e.start_date = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await programmesAPI.create({
        ...form,
        student_count:  parseInt(form.student_count)  || 0,
        lecturer_count: parseInt(form.lecturer_count) || 0,
        status: "PENDING",
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      const data = err.response?.data || {};
      setErrors({ ...data, general: data.detail || "Failed to create programme." });
    } finally {
      setLoading(false);
    }
  };

  const F = ({ name, label, type="text", options=null }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={S.label}>{label}</label>
      {options ? (
        <select name={name} value={form[name]}
          onChange={e=>setForm(p=>({...p,[name]:e.target.value}))}
          style={{ ...S.input, color:form[name]?"#07162F":"#94A3B8",
            borderColor:errors[name]?"#DC2626":"#CBD5E1" }}>
          <option value="">Select…</option>
          {options.map(o=><option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} name={name} value={form[name]}
          onChange={e=>setForm(p=>({...p,[name]:e.target.value}))}
          style={{ ...S.input, borderColor:errors[name]?"#DC2626":"#CBD5E1" }}/>
      )}
      {errors[name] && <span style={S.err}>{errors[name]}</span>}
    </div>
  );

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0,
      background:"rgba(7,22,47,0.72)", display:"flex",
      alignItems:"center", justifyContent:"center",
      zIndex:500, backdropFilter:"blur(4px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#fff", borderRadius:12,
        width:"min(560px,95vw)", maxHeight:"90vh", overflowY:"auto",
        boxShadow:"0 25px 80px rgba(7,22,47,0.35)",
        border:"1px solid #CBD5E1" }}>
        <div style={{ background:"linear-gradient(135deg,#07162F,#0C2D5E)",
          padding:"20px 26px", borderRadius:"12px 12px 0 0",
          position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:14, right:14,
            width:28, height:28, borderRadius:"50%",
            background:"rgba(255,255,255,0.1)", border:"none",
            color:"#fff", fontSize:16, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          <div style={{ color:"#94A3B8", fontSize:9,
            fontFamily:"'IBM Plex Mono',monospace",
            letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>
            New Programme
          </div>
          <div style={{ color:"#fff", fontSize:18, fontWeight:700 }}>
            Register a Programme for Accreditation
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ padding:"22px 26px",
          display:"flex", flexDirection:"column", gap:14 }}>
          {errors.general && (
            <div style={{ background:"#FEE2E2", border:"1px solid #FCA5A5",
              color:"#DC2626", borderRadius:6, padding:"10px 14px",
              fontSize:12 }}>⚠ {errors.general}</div>
          )}
          <F name="name" label="Programme Name"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <F name="code"       label="Code"/>
            <F name="start_date" label="Start Date" type="date"/>
          </div>
          <F name="faculty"    label="Faculty"    options={FACULTIES.slice(1)}/>
          <F name="department" label="Department"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <F name="student_count"  label="No. of Students"  type="number"/>
            <F name="lecturer_count" label="No. of Lecturers" type="number"/>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:4 }}>
            <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
            <button type="submit" disabled={loading}
              style={{ ...S.btnPri, flex:1, justifyContent:"center",
                opacity:loading?0.7:1 }}>
              {loading ? "Submitting…" : "Submit for Approval →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Detail slide-over panel ───────────────────────────────────────────────────
function DetailPanel({ programme, onClose }) {
  const navigate = useNavigate();
  if (!programme) return null;
  const m = getNextMilestone(programme);
  const { ratio, pass } = getNUCRatio(programme.student_count, programme.lecturer_count);
  const docs = programme.document_counts || {};
  const readiness = getReadinessScore(programme);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:400 }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0,
        background:"rgba(7,22,47,0.5)", backdropFilter:"blur(2px)" }}/>
      <div style={{ position:"absolute", top:0, right:0, bottom:0,
        width:"min(480px,100vw)", background:"#fff",
        boxShadow:"-8px 0 32px rgba(7,22,47,0.2)",
        display:"flex", flexDirection:"column", overflowY:"auto",
        animation:"slideIn 0.25s ease" }}>
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#07162F,#0C2D5E)",
          padding:"22px 22px 18px", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"flex-start", gap:8 }}>
            <div>
              <div style={{ color:"#94A3B8", fontSize:9,
                fontFamily:"'IBM Plex Mono',monospace",
                letterSpacing:"0.12em", textTransform:"uppercase",
                marginBottom:4 }}>
                {programme.code} · {programme.department}
              </div>
              <div style={{ color:"#fff", fontSize:16,
                fontWeight:700, lineHeight:1.3 }}>
                {programme.name}
              </div>
            </div>
            <button onClick={onClose} style={{ width:28, height:28,
              borderRadius:"50%", background:"rgba(255,255,255,0.1)",
              border:"none", color:"#fff", fontSize:16, cursor:"pointer",
              flexShrink:0, display:"flex", alignItems:"center",
              justifyContent:"center" }}>×</button>
          </div>
          <div style={{ marginTop:10 }}>
            <StatusBadge status={programme.status}/>
          </div>
        </div>

        <div style={{ padding:"18px 22px", display:"flex",
          flexDirection:"column", gap:18, flex:1 }}>

          {/* Milestone */}
          <div style={{ background:urgencyBg(m.urgency),
            border:`1px solid ${urgencyColor(m.urgency)}44`,
            borderRadius:8, padding:"11px 13px" }}>
            <div style={{ fontSize:9, fontFamily:"'IBM Plex Mono',monospace",
              textTransform:"uppercase", color:urgencyColor(m.urgency),
              fontWeight:700, marginBottom:3 }}>Next Milestone</div>
            <div style={{ fontSize:14, fontWeight:700,
              color:urgencyColor(m.urgency) }}>{m.label}</div>
            <div style={{ fontSize:11, color:urgencyColor(m.urgency), marginTop:2 }}>
              {fmtDate(m.date)} ·{" "}
              {m.urgency==="overdue"
                ? `${Math.abs(m.days)} days OVERDUE`
                : `${m.days} days remaining`}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
            {[
              { l:"Faculty",   v:programme.faculty },
              { l:"Start",     v:fmtDate(programme.start_date) },
              { l:"Students",  v:(programme.student_count||0).toLocaleString() },
              { l:"Lecturers", v:programme.lecturer_count||0 },
              { l:"Ratio",     v:ratio, note:pass?"✓ Meets Standard":"✗ Below Standard", nc:pass?"#059669":"#DC2626" },
              { l:"Readiness", v:`${readiness}%` },
            ].map((s,i)=>(
              <div key={i} style={{ background:"#F8FAFC",
                border:"1px solid #E2E8F0", borderRadius:6,
                padding:"9px 11px" }}>
                <div style={{ fontSize:9, color:"#94A3B8",
                  fontFamily:"'IBM Plex Mono',monospace",
                  textTransform:"uppercase", letterSpacing:"0.1em",
                  marginBottom:3 }}>{s.l}</div>
                <div style={{ fontSize:15, fontWeight:700, color:"#07162F",
                  fontFamily:"'IBM Plex Mono',monospace" }}>{s.v}</div>
                {s.note && <div style={{ fontSize:10, color:s.nc,
                  marginTop:1, fontWeight:600 }}>{s.note}</div>}
              </div>
            ))}
          </div>

          {/* Readiness */}
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:"#6B7280",
              fontFamily:"'IBM Plex Mono',monospace",
              textTransform:"uppercase", letterSpacing:"0.1em",
              marginBottom:8 }}>Accreditation Readiness</div>
            <ReadinessBar value={readiness}/>
          </div>

          {/* Evidence locker */}
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:"#6B7280",
              fontFamily:"'IBM Plex Mono',monospace",
              textTransform:"uppercase", letterSpacing:"0.1em",
              marginBottom:8 }}>Evidence Locker</div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {[
                { key:"marking_schemes",  label:"Marking Schemes",  req:1  },
                { key:"lesson_notes",     label:"Lesson Notes",     req:10 },
                { key:"ca_records",       label:"CA Records",       req:1  },
                { key:"examiner_reports", label:"Examiner Reports", req:1  },
                { key:"staff_files",      label:"Staff Files",      req:1  },
              ].map(d => {
                const count = docs[d.key]||0;
                const met   = count >= d.req;
                return (
                  <div key={d.key} style={{
                    display:"flex", justifyContent:"space-between",
                    alignItems:"center", padding:"6px 10px",
                    background:met?"#F0FDF4":"#FAFAFA",
                    border:`1px solid ${met?"#BBF7D0":"#E5E7EB"}`,
                    borderRadius:5 }}>
                    <span style={{ fontSize:12, color:"#374151" }}>{d.label}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace",
                      fontSize:11, fontWeight:700,
                      color:met?"#059669":"#94A3B8" }}>
                      {count} {met?"✓":""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <button onClick={()=>{ onClose(); navigate(`/courses/${programme.id}`); }}
              style={{ ...S.btnPri, width:"100%", justifyContent:"center" }}>
              📋 View Full Detail
            </button>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <button onClick={()=>{ onClose(); navigate(`/documents?programme=${programme.id}`); }}
                style={{ ...S.btnSec, justifyContent:"center" }}>
                📤 Upload Docs
              </button>
              <button onClick={()=>{ onClose(); navigate(`/courses/${programme.id}`); }}
                style={{ ...S.btnSec, justifyContent:"center" }}>
                ✏ Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Courses Page ─────────────────────────────────────────────────────────
export default function Courses() {
  const navigate = useNavigate();
  const [programmes,    setProgrammes]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("ALL");
  const [facultyFilter, setFacultyFilter] = useState("All Faculties");
  const [sortKey,       setSortKey]       = useState("name");
  const [sortDir,       setSortDir]       = useState("asc");
  const [selected,      setSelected]      = useState(null);
  const [showAdd,       setShowAdd]       = useState(false);
  const [view,          setView]          = useState("table");
  const [usingFallback, setUsingFallback] = useState(false);
  const searchRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await programmesAPI.list();
      setProgrammes(res.data.results || res.data);
      setUsingFallback(false);
    } catch {
      setProgrammes(FALLBACK);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = programmes
    .filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.faculty.toLowerCase().includes(q);
      const matchStatus  = statusFilter==="ALL"             || p.status===statusFilter;
      const matchFaculty = facultyFilter==="All Faculties"  || p.faculty===facultyFilter;
      return matchSearch && matchStatus && matchFaculty;
    })
    .sort((a, b) => {
      let va, vb;
      if      (sortKey==="name")      { va=a.name;       vb=b.name; }
      else if (sortKey==="code")      { va=a.code;       vb=b.code; }
      else if (sortKey==="students")  { va=a.student_count; vb=b.student_count; }
      else if (sortKey==="readiness") { va=getReadinessScore(a); vb=getReadinessScore(b); }
      else if (sortKey==="milestone") { va=getNextMilestone(a).days; vb=getNextMilestone(b).days; }
      else { va=a[sortKey]||""; vb=b[sortKey]||""; }
      if (va<vb) return sortDir==="asc"?-1:1;
      if (va>vb) return sortDir==="asc"?1:-1;
      return 0;
    });

  const toggleSort = (key) => {
    if (sortKey===key) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const Th = ({ label, field }) => (
    <th onClick={()=>field&&toggleSort(field)} style={{
      padding:"11px 14px", textAlign:"left",
      fontSize:9, color:sortKey===field?"#07162F":"#94A3B8",
      fontFamily:"'IBM Plex Mono',monospace",
      letterSpacing:"0.1em", textTransform:"uppercase",
      fontWeight:700, borderBottom:"2px solid #E2E8F0",
      whiteSpace:"nowrap", cursor:field?"pointer":"default",
      background:sortKey===field?"#F8FAFC":"transparent",
      userSelect:"none",
    }}>
      {label}{field&&sortKey===field?(sortDir==="asc"?" ↑":" ↓"):""}
    </th>
  );

  return (
    <div style={{ fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",
      background:"#F0F4F8", minHeight:"100vh", padding:"32px 36px" }}>

      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:24, display:"flex",
        justifyContent:"space-between", alignItems:"flex-end",
        flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:10, color:"#94A3B8",
            fontFamily:"'IBM Plex Mono',monospace",
            letterSpacing:"0.12em", textTransform:"uppercase",
            marginBottom:4 }}>
            Accreditation Registry
          </div>
          <h1 style={{ fontSize:24, fontWeight:700, color:"#07162F",
            margin:"0 0 4px" }}>All Programmes</h1>
          <p style={{ fontSize:13, color:"#64748B", margin:0 }}>
            {loading ? "Loading…"
              : `${displayed.length} of ${programmes.length} programme${programmes.length!==1?"s":""}`}
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={load} style={S.btnSec}>🔄 Refresh</button>
          <button onClick={()=>navigate("/courses/new")} style={S.btnPri}>
            + New Programme
          </button>
        </div>
      </div>

      {/* Demo banner */}
      {usingFallback && (
        <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE",
          borderRadius:8, padding:"9px 14px", marginBottom:16,
          fontSize:12, color:"#1D4ED8",
          display:"flex", gap:8, alignItems:"center" }}>
          ℹ <strong>Demo mode</strong> — sample data shown until Django backend is connected.
        </div>
      )}

      {/* Filters */}
      <div style={{ background:"#fff", border:"1px solid #E2E8F0",
        borderRadius:10, padding:"14px 18px", marginBottom:18,
        display:"flex", gap:10, flexWrap:"wrap", alignItems:"center",
        boxShadow:"0 1px 4px rgba(7,22,47,0.06)" }}>

        {/* Search */}
        <div style={{ position:"relative", flex:"1 1 200px", minWidth:180 }}>
          <span style={{ position:"absolute", left:10, top:"50%",
            transform:"translateY(-50%)", fontSize:13,
            color:"#94A3B8" }}>🔍</span>
          <input ref={searchRef} value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Search by name, code, department…"
            style={{ ...S.input, paddingLeft:34 }}/>
        </div>

        {/* Status */}
        <select value={statusFilter}
          onChange={e=>setStatusFilter(e.target.value)}
          style={{ ...S.input, width:"auto", minWidth:160,
            color:statusFilter!=="ALL"?"#07162F":"#94A3B8" }}>
          <option value="ALL">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k,v])=>(
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {/* Faculty */}
        <select value={facultyFilter}
          onChange={e=>setFacultyFilter(e.target.value)}
          style={{ ...S.input, width:"auto", minWidth:150,
            color:facultyFilter!=="All Faculties"?"#07162F":"#94A3B8" }}>
          {FACULTIES.map(f=><option key={f}>{f}</option>)}
        </select>

        {/* View toggle */}
        <div style={{ display:"flex", border:"1px solid #E2E8F0",
          borderRadius:6, overflow:"hidden", flexShrink:0 }}>
          {["table","grid"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{
              padding:"8px 13px", border:"none", cursor:"pointer",
              fontFamily:"'IBM Plex Mono',monospace",
              fontSize:11, fontWeight:700,
              background:view===v?"#07162F":"#fff",
              color:view===v?"#fff":"#6B7280",
            }}>
              {v==="table"?"☰ Table":"⊞ Grid"}
            </button>
          ))}
        </div>

        {/* Clear */}
        {(search||statusFilter!=="ALL"||facultyFilter!=="All Faculties") && (
          <button onClick={()=>{setSearch("");setStatusFilter("ALL");setFacultyFilter("All Faculties");}}
            style={{ ...S.btnSec, fontSize:11, padding:"7px 12px",
              color:"#DC2626", borderColor:"#FCA5A5" }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Status strip */}
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {[["ALL","All",programmes.length],
          ...Object.entries(STATUS_CONFIG).map(([k,v])=>[k,v.label,programmes.filter(p=>p.status===k).length])
        ].map(([k,label,count])=>{
          const cfg = STATUS_CONFIG[k];
          return (
            <button key={k} onClick={()=>setStatusFilter(k)} style={{
              padding:"4px 11px", borderRadius:20, cursor:"pointer",
              fontFamily:"'IBM Plex Mono',monospace",
              fontSize:9, fontWeight:700, border:"1.5px solid",
              borderColor:statusFilter===k?(cfg?.color||"#07162F"):"#E2E8F0",
              background:statusFilter===k?(cfg?.bg||"#07162F"):"#fff",
              color:statusFilter===k?(cfg?.color||"#fff"):"#6B7280",
              transition:"all 0.12s",
            }}>
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* ── TABLE VIEW ── */}
      {view==="table" && (
        <div style={{ background:"#fff", borderRadius:10,
          border:"1px solid #E2E8F0",
          boxShadow:"0 1px 4px rgba(7,22,47,0.06)",
          overflow:"hidden" }}>
          {loading ? (
            <div style={{ padding:44, textAlign:"center", color:"#94A3B8",
              fontFamily:"'IBM Plex Mono',monospace" }}>
              Loading programmes…
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ padding:44, textAlign:"center",
              color:"#94A3B8", fontFamily:"'IBM Plex Mono',monospace",
              fontSize:12 }}>
              No programmes match the current filters.
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse",
                minWidth:800 }}>
                <thead>
                  <tr>
                    <Th label="Code"          field="code"/>
                    <Th label="Programme"     field="name"/>
                    <Th label="Faculty / Dept" field={null}/>
                    <Th label="Status"        field={null}/>
                    <Th label="Students"      field="students"/>
                    <Th label="Ratio"         field={null}/>
                    <Th label="Milestone"     field="milestone"/>
                    <Th label="Readiness"     field="readiness"/>
                    <Th label="Actions"       field={null}/>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((p,i)=>{
                    const m = getNextMilestone(p);
                    const { ratio, pass } = getNUCRatio(p.student_count, p.lecturer_count);
                    const readiness = getReadinessScore(p);
                    return (
                      <tr key={p.id} style={{
                        borderBottom:"1px solid #F1F5F9",
                        background:selected?.id===p.id?"#EFF6FF":i%2===0?"#fff":"#FAFBFC",
                        transition:"background 0.1s",
                      }}
                        onMouseEnter={e=>{if(selected?.id!==p.id)e.currentTarget.style.background="#F8FAFC";}}
                        onMouseLeave={e=>{if(selected?.id!==p.id)e.currentTarget.style.background=i%2===0?"#fff":"#FAFBFC";}}>
                        <td style={TD}>
                          <span style={{ fontFamily:"'IBM Plex Mono',monospace",
                            fontSize:12, fontWeight:700, color:"#07162F" }}>
                            {p.code}
                          </span>
                        </td>
                        <td style={{ ...TD, maxWidth:220 }}>
                          <div style={{ fontWeight:600, fontSize:13,
                            color:"#07162F", overflow:"hidden",
                            textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {p.name}
                          </div>
                        </td>
                        <td style={TD}>
                          <div style={{ fontSize:12, color:"#374151" }}>{p.faculty}</div>
                          <div style={{ fontSize:10, color:"#94A3B8" }}>{p.department}</div>
                        </td>
                        <td style={TD}><StatusBadge status={p.status}/></td>
                        <td style={TD}>
                          <span style={{ fontFamily:"'IBM Plex Mono',monospace",
                            fontSize:13 }}>
                            {(p.student_count||0).toLocaleString()}
                          </span>
                        </td>
                        <td style={TD}>
                          <span style={{
                            fontSize:10, fontFamily:"'IBM Plex Mono',monospace",
                            fontWeight:700, padding:"2px 7px", borderRadius:3,
                            background:pass?"#D1FAE5":"#FEE2E2",
                            color:pass?"#065F46":"#991B1B",
                            border:`1px solid ${pass?"#6EE7B7":"#FCA5A5"}`,
                          }}>
                            {pass?"✓":"✗"} {ratio}
                          </span>
                        </td>
                        <td style={TD}>
                          <div style={{ fontSize:10, fontWeight:700,
                            color:urgencyColor(m.urgency),
                            fontFamily:"'IBM Plex Mono',monospace" }}>
                            {m.label}
                          </div>
                          <div style={{ fontSize:9, color:"#94A3B8",
                            fontFamily:"'IBM Plex Mono',monospace" }}>
                            {m.urgency==="overdue"?`${Math.abs(m.days)}d overdue`:`${m.days}d`}
                          </div>
                        </td>
                        <td style={{ ...TD, minWidth:120 }}>
                          <ReadinessBar value={readiness}/>
                        </td>
                        <td style={TD}>
                          <div style={{ display:"flex", gap:5 }}>
                            <button onClick={()=>setSelected(p)}
                              style={{ padding:"4px 10px", borderRadius:5,
                                cursor:"pointer",
                                fontFamily:"'IBM Plex Mono',monospace",
                                fontSize:10, fontWeight:700,
                                background:"#EFF6FF", color:"#1D4ED8",
                                border:"1px solid #BFDBFE" }}>
                              Details
                            </button>
                            <button onClick={()=>navigate(`/courses/${p.id}`)}
                              style={{ padding:"4px 10px", borderRadius:5,
                                cursor:"pointer",
                                fontFamily:"'IBM Plex Mono',monospace",
                                fontSize:10, fontWeight:700,
                                background:"#F0FDF4", color:"#059669",
                                border:"1px solid #6EE7B7" }}>
                              Open →
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── GRID VIEW ── */}
      {view==="grid" && (
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",
          gap:14 }}>
          {loading ? (
            [...Array(6)].map((_,i)=>(
              <div key={i} style={{ height:180, background:"#fff",
                borderRadius:10, border:"1px solid #E2E8F0",
                animation:"pulse 1.5s infinite" }}/>
            ))
          ) : displayed.map(p=>{
            const m = getNextMilestone(p);
            const { ratio, pass } = getNUCRatio(p.student_count, p.lecturer_count);
            const urgent = m.urgency!=="normal";
            return (
              <div key={p.id} onClick={()=>setSelected(p)}
                style={{ background:"#fff", border:"1px solid #E2E8F0",
                  borderLeft:`4px solid ${urgent?urgencyColor(m.urgency):"#E2E8F0"}`,
                  borderRadius:10, padding:"16px 18px", cursor:"pointer",
                  boxShadow:"0 1px 4px rgba(7,22,47,0.06)",
                  transition:"all 0.18s", animation:"fadeIn 0.2s ease" }}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 20px rgba(7,22,47,0.12)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 1px 4px rgba(7,22,47,0.06)";}}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"flex-start", marginBottom:8, gap:6 }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:9, color:"#94A3B8",
                      fontFamily:"'IBM Plex Mono',monospace",
                      letterSpacing:"0.08em", textTransform:"uppercase",
                      marginBottom:2 }}>
                      {p.code} · {p.department}
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#07162F",
                      overflow:"hidden", textOverflow:"ellipsis",
                      whiteSpace:"nowrap", maxWidth:190 }}>
                      {p.name}
                    </div>
                  </div>
                  <StatusBadge status={p.status}/>
                </div>
                <div style={{ fontSize:9, fontWeight:700,
                  color:urgencyColor(m.urgency),
                  fontFamily:"'IBM Plex Mono',monospace",
                  marginBottom:8 }}>
                  ⏱ {m.label}: {m.urgency==="overdue"?`${Math.abs(m.days)}d overdue`:`${m.days}d`}
                </div>
                <div style={{ display:"flex", gap:7, alignItems:"center",
                  marginBottom:9, fontSize:11, color:"#64748B" }}>
                  <span>👨‍🎓 {(p.student_count||0).toLocaleString()}</span>
                  <span>👨‍🏫 {p.lecturer_count||0}</span>
                  <span style={{ fontSize:10,
                    fontFamily:"'IBM Plex Mono',monospace", fontWeight:700,
                    padding:"1px 5px", borderRadius:3,
                    background:pass?"#D1FAE5":"#FEE2E2",
                    color:pass?"#065F46":"#991B1B",
                    border:`1px solid ${pass?"#6EE7B7":"#FCA5A5"}` }}>
                    {pass?"✓":"✗"} {ratio}
                  </span>
                </div>
                <ReadinessBar value={getReadinessScore(p)}/>
              </div>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <AddProgrammeModal onClose={()=>setShowAdd(false)} onSuccess={load}/>
      )}

      {/* Detail slide-over */}
      {selected && (
        <DetailPanel programme={selected} onClose={()=>setSelected(null)}/>
      )}
    </div>
  );
}

const TD = { padding:"11px 14px", verticalAlign:"middle" };
const S = {
  input: {
    width:"100%", padding:"8px 12px",
    border:"1.5px solid #CBD5E1", borderRadius:7,
    fontFamily:"'IBM Plex Sans',sans-serif",
    fontSize:13, color:"#07162F", background:"#fff",
    outline:"none", boxSizing:"border-box",
    transition:"border-color 0.15s",
  },
  label: {
    fontSize:11, fontFamily:"'IBM Plex Mono',monospace",
    fontWeight:700, letterSpacing:"0.1em",
    textTransform:"uppercase", color:"#374151", display:"block",
  },
  err: { fontSize:11, color:"#DC2626", marginTop:3 },
  btnPri: {
    display:"inline-flex", alignItems:"center", gap:6,
    padding:"9px 18px", borderRadius:7, cursor:"pointer",
    fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:12,
    background:"linear-gradient(135deg,#07162F,#0C2D5E)",
    color:"#fff", border:"none",
  },
  btnSec: {
    display:"inline-flex", alignItems:"center", gap:6,
    padding:"9px 16px", borderRadius:7, cursor:"pointer",
    fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:12,
    background:"#fff", color:"#374151", border:"1.5px solid #CBD5E1",
  },
};