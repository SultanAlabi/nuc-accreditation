// src/utils/accreditation.js
// Shared helpers for milestone calculations, ratio checks, and readiness scoring

export const STATUS_CONFIG = {
  PENDING:    { label: "Pending Approval",   color: "#D97706", bg: "#FEF3C7", border: "#FCD34D", dot: "#D97706" },
  APPROVED:   { label: "Take-off Approved",  color: "#2563EB", bg: "#DBEAFE", border: "#BFDBFE", dot: "#2563EB" },
  RESOURCE:   { label: "Resource Visit Due", color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5", dot: "#DC2626" },
  ACCREDITED: { label: "Fully Accredited",   color: "#059669", bg: "#D1FAE5", border: "#6EE7B7", dot: "#059669" },
  REACCREDIT: { label: "Re-accreditation",   color: "#7C3AED", bg: "#EDE9FE", border: "#C4B5FD", dot: "#7C3AED" },
  OVERDUE:    { label: "OVERDUE",            color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5", dot: "#CC0000" },
};

export function daysBetween(d1, d2) {
  return Math.round((new Date(d2) - new Date(d1)) / 86400000);
}

export function addYears(dateStr, years) {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split("T")[0];
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function getNextMilestone(course) {
  const today = new Date().toISOString().split("T")[0];
  const start = course.start_date || course.startDate;
  const resourceDate    = addYears(start, 3);
  const fullAccredDate  = addYears(start, 5);
  const reaccredDate    = addYears(start, 10);

  if (["PENDING", "APPROVED"].includes(course.status)) {
    const days = daysBetween(today, resourceDate);
    return { label: "Resource Visit", date: resourceDate, days,
      urgency: days < 0 ? "overdue" : days < 90 ? "urgent" : "normal" };
  }
  if (["RESOURCE", "ACCREDITED"].includes(course.status)) {
    const days = daysBetween(today, fullAccredDate);
    return { label: "Full Accreditation", date: fullAccredDate, days,
      urgency: days < 0 ? "overdue" : days < 180 ? "urgent" : "normal" };
  }
  const days = daysBetween(today, reaccredDate);
  return { label: "Re-accreditation", date: reaccredDate, days,
    urgency: days < 0 ? "overdue" : days < 365 ? "urgent" : "normal" };
}

export function getNUCRatio(students, lecturers) {
  if (!lecturers || lecturers === 0) return { ratio: "N/A", numeric: null, pass: false };
  const numeric = students / lecturers;
  return {
    ratio: `${numeric.toFixed(1)}:1`,
    numeric,
    pass: numeric <= 30,
  };
}

export function getReadinessScore(course) {
  const docs = course.docs || course.document_counts || {};
  const { pass } = getNUCRatio(
    course.students || course.student_count || 0,
    course.lecturers || course.lecturer_count || 0
  );
  const checks = [
    (docs.marking_schemes   || docs.markingSchemes   || 0) > 0,
    (docs.lesson_notes      || docs.lessonNotes      || 0) > 10,
    (docs.ca_records        || docs.caRecords        || 0) > 0,
    (docs.examiner_reports  || docs.examinerReports  || 0) > 0,
    (docs.staff_files       || docs.staffFiles       || 0) > 0,
    pass,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function urgencyColor(urgency) {
  return urgency === "overdue" ? "#DC2626" : urgency === "urgent" ? "#D97706" : "#059669";
}
export function urgencyBg(urgency) {
  return urgency === "overdue" ? "#FEE2E2" : urgency === "urgent" ? "#FEF3C7" : "#D1FAE5";
}