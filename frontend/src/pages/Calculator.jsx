// src/pages/Calculator.jsx
//
// NUC Resource Calculator
// Checks student:lecturer ratio, staff qualifications, and lab space
// against NUC minimum accreditation standards in real time.

import { useState, useCallback } from "react";
import { programmesAPI } from "../services/api";

// ── NUC Standards ─────────────────────────────────────────────────────────────
const STANDARDS = [
  {
    id:       "ratio",
    label:    "Student : Lecturer Ratio",
    standard: "≤ 30:1",
    limit:    30,
    unit:     ":1",
    icon:     "👨‍🎓",
    desc:     "The number of enrolled students per academic staff member.",
  },
  {
    id:       "fulltime",
    label:    "Full-time Academic Staff",
    standard: "≥ 60%",
    limit:    60,
    unit:     "%",
    icon:     "👨‍🏫",
    desc:     "Percentage of lecturers employed full-time (not visiting/adjunct).",
  },
  {
    id:       "phd",
    label:    "PhD Holders",
    standard: "≥ 40%",
    limit:    40,
    unit:     "%",
    icon:     "🎓",
    desc:     "Percentage of academic staff holding a doctoral degree.",
  },
  {
    id:       "lab",
    label:    "Lab Space per Student",
    standard: "≥ 1.5 m²",
    limit:    1.5,
    unit:     " m²",
    icon:     "🔬",
    desc:     "Minimum floor area per student in laboratory/studio spaces.",
  },
  {
    id:       "books",
    label:    "Library Titles per Unit",
    standard: "≥ 2 titles",
    limit:    2,
    unit:     " titles",
    icon:     "📚",
    desc:     "Unique library titles per course unit offered in the programme.",
  },
];

const DISCIPLINE_PRESETS = [
  { label: "Engineering",         ratio: 20, fulltime: 70, phd: 50, lab: 2.0, books: 3 },
  { label: "Natural Sciences",    ratio: 25, fulltime: 65, phd: 45, lab: 1.8, books: 3 },
  { label: "Medicine / Health",   ratio: 10, fulltime: 80, phd: 60, lab: 2.5, books: 4 },
  { label: "Law",                 ratio: 30, fulltime: 60, phd: 40, lab: 0,   books: 5 },
  { label: "Social Sciences",     ratio: 30, fulltime: 60, phd: 40, lab: 0,   books: 2 },
  { label: "Arts & Humanities",   ratio: 30, fulltime: 60, phd: 40, lab: 0,   books: 2 },
  { label: "Management Sciences", ratio: 30, fulltime: 60, phd: 40, lab: 0,   books: 2 },
  { label: "Education",           ratio: 30, fulltime: 60, phd: 40, lab: 0.5, books: 2 },
];

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

function ResultCard({ check, value }) {
  const pass   = check.pass;
  const color  = pass ? "#059669" : "#DC2626";
  const bg     = pass ? "linear-gradient(135deg,#D1FAE5,#A7F3D0)" : "linear-gradient(135deg,#FEE2E2,#FECACA)";
  const border = pass ? "#6EE7B7" : "#FCA5A5";

  return (
    <div style={{
      background: bg, border: `1px solid ${border}`,
      borderRadius: 10, padding: "16px 18px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace",
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: color, fontWeight: 700 }}>
          {check.icon} {check.label}
        </div>
        <span style={{
          fontSize: 10, fontFamily: "'IBM Plex Mono',monospace",
          fontWeight: 700, padding: "2px 8px", borderRadius: 3,
          background: pass ? "#fff" : "#fff",
          color, border: `1px solid ${border}`,
        }}>
          {pass ? "✓ PASS" : "✗ FAIL"}
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace",
        color, lineHeight: 1 }}>
        {value}{check.unit}
      </div>
      <div style={{ fontSize: 11, color, marginTop: 5, fontWeight: 600 }}>
        NUC Standard: {check.standard}
      </div>
      {!pass && check.fix && (
        <div style={{ marginTop: 8, padding: "7px 10px",
          background: "rgba(255,255,255,0.6)", borderRadius: 6,
          fontSize: 11, color: "#991B1B", lineHeight: 1.5 }}>
          ⚡ {check.fix}
        </div>
      )}
    </div>
  );
}

function NumberInput({ label, value, onChange, min = 0, max = 9999,
  step = 1, hint, disabled = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={st.label}>{label}</label>
      <input
        type="number" value={value} min={min} max={max} step={step}
        disabled={disabled}
        onChange={e => onChange(clamp(parseFloat(e.target.value) || 0, min, max))}
        style={{ ...st.input, background: disabled ? "#F8FAFC" : "#fff",
          color: disabled ? "#94A3B8" : "#07162F" }}
      />
      <input type="range" value={value} min={min} max={max} step={step}
        disabled={disabled}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "#07162F",
          opacity: disabled ? 0.4 : 1 }}
      />
      {hint && <div style={st.hint}>{hint}</div>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Calculator() {
  const [students,        setStudents]        = useState(150);
  const [lecturers,       setLecturers]       = useState(12);
  const [fulltimeStaff,   setFulltimeStaff]   = useState(8);
  const [phdHolders,      setPhdHolders]      = useState(6);
  const [labAreaM2,       setLabAreaM2]       = useState(240);
  const [courseUnits,     setCourseUnits]     = useState(30);
  const [bookTitles,      setBookTitles]      = useState(80);
  const [discipline,      setDiscipline]      = useState("");
  const [saveStatus,      setSaveStatus]      = useState(""); // "" | "saving" | "saved" | "error"
  const [programmes,      setProgrammes]      = useState([]);
  const [targetProg,      setTargetProg]      = useState("");
  const [loadingProgs,    setLoadingProgs]    = useState(false);

  // ── Computed checks ──────────────────────────────────────────────────────────
  const ratio        = lecturers > 0 ? students / lecturers : Infinity;
  const fulltimePct  = lecturers > 0 ? (fulltimeStaff / lecturers) * 100 : 0;
  const phdPct       = lecturers > 0 ? (phdHolders    / lecturers) * 100 : 0;
  const labPerStudent = students > 0  ? labAreaM2 / students : 0;
  const booksPerUnit  = courseUnits > 0 ? bookTitles / courseUnits : 0;

  const checks = [
    {
      id: "ratio", icon: "👨‍🎓", label: "Student : Lecturer Ratio",
      unit: ":1", standard: "≤ 30:1",
      pass: ratio <= 30,
      fix: lecturers > 0
        ? `You need at least ${Math.ceil(students / 30)} lecturers for ${students} students.`
        : "Enter lecturer count.",
    },
    {
      id: "fulltime", icon: "👨‍🏫", label: "Full-time Academic Staff",
      unit: "%", standard: "≥ 60%",
      pass: fulltimePct >= 60,
      fix: lecturers > 0
        ? `At least ${Math.ceil(lecturers * 0.6)} of your ${lecturers} lecturers must be full-time.`
        : null,
    },
    {
      id: "phd", icon: "🎓", label: "PhD Holders",
      unit: "%", standard: "≥ 40%",
      pass: phdPct >= 40,
      fix: lecturers > 0
        ? `At least ${Math.ceil(lecturers * 0.4)} of your ${lecturers} lecturers must hold a PhD.`
        : null,
    },
    {
      id: "lab", icon: "🔬", label: "Lab Space per Student",
      unit: " m²", standard: "≥ 1.5 m²",
      pass: labPerStudent >= 1.5,
      fix: students > 0 && labAreaM2 > 0
        ? `You need ${(students * 1.5).toFixed(0)} m² total for ${students} students (add ${((students * 1.5) - labAreaM2).toFixed(0)} m² more).`
        : "Enter lab area and student count.",
    },
    {
      id: "books", icon: "📚", label: "Library Titles per Unit",
      unit: " titles", standard: "≥ 2 titles",
      pass: booksPerUnit >= 2,
      fix: courseUnits > 0
        ? `You need ${courseUnits * 2} titles for ${courseUnits} course units (add ${Math.max(0, courseUnits * 2 - bookTitles)} more).`
        : null,
    },
  ];

  const passCount   = checks.filter(c => c.pass).length;
  const overallPass = passCount === checks.length;
  const score       = Math.round((passCount / checks.length) * 100);

  // ── Discipline preset ─────────────────────────────────────────────────────────
  const applyPreset = (label) => {
    const preset = DISCIPLINE_PRESETS.find(p => p.label === label);
    if (!preset) return;
    setDiscipline(label);
    // Scale to current student count
    const lec = Math.ceil(students / preset.ratio);
    setLecturers(lec);
    setFulltimeStaff(Math.ceil(lec * preset.fulltime / 100));
    setPhdHolders(Math.ceil(lec * preset.phd / 100));
    setLabAreaM2(Math.round(students * preset.lab));
    setCourseUnits(30);
    setBookTitles(30 * preset.books);
  };

  // ── Load programmes for "save to programme" ──────────────────────────────────
  const loadProgrammes = useCallback(async () => {
    if (programmes.length > 0) return;
    setLoadingProgs(true);
    try {
      const res = await programmesAPI.list();
      setProgrammes(res.data.results || res.data);
    } catch {
      setProgrammes([]);
    } finally {
      setLoadingProgs(false);
    }
  }, [programmes.length]);

  // ── Save resource snapshot to a programme ────────────────────────────────────
  const handleSave = async () => {
    if (!targetProg) return;
    setSaveStatus("saving");
    try {
      await programmesAPI.update(targetProg, {
        student_count:       students,
        lecturer_count:      lecturers,
        full_time_lecturers: fulltimeStaff,
        phd_holders:         phdHolders,
        lab_area_m2:         labAreaM2,
        book_titles:         bookTitles,
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  const displayRatio      = lecturers > 0 ? ratio.toFixed(1) : "—";
  const displayFulltime   = lecturers > 0 ? fulltimePct.toFixed(0) : "—";
  const displayPhd        = lecturers > 0 ? phdPct.toFixed(0) : "—";
  const displayLab        = students  > 0 ? labPerStudent.toFixed(2) : "—";
  const displayBooks      = courseUnits > 0 ? booksPerUnit.toFixed(1) : "—";

  const displayValues = [displayRatio, displayFulltime, displayPhd, displayLab, displayBooks];

  return (
    <div style={{ fontFamily: "'IBM Plex Sans','Segoe UI',sans-serif",
      background: "#F0F4F8", minHeight: "100vh", padding: "32px 36px" }}>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input[type=range] { height: 4px; cursor: pointer; }
        input:focus, select:focus { border-color: #0C2D5E !important; box-shadow: 0 0 0 3px rgba(12,45,94,0.08); }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: "#94A3B8",
          fontFamily: "'IBM Plex Mono',monospace",
          letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
          NUC Accreditation Tools
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#07162F", margin: "0 0 4px" }}>
          Resource Calculator
        </h1>
        <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
          Check your programme's compliance against NUC minimum accreditation standards in real time.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 24,
        alignItems: "start" }}>

        {/* ── Left: Inputs ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Discipline preset */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0",
            borderRadius: 10, padding: "20px 22px",
            boxShadow: "0 1px 4px rgba(7,22,47,0.06)" }}>
            <div style={st.sectionTitle}>Quick Preset by Discipline</div>
            <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 14px" }}>
              Selecting a discipline auto-fills recommended values for that field.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {DISCIPLINE_PRESETS.map(p => (
                <button key={p.label} onClick={() => applyPreset(p.label)} style={{
                  padding: "6px 14px", borderRadius: 20, cursor: "pointer",
                  fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 700,
                  border: "1.5px solid",
                  borderColor: discipline === p.label ? "#07162F" : "#E2E8F0",
                  background:  discipline === p.label ? "#07162F" : "#fff",
                  color:       discipline === p.label ? "#fff"    : "#6B7280",
                  transition: "all 0.12s",
                }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Staffing inputs */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0",
            borderRadius: 10, padding: "20px 22px",
            boxShadow: "0 1px 4px rgba(7,22,47,0.06)" }}>
            <div style={st.sectionTitle}>Staffing & Enrolment</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <NumberInput label="Number of Students"
                value={students} onChange={setStudents} min={0} max={5000}
                hint="Total enrolled students in the programme" />
              <NumberInput label="Number of Lecturers"
                value={lecturers} onChange={setLecturers} min={0} max={500}
                hint="All academic staff (full-time + part-time)" />
              <NumberInput label="Full-time Lecturers"
                value={fulltimeStaff} onChange={v => setFulltimeStaff(clamp(v, 0, lecturers))}
                min={0} max={lecturers}
                hint={`Max: ${lecturers} · NUC requires ≥ 60%`} />
              <NumberInput label="PhD Holders"
                value={phdHolders} onChange={v => setPhdHolders(clamp(v, 0, lecturers))}
                min={0} max={lecturers}
                hint={`Max: ${lecturers} · NUC requires ≥ 40%`} />
            </div>
          </div>

          {/* Facilities inputs */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0",
            borderRadius: 10, padding: "20px 22px",
            boxShadow: "0 1px 4px rgba(7,22,47,0.06)" }}>
            <div style={st.sectionTitle}>Physical Resources</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <NumberInput label="Total Lab Area (m²)"
                value={labAreaM2} onChange={setLabAreaM2} min={0} max={10000}
                hint={students > 0 ? `Min needed: ${(students * 1.5).toFixed(0)} m² for ${students} students` : "NUC standard: ≥ 1.5 m² per student"} />
              <NumberInput label="Course Units Offered"
                value={courseUnits} onChange={setCourseUnits} min={1} max={200}
                hint="Total number of course units in the programme" />
              <NumberInput label="Library Book Titles"
                value={bookTitles} onChange={setBookTitles} min={0} max={50000}
                hint={`Min needed: ${courseUnits * 2} titles for ${courseUnits} units`} />
            </div>
          </div>

          {/* Save to Programme */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0",
            borderRadius: 10, padding: "20px 22px",
            boxShadow: "0 1px 4px rgba(7,22,47,0.06)" }}>
            <div style={st.sectionTitle}>Save to Programme Record</div>
            <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 14px" }}>
              Push these figures directly to a programme's resource record in the database.
            </p>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end",
              flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={st.label}>Select Programme</label>
                <select value={targetProg}
                  onChange={e => setTargetProg(e.target.value)}
                  onFocus={loadProgrammes}
                  style={{ ...st.input,
                    color: targetProg ? "#07162F" : "#94A3B8" }}>
                  <option value="">
                    {loadingProgs ? "Loading…" : "Select a programme…"}
                  </option>
                  {programmes.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={handleSave}
                disabled={!targetProg || saveStatus === "saving"}
                style={{
                  ...st.btnPri, padding: "10px 20px",
                  display: "flex", alignItems: "center", gap: 8,
                  opacity: !targetProg ? 0.5 : 1,
                  background: saveStatus === "saved"
                    ? "linear-gradient(135deg,#059669,#047857)"
                    : saveStatus === "error"
                    ? "#DC2626"
                    : "linear-gradient(135deg,#07162F,#0C2D5E)",
                }}>
                {saveStatus === "saving" && (
                  <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                )}
                {saveStatus === "saving" ? "Saving…"
                  : saveStatus === "saved" ? "✓ Saved!"
                  : saveStatus === "error" ? "✗ Failed"
                  : "💾 Save to Programme"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Results panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16,
          position: "sticky", top: 24 }}>

          {/* Overall score */}
          <div style={{
            background: overallPass
              ? "linear-gradient(135deg,#07162F,#065F46)"
              : "linear-gradient(135deg,#07162F,#0C2D5E)",
            borderRadius: 12, padding: "22px 24px",
            boxShadow: "0 4px 16px rgba(7,22,47,0.2)",
            position: "relative", overflow: "hidden",
          }}>
            {/* Subtle grid */}
            <svg style={{ position: "absolute", inset: 0, width: "100%",
              height: "100%", opacity: 0.05 }} xmlns="http://www.w3.org/2000/svg">
              <defs><pattern id="g" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#fff" strokeWidth="0.8"/>
              </pattern></defs>
              <rect width="100%" height="100%" fill="url(#g)"/>
            </svg>

            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)",
                fontFamily: "'IBM Plex Mono',monospace",
                letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>
                NUC Compliance Score
              </div>

              {/* Big score */}
              <div style={{ display: "flex", alignItems: "flex-end",
                gap: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 64, fontWeight: 700, color: "#fff",
                  fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1 }}>
                  {score}%
                </div>
                <div style={{ paddingBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700,
                    color: overallPass ? "#34D399" : "#FCA5A5" }}>
                    {overallPass ? "✓ Fully Compliant" : `${passCount} / ${checks.length} Passed`}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                    {overallPass
                      ? "Ready for NUC visit"
                      : `${checks.length - passCount} standard${checks.length - passCount > 1 ? "s" : ""} not met`}
                  </div>
                </div>
              </div>

              {/* Score bar */}
              <div style={{ height: 6, background: "rgba(255,255,255,0.15)",
                borderRadius: 9999, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 9999,
                  background: overallPass ? "#34D399" : "#FCA5A5",
                  width: `${score}%`, transition: "width 0.5s ease",
                }} />
              </div>

              {/* Check icons */}
              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                {checks.map(c => (
                  <span key={c.id} style={{
                    fontSize: 10, fontFamily: "'IBM Plex Mono',monospace",
                    fontWeight: 700, padding: "3px 9px", borderRadius: 4,
                    background: c.pass ? "rgba(52,211,153,0.15)" : "rgba(252,165,165,0.15)",
                    color:      c.pass ? "#34D399" : "#FCA5A5",
                    border: `1px solid ${c.pass ? "rgba(52,211,153,0.3)" : "rgba(252,165,165,0.3)"}`,
                  }}>
                    {c.pass ? "✓" : "✗"} {c.label.split(" ").slice(0, 2).join(" ")}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Individual result cards */}
          {checks.map((check, i) => (
            <ResultCard key={check.id} check={check} value={displayValues[i]} />
          ))}

          {/* NUC Standards Reference Table */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0",
            borderRadius: 10, overflow: "hidden",
            boxShadow: "0 1px 4px rgba(7,22,47,0.06)" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #E2E8F0",
              fontSize: 11, fontWeight: 700, color: "#07162F",
              fontFamily: "'IBM Plex Mono',monospace",
              letterSpacing: "0.06em", textTransform: "uppercase" }}>
              NUC Minimum Standards Reference
            </div>
            <div>
              {STANDARDS.map((s, i) => (
                <div key={s.id} style={{
                  display: "grid", gridTemplateColumns: "1fr 90px",
                  alignItems: "center", padding: "10px 16px",
                  borderBottom: i < STANDARDS.length - 1
                    ? "1px solid #F1F5F9" : "none",
                  background: i % 2 === 0 ? "#fff" : "#FAFBFC",
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>
                      {s.icon} {s.label}
                    </div>
                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2,
                      lineHeight: 1.4 }}>
                      {s.desc}
                    </div>
                  </div>
                  <span style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 13, fontWeight: 700, color: "#07162F",
                    textAlign: "right",
                  }}>
                    {s.standard}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const st = {
  sectionTitle: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
    color: "#6B7280", textTransform: "uppercase",
    fontFamily: "'IBM Plex Mono',monospace", marginBottom: 14,
  },
  label: {
    fontSize: 11, fontFamily: "'IBM Plex Mono',monospace",
    fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", color: "#374151",
    display: "block", marginBottom: 7,
  },
  input: {
    width: "100%", padding: "9px 13px",
    border: "1.5px solid #CBD5E1", borderRadius: 7,
    fontFamily: "'IBM Plex Sans',sans-serif",
    fontSize: 13, color: "#07162F", background: "#fff",
    outline: "none", boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  hint: { fontSize: 11, color: "#94A3B8", marginTop: 2, lineHeight: 1.5 },
  btnPri: {
    padding: "9px 18px", borderRadius: 7, cursor: "pointer",
    fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: 12,
    background: "linear-gradient(135deg,#07162F,#0C2D5E)",
    color: "#fff", border: "none", letterSpacing: "0.04em",
    transition: "all 0.2s",
  },
};