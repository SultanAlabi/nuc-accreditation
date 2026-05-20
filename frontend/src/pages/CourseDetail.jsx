// src/pages/CourseDetail.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useRole } from "../hooks/useRole";
import { programmesAPI, documentsAPI } from "../services/api";
import {
  STATUS_CONFIG, getNextMilestone, getNUCRatio,
  getReadinessScore, formatDate, urgencyColor, urgencyBg,
} from "../utils/accreditation";

// ── Fallback data for demo ────────────────────────────────────────────────────
const FALLBACK = {
  C001: { id:"C001", faculty:"Engineering", department:"Computer Science",
    name:"B.Eng. Computer Engineering", code:"CPE",
    start_date:"2022-09-01", status:"RESOURCE", student_count:187, lecturer_count:14,
    full_time_lecturers:10, phd_holders:7, lab_area_m2:320, book_titles:420,
    has_internet:true, has_student_lab:true, description:"A rigorous programme focusing on hardware and software systems design.",
    document_counts:{ marking_schemes:12, lesson_notes:45, ca_records:8, examiner_reports:3, staff_files:14 },
    documents:[
      { id:"D001", category:"marking_schemes",  name:"CPE301 Marking Scheme 2024.pdf", uploaded_at:"2024-02-10", verified:true,  size:"240 KB" },
      { id:"D002", category:"lesson_notes",     name:"Data Structures Lecture Notes.pdf", uploaded_at:"2024-01-22", verified:true,  size:"1.2 MB" },
      { id:"D003", category:"ca_records",       name:"300L CA Records 2023.xlsx",    uploaded_at:"2024-03-01", verified:false, size:"88 KB"  },
      { id:"D004", category:"examiner_reports", name:"External Examiner Report 2023.pdf", uploaded_at:"2023-12-15", verified:true, size:"512 KB" },
      { id:"D005", category:"staff_files",      name:"Staff CV — Dr. Emeka Obi.pdf", uploaded_at:"2024-01-05", verified:true,  size:"180 KB" },
    ],
  },
};

const DOC_CATEGORIES = [
  { key: "marking_schemes",  label: "Marking Schemes",   icon: "📝", required: 1  },
  { key: "lesson_notes",     label: "Lesson Notes",      icon: "📖", required: 10 },
  { key: "ca_records",       label: "CA Records",        icon: "📊", required: 1  },
  { key: "examiner_reports", label: "Examiner Reports",  icon: "🔍", required: 1  },
  { key: "staff_files",      label: "Staff Files",       icon: "👤", required: 1  },
  { key: "student_files",    label: "Student Files",     icon: "🎓", required: 1  },
  { key: "qa_reports",       label: "QA Reports",        icon: "✅", required: 1  },
  { key: "research_evidence",label: "Research Evidence", icon: "🔬", required: 1  },
];

const STATUS_FLOW = ["PENDING","APPROVED","RESOURCE","ACCREDITED","REACCREDIT"];

// ── Sub components ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:6,
      padding:"4px 12px", borderRadius:4,
      background:c.bg, color:c.color, border:`1px solid ${c.border}`,
      fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700,
      letterSpacing:"0.05em", textTransform:"uppercase", whiteSpace:"nowrap" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:c.dot }} />
      {c.label}
    </span>
  );
}

function ReadinessBar({ value, large }) {
  const color = value>=80?"#059669":value>=50?"#D97706":"#DC2626";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ flex:1, height: large?8:5, background:"#E5E7EB",
        borderRadius:9999, overflow:"hidden" }}>
        <div style={{ width:`${value}%`, height:"100%", background:color,
          borderRadius:9999, transition:"width 0.7s ease" }} />
      </div>
      <span style={{ fontFamily:"'IBM Plex Mono',monospace",
        fontSize: large?16:11, fontWeight:700, color, minWidth:36 }}>
        {value}%
      </span>
    </div>
  );
}

function StatCard({ label, value, note, noteColor, mono }) {
  return (
    <div style={{ background:"#F8FAFC", border:"1px solid #E2E8F0",
      borderRadius:8, padding:"14px 16px" }}>
      <div style={{ fontSize:9, color:"#94A3B8", fontFamily:"'IBM Plex Mono',monospace",
        textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color:"#07162F",
        fontFamily: mono?"'IBM Plex Mono',monospace":"inherit", lineHeight:1 }}>{value}</div>
      {note && <div style={{ fontSize:11, color:noteColor||"#94A3B8", marginTop:4, fontWeight:600 }}>{note}</div>}
    </div>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
      marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em",
        color:"#6B7280", textTransform:"uppercase",
        fontFamily:"'IBM Plex Mono',monospace" }}>
        {children}
      </div>
      {action}
    </div>
  );
}

// ── Upload Modal ──────────────────────────────────────────────────────────────
function UploadModal({ programmeId, onClose, onSuccess }) {
  const [category, setCategory] = useState("");
  const [file,     setFile]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleUpload = async () => {
    if (!category) { setError("Select a document category."); return; }
    if (!file)     { setError("Choose a file to upload.");    return; }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("category", category);
      fd.append("file",     file);
      fd.append("file_name", file.name);
      await documentsAPI.upload(programmeId, fd);
      onSuccess?.();
      onClose();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0,
      background:"rgba(7,22,47,0.75)", display:"flex", alignItems:"center",
      justifyContent:"center", zIndex:500, backdropFilter:"blur(4px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff",
        borderRadius:12, width:"min(500px,95vw)",
        boxShadow:"0 25px 80px rgba(7,22,47,0.35)", border:"1px solid #CBD5E1",
        overflow:"hidden" }}>
        <div style={{ background:"linear-gradient(135deg,#07162F,#0C2D5E)",
          padding:"20px 24px", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:14, right:14,
            width:28, height:28, borderRadius:"50%",
            background:"rgba(255,255,255,0.1)", border:"none", color:"#fff",
            fontSize:16, cursor:"pointer", display:"flex",
            alignItems:"center", justifyContent:"center" }}>×</button>
          <div style={{ fontSize:9, color:"#94A3B8", fontFamily:"'IBM Plex Mono',monospace",
            letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>
            Evidence Locker
          </div>
          <div style={{ fontSize:17, fontWeight:700, color:"#fff" }}>Upload Document</div>
        </div>

        <div style={{ padding:"22px 24px", display:"flex", flexDirection:"column", gap:16 }}>
          {error && (
            <div style={{ background:"#FEE2E2", border:"1px solid #FCA5A5",
              color:"#DC2626", borderRadius:7, padding:"10px 14px", fontSize:12 }}>
              ⚠ {error}
            </div>
          )}

          <div>
            <label style={ms.label}>Document Category *</label>
            <select value={category} onChange={e=>setCategory(e.target.value)}
              style={{ ...ms.input, color:category?"#07162F":"#94A3B8" }}>
              <option value="">Select category…</option>
              {DOC_CATEGORIES.map(c=>(
                <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={ms.label}>File *</label>
            <div style={{
              border: file ? "2px solid #059669" : "2px dashed #CBD5E1",
              borderRadius:8, padding:"20px", textAlign:"center",
              background: file ? "#F0FDF4" : "#FAFAFA", cursor:"pointer",
              transition:"all 0.15s",
            }}
              onClick={()=>document.getElementById("file-upload").click()}
            >
              <input id="file-upload" type="file" style={{ display:"none" }}
                onChange={e=>setFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.png" />
              {file ? (
                <div>
                  <div style={{ fontSize:24, marginBottom:6 }}>📄</div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#065F46" }}>{file.name}</div>
                  <div style={{ fontSize:11, color:"#6B7280", marginTop:3 }}>
                    {(file.size/1024).toFixed(0)} KB
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize:28, marginBottom:8, opacity:0.4 }}>📁</div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#374151" }}>
                    Click to choose file
                  </div>
                  <div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>
                    PDF, Word, Excel, JPG, PNG — max 20 MB
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display:"flex", gap:10, marginTop:4 }}>
            <button onClick={onClose} style={{ ...ms.btnSec, flex:1, justifyContent:"center" }}>
              Cancel
            </button>
            <button onClick={handleUpload} disabled={loading}
              style={{ ...ms.btnPri, flex:2, justifyContent:"center",
                opacity:loading?0.7:1 }}>
              {loading ? "Uploading…" : "📤 Upload Document"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main CourseDetail Page ────────────────────────────────────────────────────
export default function CourseDetail() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { isNUCVisitor, can } = useRole();
  const location      = useLocation();

  const [programme, setProgramme] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showUpload, setShowUpload] = useState(false);
  const [toast,     setToast]     = useState(location.state?.toast || "");
  const [docFilter, setDocFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [progRes, docRes] = await Promise.all([
        programmesAPI.get(id),
        documentsAPI.list(id),
      ]);
      const p = progRes.data;
      const enriched = p ? {
        ...p,
        code: p.code || (p.name ? p.name.split(" ").map(w => w[0]).join("").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() : "PRG"),
        start_date: p.start_date || p.created_at || new Date().toISOString(),
        lecturer_count: p.lecturer_count || p.staff_count || 0,
        document_counts: p.document_counts || {
          marking_schemes: 5,
          lesson_notes: 12,
          ca_records: 6,
          examiner_reports: 2,
          staff_files: p.staff_count || 5
        }
      } : null;
      setProgramme(enriched);
      setDocuments(docRes.data.results || docRes.data);
    } catch {
      // Fallback to demo data
      const fallback = FALLBACK[id] || Object.values(FALLBACK)[0];
      setProgramme(fallback);
      setDocuments(fallback.documents || []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (toast) { const t = setTimeout(()=>setToast(""), 4000); return ()=>clearTimeout(t); }
  }, [toast]);

  if (loading) return (
    <div style={{ padding:80, textAlign:"center", fontFamily:"'IBM Plex Mono',monospace",
      color:"#94A3B8", fontSize:13 }}>
      Loading programme…
    </div>
  );
  if (!programme) return (
    <div style={{ padding:80, textAlign:"center" }}>
      <div style={{ fontSize:32, marginBottom:12 }}>⚠</div>
      <div style={{ fontFamily:"'IBM Plex Mono',monospace", color:"#64748B" }}>
        Programme not found.{" "}
        <Link to="/courses" style={{ color:"#2563EB" }}>Back to Courses</Link>
      </div>
    </div>
  );

  const milestone   = getNextMilestone(programme);
  const { ratio, pass } = getNUCRatio(programme.student_count, programme.lecturer_count);
  const readiness   = getReadinessScore(programme);
  const docs        = programme.document_counts || {};
  const stepIndex   = STATUS_FLOW.indexOf(programme.status);

  const filteredDocs = docFilter === "all"
    ? documents
    : documents.filter(d => d.category === docFilter);

  const TABS = ["overview","documents","milestones","resources","team"];

  return (
    <div style={{ fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",
      background:"#F0F4F8", minHeight:"100vh" }}>

      {/* Read-only banner for NUC Visitor */}
      {isNUCVisitor && (
        <div style={{
          background:"#EDE9FE", border:"1px solid #C4B5FD",
          borderRadius:0, padding:"10px 40px",
          fontSize:12, color:"#7C3AED",
          display:"flex", alignItems:"center", gap:8,
          fontFamily:"'IBM Plex Mono',monospace", fontWeight:600,
        }}>
          🔍 You are viewing as an NUC Visitor — read-only access to verified documents only.
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:900,
          background:"#07162F", color:"#fff", padding:"12px 20px",
          borderRadius:8, boxShadow:"0 8px 24px rgba(7,22,47,0.3)",
          fontSize:13, fontWeight:600, borderLeft:"3px solid #22D3EE",
          animation:"fadeIn 0.2s ease" }}>
          ✓ {toast}
        </div>
      )}

      {/* ── Hero header ── */}
      <div style={{ background:"linear-gradient(135deg,#07162F 0%,#0C2D5E 100%)",
        padding:"28px 40px 0", position:"relative", overflow:"hidden" }}>
        {/* Subtle grid */}
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.04 }} xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22D3EE" strokeWidth="0.8"/>
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>

        <div style={{ position:"relative" }}>
          {/* Breadcrumb */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18,
            fontSize:11, fontFamily:"'IBM Plex Mono',monospace" }}>
            <Link to="/courses" style={{ color:"#64748B", textDecoration:"none" }}>Courses</Link>
            <span style={{ color:"#475569" }}>/</span>
            <span style={{ color:"#94A3B8" }}>{programme.code}</span>
          </div>

          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"flex-start", flexWrap:"wrap", gap:16 }}>
            <div>
              <div style={{ fontSize:10, color:"#94A3B8",
                fontFamily:"'IBM Plex Mono',monospace",
                letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:6 }}>
                {programme.code} · {programme.faculty} · {programme.department}
              </div>
              <h1 style={{ fontSize:26, fontWeight:700, color:"#fff",
                margin:"0 0 12px", lineHeight:1.25 }}>
                {programme.name}
              </h1>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <StatusBadge status={programme.status}/>
                <span style={{ fontSize:11, color:"#64748B",
                  fontFamily:"'IBM Plex Mono',monospace" }}>
                  Started {formatDate(programme.start_date)}
                </span>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <button onClick={()=>setShowUpload(true)} style={ds.btnPri}>
                📤 Upload Documents
              </button>
              <button onClick={()=>navigate(`/courses`)} style={ds.btnGhost}>
                ← All Courses
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display:"flex", gap:0, marginTop:24 }}>
            {TABS.map(tab => (
              <button key={tab} onClick={()=>setActiveTab(tab)} style={{
                padding:"10px 18px", border:"none", cursor:"pointer",
                fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:600,
                background:"transparent", textTransform:"capitalize",
                color: activeTab===tab ? "#22D3EE" : "#64748B",
                borderBottom: activeTab===tab ? "2px solid #22D3EE" : "2px solid transparent",
                transition:"all 0.12s", letterSpacing:"0.06em",
              }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:"28px 40px" }}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab==="overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

            {/* Milestone alert */}
            <div style={{ background:ubg(milestone.urgency),
              border:`1px solid ${urgencyColor(milestone.urgency)}44`,
              borderLeft:`4px solid ${urgencyColor(milestone.urgency)}`,
              borderRadius:8, padding:"14px 18px",
              display:"flex", justifyContent:"space-between",
              alignItems:"center", flexWrap:"wrap", gap:12 }}>
              <div>
                <div style={{ fontSize:10, fontFamily:"'IBM Plex Mono',monospace",
                  letterSpacing:"0.1em", textTransform:"uppercase",
                  color:urgencyColor(milestone.urgency), fontWeight:700, marginBottom:4 }}>
                  Next Milestone
                </div>
                <div style={{ fontSize:16, fontWeight:700,
                  color:urgencyColor(milestone.urgency) }}>
                  {milestone.label} — {formatDate(milestone.date)}
                </div>
                <div style={{ fontSize:12, color:urgencyColor(milestone.urgency), marginTop:3 }}>
                  {milestone.urgency==="overdue"
                    ? `${Math.abs(milestone.days)} days OVERDUE`
                    : `${milestone.days} days remaining`}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10, color:"#94A3B8",
                  fontFamily:"'IBM Plex Mono',monospace",
                  textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>
                  Accreditation Readiness
                </div>
                <ReadinessBar value={readiness} large />
              </div>
            </div>

            {/* NUC Workflow */}
            <div style={{ background:"#fff", border:"1px solid #E2E8F0",
              borderRadius:10, padding:"20px 24px",
              boxShadow:"0 1px 4px rgba(7,22,47,0.06)" }}>
              <SectionTitle>NUC Accreditation Workflow</SectionTitle>
              <div style={{ display:"flex", alignItems:"center" }}>
                {STATUS_FLOW.map((status, i) => {
                  const done    = i <= stepIndex;
                  const active  = i === stepIndex;
                  const cfg     = STATUS_CONFIG[status];
                  return (
                    <div key={status} style={{ display:"flex", alignItems:"center",
                      flex: i < STATUS_FLOW.length-1 ? 1 : 0 }}>
                      <div style={{ display:"flex", flexDirection:"column",
                        alignItems:"center", gap:6 }}>
                        <div style={{
                          width:32, height:32, borderRadius:"50%",
                          background: active ? cfg.color : done ? "#059669" : "#E5E7EB",
                          color:"#fff", display:"flex", alignItems:"center",
                          justifyContent:"center", fontSize:12, fontWeight:700,
                          border:`2px solid ${active ? cfg.color : done ? "#047857" : "#D1D5DB"}`,
                          boxShadow: active ? `0 0 0 3px ${cfg.color}33` : "none",
                          flexShrink:0,
                        }}>
                          {done && !active ? "✓" : i+1}
                        </div>
                        <span style={{ fontSize:9, textAlign:"center", maxWidth:74,
                          fontFamily:"'IBM Plex Mono',monospace", lineHeight:1.3,
                          color: active ? cfg.color : done ? "#065F46" : "#9CA3AF",
                          fontWeight: done || active ? 700 : 400 }}>
                          {cfg.label}
                        </span>
                      </div>
                      {i < STATUS_FLOW.length-1 && (
                        <div style={{ flex:1, height:2, margin:"0 4px", marginBottom:22,
                          background: i < stepIndex ? "#059669" : "#E5E7EB",
                          transition:"background 0.3s" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
              <StatCard label="Students Enrolled" value={(programme.student_count||0).toLocaleString()} mono />
              <StatCard label="Lecturers" value={programme.lecturer_count||0} mono />
              <StatCard label="Student:Lecturer Ratio" value={ratio} mono
                note={pass ? "✓ Meets NUC Standard (≤30:1)" : "✗ Below NUC Standard (≤30:1)"}
                noteColor={pass?"#059669":"#DC2626"} />
              <StatCard label="Full-time Lecturers"
                value={programme.full_time_lecturers||"—"} mono
                note={programme.full_time_lecturers && programme.lecturer_count
                  ? `${((programme.full_time_lecturers/programme.lecturer_count)*100).toFixed(0)}% of staff (min 60%)`
                  : "NUC standard: ≥ 60%"}
                noteColor={programme.full_time_lecturers && programme.lecturer_count
                  ? programme.full_time_lecturers/programme.lecturer_count >= 0.6 ? "#059669" : "#DC2626"
                  : "#94A3B8"} />
              <StatCard label="PhD Holders"
                value={programme.phd_holders||"—"} mono
                note={programme.phd_holders && programme.lecturer_count
                  ? `${((programme.phd_holders/programme.lecturer_count)*100).toFixed(0)}% of staff (min 40%)`
                  : "NUC standard: ≥ 40%"}
                noteColor={programme.phd_holders && programme.lecturer_count
                  ? programme.phd_holders/programme.lecturer_count >= 0.4 ? "#059669" : "#DC2626"
                  : "#94A3B8"} />
              <StatCard label="Programme Start"
                value={formatDate(programme.start_date)} />
            </div>

            {/* Description */}
            {programme.description && (
              <div style={{ background:"#fff", border:"1px solid #E2E8F0",
                borderRadius:10, padding:"20px 24px",
                boxShadow:"0 1px 4px rgba(7,22,47,0.06)" }}>
                <SectionTitle>About This Programme</SectionTitle>
                <p style={{ fontSize:13, color:"#374151", lineHeight:1.7, margin:0 }}>
                  {programme.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTS TAB ── */}
        {activeTab==="documents" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* Category overview */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
              {DOC_CATEGORIES.slice(0,8).map(cat => {
                const count = docs[cat.key] || 0;
                const met   = count >= cat.required;
                return (
                  <div key={cat.key} onClick={()=>setDocFilter(cat.key===docFilter?"all":cat.key)}
                    style={{
                      background: docFilter===cat.key ? (met?"#F0FDF4":"#FEF2F2") : "#fff",
                      border:`1px solid ${docFilter===cat.key ? (met?"#BBF7D0":"#FECACA") : "#E2E8F0"}`,
                      borderRadius:8, padding:"12px 14px", cursor:"pointer",
                      transition:"all 0.15s",
                      boxShadow:"0 1px 4px rgba(7,22,47,0.04)",
                    }}>
                    <div style={{ fontSize:20, marginBottom:6 }}>{cat.icon}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:"#07162F",
                      marginBottom:3, lineHeight:1.3 }}>{cat.label}</div>
                    <div style={{ display:"flex", alignItems:"center",
                      justifyContent:"space-between" }}>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace",
                        fontSize:16, fontWeight:700,
                        color: met?"#059669":"#DC2626" }}>{count}</span>
                      <span style={{ fontSize:10,
                        color: met?"#059669":"#DC2626", fontWeight:600 }}>
                        {met ? "✓" : `need ${cat.required}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Documents list */}
            <div style={{ background:"#fff", border:"1px solid #E2E8F0",
              borderRadius:10, boxShadow:"0 1px 4px rgba(7,22,47,0.06)",
              overflow:"hidden" }}>
              <div style={{ padding:"14px 20px", borderBottom:"1px solid #E2E8F0",
                display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#07162F" }}>
                  {docFilter==="all" ? "All Documents" : DOC_CATEGORIES.find(c=>c.key===docFilter)?.label}
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace",
                    fontSize:11, color:"#94A3B8", marginLeft:8 }}>
                    ({filteredDocs.length})
                  </span>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {docFilter!=="all" && (
                    <button onClick={()=>setDocFilter("all")}
                      style={{ ...ds.btnSec, fontSize:11, padding:"6px 12px",
                        color:"#DC2626", borderColor:"#FCA5A5" }}>
                      ✕ Clear filter
                    </button>
                  )}
                  <button onClick={()=>setShowUpload(true)} style={ds.btnPri}>
                    📤 Upload
                  </button>
                </div>
              </div>

              {filteredDocs.length === 0 ? (
                <div style={{ padding:"40px 20px", textAlign:"center",
                  color:"#94A3B8", fontFamily:"'IBM Plex Mono',monospace", fontSize:12 }}>
                  No documents in this category yet.{" "}
                  <button onClick={()=>setShowUpload(true)}
                    style={{ background:"none", border:"none", color:"#2563EB",
                      fontFamily:"inherit", cursor:"pointer", fontWeight:700, fontSize:12 }}>
                    Upload the first one →
                  </button>
                </div>
              ) : (
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      {["Document","Category","Uploaded","Size","Status","Actions"].map(h=>(
                        <th key={h} style={{ padding:"10px 16px", textAlign:"left",
                          fontSize:9, color:"#94A3B8",
                          fontFamily:"'IBM Plex Mono',monospace",
                          letterSpacing:"0.1em", textTransform:"uppercase",
                          fontWeight:700, borderBottom:"1px solid #E2E8F0",
                          whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map((doc, i) => {
                      const cat = DOC_CATEGORIES.find(c=>c.key===doc.category);
                      return (
                        <tr key={doc.id} style={{ borderBottom:"1px solid #F1F5F9",
                          background:i%2===0?"#fff":"#FAFBFC" }}>
                          <td style={{ padding:"11px 16px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ fontSize:18 }}>{cat?.icon||"📄"}</span>
                              <div>
                                <div style={{ fontSize:12, fontWeight:600,
                                  color:"#07162F" }}>{doc.name || doc.file_name}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:"11px 16px" }}>
                            <span style={{ fontSize:10,
                              fontFamily:"'IBM Plex Mono',monospace",
                              background:"#EFF6FF", color:"#1D4ED8",
                              border:"1px solid #BFDBFE",
                              padding:"2px 7px", borderRadius:3, fontWeight:600 }}>
                              {cat?.label || doc.category}
                            </span>
                          </td>
                          <td style={{ padding:"11px 16px",
                            fontFamily:"'IBM Plex Mono',monospace",
                            fontSize:11, color:"#64748B" }}>
                            {formatDate(doc.uploaded_at)}
                          </td>
                          <td style={{ padding:"11px 16px",
                            fontFamily:"'IBM Plex Mono',monospace",
                            fontSize:11, color:"#64748B" }}>
                            {doc.size || "—"}
                          </td>
                          <td style={{ padding:"11px 16px" }}>
                            <span style={{
                              fontSize:10, fontFamily:"'IBM Plex Mono',monospace",
                              fontWeight:700, padding:"2px 8px", borderRadius:3,
                              background: doc.verified ? "#D1FAE5" : "#FEF3C7",
                              color: doc.verified ? "#065F46" : "#92400E",
                              border:`1px solid ${doc.verified ? "#6EE7B7" : "#FCD34D"}`,
                            }}>
                              {doc.verified ? "✓ Verified" : "⏳ Pending"}
                            </span>
                          </td>
                          <td style={{ padding:"11px 16px" }}>
                            <div style={{ display:"flex", gap:6 }}>
                              <button style={{ padding:"4px 10px", borderRadius:4,
                                background:"#EFF6FF", border:"1px solid #BFDBFE",
                                color:"#1D4ED8", fontFamily:"'IBM Plex Mono',monospace",
                                fontSize:10, fontWeight:700, cursor:"pointer" }}>
                                View
                              </button>
                              <button style={{ padding:"4px 10px", borderRadius:4,
                                background:"#FEF2F2", border:"1px solid #FECACA",
                                color:"#DC2626", fontFamily:"'IBM Plex Mono',monospace",
                                fontSize:10, fontWeight:700, cursor:"pointer" }}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── MILESTONES TAB ── */}
        {activeTab==="milestones" && (
          <div style={{ background:"#fff", border:"1px solid #E2E8F0",
            borderRadius:10, padding:"24px",
            boxShadow:"0 1px 4px rgba(7,22,47,0.06)" }}>
            <SectionTitle>Accreditation Timeline</SectionTitle>
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {[
                { year:0,  label:"Application Submitted",     status:"done",   date:programme.start_date },
                { year:0,  label:"APU Approval / Take-off",   status: stepIndex>=1?"done":"upcoming", date:programme.start_date },
                { year:3,  label:"Resource Visit",            status: stepIndex>=2?"done": stepIndex===1?"active":"upcoming", date:null },
                { year:5,  label:"Full Accreditation",        status: stepIndex>=3?"done": stepIndex===2?"active":"upcoming", date:null },
                { year:10, label:"Re-accreditation",          status: stepIndex>=4?"done": stepIndex===3?"active":"upcoming", date:null },
              ].map((m, i) => (
                <div key={i} style={{ display:"flex", gap:16, paddingBottom:24,
                  position:"relative" }}>
                  {/* Vertical line */}
                  {i < 4 && (
                    <div style={{ position:"absolute", left:11, top:24, bottom:0,
                      width:2, background:m.status==="done"?"#059669":"#E2E8F0" }} />
                  )}
                  {/* Circle */}
                  <div style={{ width:24, height:24, borderRadius:"50%", flexShrink:0,
                    background: m.status==="done"?"#059669": m.status==="active"?"#2563EB":"#E5E7EB",
                    border:`2px solid ${m.status==="done"?"#047857": m.status==="active"?"#1D4ED8":"#D1D5DB"}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:11, fontWeight:700, color:"#fff",
                    boxShadow: m.status==="active"?"0 0 0 4px rgba(37,99,235,0.15)":"none",
                    zIndex:1, position:"relative" }}>
                    {m.status==="done" ? "✓" : i+1}
                  </div>
                  <div style={{ paddingTop:1 }}>
                    <div style={{ fontSize:14, fontWeight:700,
                      color: m.status==="upcoming"?"#9CA3AF":"#07162F",
                      marginBottom:3 }}>
                      {m.label}
                    </div>
                    <div style={{ display:"flex", gap:10, alignItems:"center",
                      flexWrap:"wrap" }}>
                      {m.year > 0 && (
                        <span style={{ fontSize:11, fontFamily:"'IBM Plex Mono',monospace",
                          color:"#64748B" }}>
                          Year {m.year} · {formatDate(
                            new Date(new Date(programme.start_date).setFullYear(
                              new Date(programme.start_date).getFullYear() + m.year
                            )).toISOString()
                          )}
                        </span>
                      )}
                      {m.date && m.year===0 && (
                        <span style={{ fontSize:11, fontFamily:"'IBM Plex Mono',monospace",
                          color:"#64748B" }}>{formatDate(m.date)}</span>
                      )}
                      <span style={{
                        fontSize:10, fontFamily:"'IBM Plex Mono',monospace",
                        fontWeight:700, padding:"1px 7px", borderRadius:3,
                        background: m.status==="done"?"#D1FAE5": m.status==="active"?"#DBEAFE":"#F1F5F9",
                        color: m.status==="done"?"#065F46": m.status==="active"?"#1D4ED8":"#94A3B8",
                        border:`1px solid ${m.status==="done"?"#6EE7B7": m.status==="active"?"#BFDBFE":"#E2E8F0"}`,
                      }}>
                        {m.status==="done"?"Completed": m.status==="active"?"In Progress":"Upcoming"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RESOURCES TAB ── */}
        {activeTab==="resources" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            {[
              { title:"Physical Facilities", items:[
                { l:"Lab Area",      v:programme.lab_area_m2  ? `${programme.lab_area_m2} m²` : "—",
                  note: programme.lab_area_m2 && programme.student_count
                    ? parseFloat(programme.lab_area_m2)>=programme.student_count*1.5 ? "✓ Meets standard" : "✗ Below standard"
                    : null,
                  nc: programme.lab_area_m2 && programme.student_count
                    ? parseFloat(programme.lab_area_m2)>=programme.student_count*1.5?"#059669":"#DC2626"
                    : "#94A3B8" },
                { l:"No. of Labs",   v:programme.lab_count    || "—" },
                { l:"Internet",      v:programme.has_internet     ? "✓ Available" : "✗ Not available" },
                { l:"Student Lab",   v:programme.has_student_lab  ? "✓ Available" : "✗ Not available" },
              ]},
              { title:"Library & Research", items:[
                { l:"Book Titles",   v:programme.book_titles  ? programme.book_titles.toLocaleString() : "—",
                  note:"NUC standard: ≥ 2 titles per course unit" },
              ]},
            ].map(section=>(
              <div key={section.title} style={{ background:"#fff",
                border:"1px solid #E2E8F0", borderRadius:10,
                boxShadow:"0 1px 4px rgba(7,22,47,0.06)", overflow:"hidden" }}>
                <div style={{ padding:"14px 20px", borderBottom:"1px solid #E2E8F0",
                  fontSize:12, fontWeight:700, color:"#07162F" }}>
                  {section.title}
                </div>
                <div style={{ padding:"8px 20px 16px" }}>
                  {section.items.map(item=>(
                    <div key={item.l} style={{ padding:"10px 0",
                      borderBottom:"1px solid #F1F5F9",
                      display:"flex", justifyContent:"space-between", gap:12 }}>
                      <span style={{ fontSize:12, color:"#6B7280" }}>{item.l}</span>
                      <div style={{ textAlign:"right" }}>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace",
                          fontSize:12, fontWeight:700, color:"#07162F" }}>{item.v}</span>
                        {item.note && (
                          <div style={{ fontSize:10, color:item.nc||"#94A3B8",
                            marginTop:2, fontWeight:600 }}>{item.note}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TEAM TAB ── */}
        {activeTab==="team" && (
          <div style={{ background:"#fff", border:"1px solid #E2E8F0",
            borderRadius:10, padding:"24px",
            boxShadow:"0 1px 4px rgba(7,22,47,0.06)" }}>
            <SectionTitle
              action={
                <button style={ds.btnPri}>+ Invite Team Member</button>
              }>
              Accreditation Review Team
            </SectionTitle>
            <div style={{ background:"#F8FAFC", border:"1px solid #E2E8F0",
              borderRadius:8, padding:"20px", textAlign:"center",
              color:"#94A3B8", fontFamily:"'IBM Plex Mono',monospace", fontSize:12 }}>
              <div style={{ fontSize:32, marginBottom:10 }}>👥</div>
              No team members have been assigned yet.<br/>
              <button onClick={()=>{}} style={{ marginTop:12, ...ds.btnSec, fontSize:12 }}>
                Invite NUC Visiting Team
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          programmeId={id}
          onClose={()=>setShowUpload(false)}
          onSuccess={()=>{ load(); setToast("Document uploaded successfully."); }}
        />
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const ds = {
  btnPri: {
    display:"inline-flex", alignItems:"center", gap:6,
    padding:"9px 16px", borderRadius:7, cursor:"pointer",
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
  btnGhost: {
    display:"inline-flex", alignItems:"center", gap:6,
    padding:"9px 16px", borderRadius:7, cursor:"pointer",
    fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:12,
    background:"rgba(255,255,255,0.07)", color:"#94A3B8",
    border:"1px solid rgba(255,255,255,0.12)",
  },
};
const ms = {
  label: {
    fontSize:11, fontFamily:"'IBM Plex Mono',monospace",
    fontWeight:700, letterSpacing:"0.1em",
    textTransform:"uppercase", color:"#374151",
    marginBottom:7, display:"block",
  },
  input: {
    width:"100%", padding:"10px 13px",
    border:"1.5px solid #CBD5E1", borderRadius:7,
    fontFamily:"'IBM Plex Sans',sans-serif",
    fontSize:13, color:"#07162F", background:"#fff",
    outline:"none", boxSizing:"border-box",
  },
  btnPri: {
    display:"flex", alignItems:"center", gap:6,
    padding:"11px", borderRadius:7, cursor:"pointer",
    fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:12,
    background:"linear-gradient(135deg,#07162F,#0C2D5E)",
    color:"#fff", border:"none",
  },
  btnSec: {
    display:"flex", alignItems:"center", gap:6,
    padding:"11px", borderRadius:7, cursor:"pointer",
    fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:12,
    background:"#fff", color:"#374151", border:"1.5px solid #CBD5E1",
  },
};

function ubg(u) { return u==="overdue"?"#FEE2E2":u==="urgent"?"#FEF3C7":"#D1FAE5"; }