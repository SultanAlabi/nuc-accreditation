// src/pages/NewCourse.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { programmesAPI } from "../services/api";

const FACULTIES = [
  "Engineering & Technology", "Natural Sciences", "Medicine & Health Sciences",
  "Law", "Social Sciences", "Arts & Humanities",
  "Management Sciences", "Education", "Agriculture", "Environmental Sciences",
];

const DEGREE_TYPES = [
  "B.Sc.", "B.Eng.", "B.A.", "LL.B.", "B.Ed.", "B.Pharm.",
  "B.Tech.", "M.Sc.", "M.Eng.", "M.A.", "Ph.D.",
];

// ── Step config ──────────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, label: "Programme Info",   desc: "Basic identity of the course"   },
  { n: 2, label: "Staffing",         desc: "Faculty and student numbers"     },
  { n: 3, label: "Facilities",       desc: "Physical resources & library"    },
  { n: 4, label: "Review & Submit",  desc: "Confirm before sending to APU"  },
];

// ── Field component ───────────────────────────────────────────────────────────
function Field({ label, name, value, onChange, error, type = "text",
  placeholder = "", required = false, hint = "", children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={s.label}>
        {label}{required && <span style={{ color: "#DC2626" }}> *</span>}
      </label>
      {children || (
        <input type={type} name={name} value={value} onChange={onChange}
          placeholder={placeholder}
          style={{ ...s.input, ...(error ? s.inputErr : {}) }} />
      )}
      {hint  && !error && <span style={s.hint}>{hint}</span>}
      {error && <span style={s.err}>{error}</span>}
    </div>
  );
}

function SelectField({ label, name, value, onChange, error, options, placeholder, required }) {
  return (
    <Field label={label} name={name} error={error} required={required}>
      <select name={name} value={value} onChange={onChange}
        style={{ ...s.input, color: value ? "#07162F" : "#94A3B8", ...(error ? s.inputErr : {}) }}>
        <option value="">{placeholder || "Select…"}</option>
        {options.map(o => (
          <option key={typeof o === "string" ? o : o.value}
            value={typeof o === "string" ? o : o.value}>
            {typeof o === "string" ? o : o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

// ── Review row ────────────────────────────────────────────────────────────────
function ReviewRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      padding: "10px 0", borderBottom: "1px solid #F1F5F9", gap: 16 }}>
      <span style={{ fontSize: 12, color: "#6B7280", minWidth: 180 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#07162F",
        textAlign: "right", fontFamily: value ? "'IBM Plex Mono',monospace" : "inherit" }}>
        {value || <span style={{ color: "#94A3B8", fontStyle: "italic" }}>Not provided</span>}
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NewCourse() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState({
    // Step 1
    degree_type: "", name: "", code: "", faculty: "",
    department: "", start_date: "", programme_duration: "4",
    // Step 2
    student_count: "", lecturer_count: "",
    full_time_lecturers: "", phd_holders: "",
    // Step 3
    lab_area_m2: "", book_titles: "", lab_count: "",
    has_internet: "yes", has_student_lab: "yes",
    // Meta
    description: "",
  });
  const [errors, setErrors] = useState({});

  const set = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
  };

  // ── Validation per step ────────────────────────────────────────────────────
  const validate = (n) => {
    const e = {};
    if (n === 1) {
      if (!form.degree_type) e.degree_type = "Required";
      if (!form.name.trim()) e.name        = "Required";
      if (!form.code.trim()) e.code        = "Required";
      if (!form.faculty)     e.faculty     = "Required";
      if (!form.department.trim()) e.department = "Required";
      if (!form.start_date)  e.start_date  = "Required";
    }
    if (n === 2) {
      if (!form.student_count || isNaN(form.student_count))    e.student_count  = "Enter a valid number";
      if (!form.lecturer_count || isNaN(form.lecturer_count))  e.lecturer_count = "Enter a valid number";
      // NUC ratio warning (not a hard block)
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate(step)) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  // ── NUC ratio live check ───────────────────────────────────────────────────
  const students  = parseInt(form.student_count)  || 0;
  const lecturers = parseInt(form.lecturer_count) || 0;
  const ratio     = lecturers > 0 ? (students / lecturers).toFixed(1) : null;
  const ratioPass = ratio !== null && parseFloat(ratio) <= 30;

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError("");
    try {
      const payload = {
        name:            `${form.degree_type} ${form.name}`.trim(),
        code:            form.code.toUpperCase(),
        faculty:         form.faculty,
        department:      form.department,
        start_date:      form.start_date,
        student_count:   parseInt(form.student_count)       || 0,
        staff_count:     parseInt(form.lecturer_count)      || 0,
        lecturer_count:  parseInt(form.lecturer_count)      || 0,
        full_time_lecturers: parseInt(form.full_time_lecturers) || 0,
        phd_holders:     parseInt(form.phd_holders)         || 0,
        lab_area_m2:     parseFloat(form.lab_area_m2)       || 0,
        book_titles:     parseInt(form.book_titles)         || 0,
        lab_count:       parseInt(form.lab_count)           || 0,
        has_internet:    form.has_internet === "yes",
        has_student_lab: form.has_student_lab === "yes",
        description:     form.description,
        status:          "PENDING",
      };
      const res = await programmesAPI.create(payload);
      navigate(`/courses/${res.data.id}`, {
        state: { toast: "Programme submitted for APU approval." },
      });
    } catch (err) {
      const data = err.response?.data || {};
      setSubmitError(data.detail || data.non_field_errors?.[0] || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fullName = `${form.degree_type} ${form.name}`.trim();

  return (
    <div style={{ padding: "32px 40px", fontFamily: "'IBM Plex Sans','Segoe UI',sans-serif",
      background: "#F0F4F8", minHeight: "100vh" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24,
        fontSize: 12, color: "#64748B", fontFamily: "'IBM Plex Mono',monospace" }}>
        <Link to="/courses" style={{ color: "#2563EB", textDecoration: "none" }}>Courses</Link>
        <span>/</span>
        <span style={{ color: "#07162F", fontWeight: 600 }}>New Programme</span>
      </div>

      {/* Page title */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#07162F", margin: "0 0 4px" }}>
          Register New Programme
        </h1>
        <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
          Submit a new course for NUC accreditation review. All fields marked * are required.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 28, alignItems: "start" }}>

        {/* ── Step sidebar ── */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0",
          borderRadius: 12, overflow: "hidden",
          boxShadow: "0 1px 4px rgba(7,22,47,0.06)", position: "sticky", top: 24 }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #E2E8F0",
            background: "linear-gradient(135deg,#07162F,#0C2D5E)" }}>
            <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace",
              letterSpacing: "0.12em", color: "#22D3EE", textTransform: "uppercase", marginBottom: 2 }}>
              Progress
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
              Step {step} of {STEPS.length}
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: 10, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 9999 }}>
              <div style={{ height: "100%", borderRadius: 9999, background: "#22D3EE",
                width: `${(step / STEPS.length) * 100}%`, transition: "width 0.4s ease" }} />
            </div>
          </div>
          <div style={{ padding: "8px 0" }}>
            {STEPS.map(st => {
              const done    = step > st.n;
              const active  = step === st.n;
              return (
                <div key={st.n} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "12px 18px",
                  background: active ? "#EFF6FF" : "transparent",
                  borderLeft: active ? "3px solid #2563EB" : "3px solid transparent",
                  cursor: done ? "pointer" : "default",
                  transition: "all 0.12s",
                }}
                  onClick={() => done && setStep(st.n)}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                    background: done ? "#059669" : active ? "#2563EB" : "#E5E7EB",
                    color: done || active ? "#fff" : "#9CA3AF",
                    marginTop: 1,
                  }}>
                    {done ? "✓" : st.n}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600,
                      color: active ? "#1D4ED8" : done ? "#059669" : "#6B7280" }}>
                      {st.label}
                    </div>
                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1, lineHeight: 1.4 }}>
                      {st.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Form card ── */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0",
          borderRadius: 12, boxShadow: "0 1px 4px rgba(7,22,47,0.06)",
          overflow: "hidden" }}>

          {/* Card header */}
          <div style={{ padding: "20px 28px", borderBottom: "1px solid #E2E8F0",
            background: "#FAFBFC" }}>
            <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace",
              color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 3 }}>
              Step {step} of {STEPS.length}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#07162F" }}>
              {STEPS[step - 1].label}
            </div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>
              {STEPS[step - 1].desc}
            </div>
          </div>

          <div style={{ padding: "28px 28px" }}>

            {/* ── STEP 1: Programme Info ── */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 14 }}>
                  <SelectField label="Degree Type" name="degree_type" value={form.degree_type}
                    onChange={set} error={errors.degree_type} required options={DEGREE_TYPES} />
                  <Field label="Programme Title" name="name" value={form.name} onChange={set}
                    error={errors.name} required placeholder="e.g. Computer Engineering" />
                </div>

                {fullName && (
                  <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE",
                    borderRadius: 7, padding: "10px 14px", fontSize: 13,
                    fontWeight: 600, color: "#1D4ED8", fontFamily: "'IBM Plex Mono',monospace" }}>
                    Preview: {fullName}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Programme Code" name="code" value={form.code} onChange={set}
                    error={errors.code} required placeholder="e.g. CPE"
                    hint="Short abbreviation used in NUC reports" />
                  <SelectField label="Duration (years)" name="programme_duration"
                    value={form.programme_duration} onChange={set}
                    options={["3","4","5","6","7"]} />
                </div>

                <SelectField label="Faculty" name="faculty" value={form.faculty} onChange={set}
                  error={errors.faculty} required options={FACULTIES}
                  placeholder="Select faculty…" />

                <Field label="Department" name="department" value={form.department} onChange={set}
                  error={errors.department} required placeholder="e.g. Department of Computer Science" />

                <Field label="Proposed Start Date" name="start_date" value={form.start_date}
                  onChange={set} error={errors.start_date} required type="date"
                  hint="The date the first cohort begins the programme" />

                <Field label="Programme Description (optional)" name="description"
                  value={form.description} onChange={set} placeholder="">
                  <textarea name="description" value={form.description} onChange={set}
                    placeholder="Brief overview of the programme objectives and outcomes…"
                    rows={3}
                    style={{ ...s.input, resize: "vertical", lineHeight: 1.6 }} />
                </Field>
              </div>
            )}

            {/* ── STEP 2: Staffing ── */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0",
                  borderRadius: 8, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>
                    NUC Standard: Student-to-Lecturer ratio must not exceed 30:1
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>
                    At least 60% of lecturers must be full-time, and 40% must hold a PhD.
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Expected No. of Students" name="student_count" type="number"
                    value={form.student_count} onChange={set} error={errors.student_count}
                    required placeholder="e.g. 150" />
                  <Field label="No. of Lecturers" name="lecturer_count" type="number"
                    value={form.lecturer_count} onChange={set} error={errors.lecturer_count}
                    required placeholder="e.g. 12" />
                </div>

                {/* Live ratio checker */}
                {ratio !== null && (
                  <div style={{
                    padding: "16px 18px", borderRadius: 8, textAlign: "center",
                    background: ratioPass ? "linear-gradient(135deg,#D1FAE5,#A7F3D0)" : "linear-gradient(135deg,#FEE2E2,#FECACA)",
                    border: `1px solid ${ratioPass ? "#6EE7B7" : "#FCA5A5"}`,
                  }}>
                    <div style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace",
                      letterSpacing: "0.12em", textTransform: "uppercase",
                      color: ratioPass ? "#065F46" : "#991B1B", marginBottom: 6 }}>
                      Live Ratio Check
                    </div>
                    <div style={{ fontSize: 40, fontWeight: 700,
                      fontFamily: "'IBM Plex Mono',monospace",
                      color: ratioPass ? "#059669" : "#DC2626", lineHeight: 1 }}>
                      {ratio}:1
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8,
                      color: ratioPass ? "#065F46" : "#991B1B" }}>
                      {ratioPass ? "✓ Meets NUC Standard" : "✗ Does Not Meet NUC Standard"}
                    </div>
                    {!ratioPass && (
                      <div style={{ fontSize: 11, color: "#B91C1C", marginTop: 6 }}>
                        You need at least <strong>{Math.ceil(students / 30)}</strong> lecturers for {students} students.
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Full-time Lecturers" name="full_time_lecturers" type="number"
                    value={form.full_time_lecturers} onChange={set}
                    placeholder="e.g. 8" hint="Min. 60% of total staff" />
                  <Field label="PhD Holders" name="phd_holders" type="number"
                    value={form.phd_holders} onChange={set}
                    placeholder="e.g. 5" hint="Min. 40% of total staff" />
                </div>

                {/* Staff compliance indicators */}
                {form.lecturer_count && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      {
                        label: "Full-time %",
                        value: form.full_time_lecturers
                          ? `${((parseInt(form.full_time_lecturers)/parseInt(form.lecturer_count))*100).toFixed(0)}%`
                          : "—",
                        pass: form.full_time_lecturers
                          ? parseInt(form.full_time_lecturers)/parseInt(form.lecturer_count) >= 0.6
                          : null,
                        standard: "≥ 60%",
                      },
                      {
                        label: "PhD Holders %",
                        value: form.phd_holders
                          ? `${((parseInt(form.phd_holders)/parseInt(form.lecturer_count))*100).toFixed(0)}%`
                          : "—",
                        pass: form.phd_holders
                          ? parseInt(form.phd_holders)/parseInt(form.lecturer_count) >= 0.4
                          : null,
                        standard: "≥ 40%",
                      },
                    ].map((c, i) => (
                      <div key={i} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0",
                        borderRadius: 7, padding: "12px 14px" }}>
                        <div style={{ fontSize: 10, color: "#94A3B8",
                          fontFamily: "'IBM Plex Mono',monospace", textTransform: "uppercase",
                          letterSpacing: "0.1em", marginBottom: 5 }}>{c.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace",
                          color: c.pass === null ? "#94A3B8" : c.pass ? "#059669" : "#DC2626" }}>
                          {c.value}
                        </div>
                        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 3 }}>
                          NUC standard: {c.standard}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: Facilities ── */}
            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0",
                  borderRadius: 8, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>
                    NUC Physical Resources Standards
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.6 }}>
                    Lab space: ≥ 1.5m² per student · Library: ≥ 2 book titles per course unit
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Lab Area (m²)" name="lab_area_m2" type="number"
                    value={form.lab_area_m2} onChange={set}
                    placeholder="e.g. 280"
                    hint={students > 0 ? `Min. required: ${(students * 1.5).toFixed(0)}m² for ${students} students` : "Min. 1.5m² per student"} />
                  <Field label="No. of Labs / Studios" name="lab_count" type="number"
                    value={form.lab_count} onChange={set} placeholder="e.g. 3" />
                </div>

                <Field label="Library Book Titles" name="book_titles" type="number"
                  value={form.book_titles} onChange={set}
                  placeholder="e.g. 500"
                  hint="Unique titles relevant to the programme (physical + digital)" />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <SelectField label="Internet Access" name="has_internet"
                    value={form.has_internet} onChange={set}
                    options={[{ value: "yes", label: "Yes — available" }, { value: "no", label: "No — not yet" }]} />
                  <SelectField label="Dedicated Student Lab" name="has_student_lab"
                    value={form.has_student_lab} onChange={set}
                    options={[{ value: "yes", label: "Yes — available" }, { value: "no", label: "No — not yet" }]} />
                </div>

                {/* Lab area check */}
                {form.lab_area_m2 && students > 0 && (
                  <div style={{
                    padding: "12px 16px", borderRadius: 8,
                    background: parseFloat(form.lab_area_m2) >= students * 1.5 ? "#D1FAE5" : "#FEE2E2",
                    border: `1px solid ${parseFloat(form.lab_area_m2) >= students * 1.5 ? "#6EE7B7" : "#FCA5A5"}`,
                    fontSize: 12, fontWeight: 600,
                    color: parseFloat(form.lab_area_m2) >= students * 1.5 ? "#065F46" : "#991B1B",
                  }}>
                    {parseFloat(form.lab_area_m2) >= students * 1.5
                      ? `✓ ${form.lab_area_m2}m² meets the minimum requirement of ${(students * 1.5).toFixed(0)}m²`
                      : `✗ ${form.lab_area_m2}m² is below the minimum of ${(students * 1.5).toFixed(0)}m² — add ${((students * 1.5) - parseFloat(form.lab_area_m2)).toFixed(0)}m² more`
                    }
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 4: Review & Submit ── */}
            {step === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                {submitError && (
                  <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5",
                    color: "#DC2626", borderRadius: 8, padding: "12px 16px",
                    fontSize: 13, fontWeight: 500 }}>
                    ⚠ {submitError}
                  </div>
                )}

                {/* Summary sections */}
                {[
                  {
                    title: "Programme Information",
                    rows: [
                      ["Full Name",    fullName || "—"],
                      ["Code",         form.code.toUpperCase() || "—"],
                      ["Faculty",      form.faculty],
                      ["Department",   form.department],
                      ["Start Date",   form.start_date ? new Date(form.start_date).toLocaleDateString("en-NG",{day:"2-digit",month:"long",year:"numeric"}) : "—"],
                      ["Duration",     form.programme_duration ? `${form.programme_duration} years` : "—"],
                    ],
                  },
                  {
                    title: "Staffing",
                    rows: [
                      ["Students",           form.student_count  || "0"],
                      ["Lecturers",          form.lecturer_count || "0"],
                      ["Student:Staff Ratio", ratio ? `${ratio}:1 — ${ratioPass ? "✓ Meets standard" : "✗ Below standard"}` : "—"],
                      ["Full-time Lecturers", form.full_time_lecturers || "—"],
                      ["PhD Holders",         form.phd_holders || "—"],
                    ],
                  },
                  {
                    title: "Facilities",
                    rows: [
                      ["Lab Area",       form.lab_area_m2 ? `${form.lab_area_m2} m²` : "—"],
                      ["No. of Labs",    form.lab_count || "—"],
                      ["Book Titles",    form.book_titles || "—"],
                      ["Internet",       form.has_internet === "yes" ? "Available" : "Not available"],
                      ["Student Lab",    form.has_student_lab === "yes" ? "Available" : "Not available"],
                    ],
                  },
                ].map(section => (
                  <div key={section.title} style={{ background: "#F8FAFC",
                    border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
                    <div style={{ padding: "11px 16px", borderBottom: "1px solid #E2E8F0",
                      fontSize: 11, fontWeight: 700, color: "#07162F",
                      fontFamily: "'IBM Plex Mono',monospace", letterSpacing: "0.06em",
                      textTransform: "uppercase", background: "#fff" }}>
                      {section.title}
                    </div>
                    <div style={{ padding: "4px 16px 8px" }}>
                      {section.rows.map(([l, v]) => <ReviewRow key={l} label={l} value={v} />)}
                    </div>
                  </div>
                ))}

                {/* NUC Compliance Summary */}
                <div style={{ background: "#fff", border: "1px solid #E2E8F0",
                  borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ padding: "11px 16px", borderBottom: "1px solid #E2E8F0",
                    fontSize: 11, fontWeight: 700, color: "#07162F",
                    fontFamily: "'IBM Plex Mono',monospace", letterSpacing: "0.06em",
                    textTransform: "uppercase" }}>
                    NUC Compliance Pre-check
                  </div>
                  <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { label: "Student:Lecturer Ratio ≤ 30:1", pass: ratioPass },
                      { label: "Full-time Staff ≥ 60%",
                        pass: form.full_time_lecturers && form.lecturer_count
                          ? parseInt(form.full_time_lecturers)/parseInt(form.lecturer_count) >= 0.6
                          : null },
                      { label: "PhD Holders ≥ 40%",
                        pass: form.phd_holders && form.lecturer_count
                          ? parseInt(form.phd_holders)/parseInt(form.lecturer_count) >= 0.4
                          : null },
                      { label: "Lab space ≥ 1.5m² per student",
                        pass: form.lab_area_m2 && students > 0
                          ? parseFloat(form.lab_area_m2) >= students * 1.5
                          : null },
                    ].map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10,
                        padding: "7px 10px", borderRadius: 5,
                        background: c.pass === null ? "#F8FAFC" : c.pass ? "#F0FDF4" : "#FEF2F2",
                        border: `1px solid ${c.pass === null ? "#E2E8F0" : c.pass ? "#BBF7D0" : "#FECACA"}`,
                      }}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>
                          {c.pass === null ? "○" : c.pass ? "✅" : "❌"}
                        </span>
                        <span style={{ fontSize: 12,
                          color: c.pass === null ? "#94A3B8" : c.pass ? "#065F46" : "#991B1B",
                          fontWeight: c.pass !== null ? 600 : 400 }}>
                          {c.label}
                          {c.pass === null && " — not provided"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: "#FEF3C7", border: "1px solid #FCD34D",
                  borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>
                  <strong>Before you submit:</strong> This programme will be sent to the Academic
                  Planning Unit (APU) for review. You will receive a notification once it has
                  been approved or requires revision.
                </div>
              </div>
            )}

            {/* ── Navigation buttons ── */}
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", marginTop: 32, paddingTop: 20,
              borderTop: "1px solid #E2E8F0" }}>
              <div>
                {step > 1 && (
                  <button onClick={back} style={s.btnSec}>← Back</button>
                )}
                {step === 1 && (
                  <Link to="/courses" style={{ ...s.btnSec, textDecoration: "none",
                    display: "inline-flex", alignItems: "center" }}>
                    Cancel
                  </Link>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 11, color: "#94A3B8",
                  fontFamily: "'IBM Plex Mono',monospace" }}>
                  {step} / {STEPS.length}
                </span>
                {step < STEPS.length ? (
                  <button onClick={next} style={s.btnPri}>
                    Continue →
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={loading} style={{
                    ...s.btnPri,
                    background: loading ? "#94A3B8" : "linear-gradient(135deg,#059669,#047857)",
                    minWidth: 180,
                  }}>
                    {loading ? "Submitting…" : "✓ Submit for Approval"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  label: {
    fontSize: 11, fontFamily: "'IBM Plex Mono',monospace",
    fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
    color: "#374151", display: "block",
  },
  input: {
    width: "100%", padding: "10px 13px",
    border: "1.5px solid #CBD5E1", borderRadius: 7,
    fontFamily: "'IBM Plex Sans',sans-serif",
    fontSize: 13, color: "#07162F", background: "#fff",
    outline: "none", boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  inputErr: { borderColor: "#DC2626" },
  hint: { fontSize: 11, color: "#94A3B8", marginTop: 2, lineHeight: 1.5 },
  err:  { fontSize: 11, color: "#DC2626", fontWeight: 500, marginTop: 2 },
  btnPri: {
    padding: "11px 24px", borderRadius: 7, cursor: "pointer",
    fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: 12,
    background: "linear-gradient(135deg,#07162F,#0C2D5E)",
    color: "#fff", border: "none", letterSpacing: "0.04em",
  },
  btnSec: {
    padding: "10px 20px", borderRadius: 7, cursor: "pointer",
    fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: 12,
    background: "#fff", color: "#374151", border: "1.5px solid #CBD5E1",
  },
};