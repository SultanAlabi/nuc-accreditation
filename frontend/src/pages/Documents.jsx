// src/pages/Documents.jsx
//
// Global Evidence Locker — shows all documents across every programme.
// Every action (upload, edit, delete) hits the real Django backend.
//
// Django endpoints consumed:
//   GET    /api/documents/?programme=&category=&search=&verified=&page=
//   GET    /api/programmes/          (for the programme dropdown in upload)
//   POST   /api/programmes/:id/documents/   (multipart upload)
//   PATCH  /api/documents/:id/              (rename / change category / verify)
//   DELETE /api/documents/:id/

import { useState, useEffect, useCallback, useRef } from "react";
import { useRole } from "../hooks/useRole";
import { documentsAPI, programmesAPI } from "../services/api";

// ── Constants ─────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:8000";

const DOC_CATEGORIES = [
  { key: "marking_schemes",   label: "Marking Schemes",   icon: "📝" },
  { key: "lesson_notes",      label: "Lesson Notes",      icon: "📖" },
  { key: "ca_records",        label: "CA Records",        icon: "📊" },
  { key: "examiner_reports",  label: "Examiner Reports",  icon: "🔍" },
  { key: "staff_files",       label: "Staff Files",       icon: "👤" },
  { key: "student_files",     label: "Student Files",     icon: "🎓" },
  { key: "qa_reports",        label: "QA Reports",        icon: "✅" },
  { key: "research_evidence", label: "Research Evidence", icon: "🔬" },
  { key: "question_papers",   label: "Question Papers",   icon: "📋" },
  { key: "other",             label: "Other",             icon: "📁" },
];

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg", "image/png", "image/webp",
];
const ALLOWED_EXT  = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp";
const MAX_MB       = 20;

function catLabel(key) { return DOC_CATEGORIES.find(c => c.key === key)?.label || key; }
function catIcon(key)  { return DOC_CATEGORIES.find(c => c.key === key)?.icon  || "📄"; }
function fmtSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === "error" ? "#DC2626" : "#07162F",
          color: "#fff", padding: "12px 18px", borderRadius: 8,
          boxShadow: "0 8px 24px rgba(7,22,47,0.25)",
          fontSize: 13, fontWeight: 600, minWidth: 280, maxWidth: 360,
          borderLeft: `3px solid ${t.type === "error" ? "#FCA5A5" : "#22D3EE"}`,
          animation: "slideUp 0.2s ease",
        }}>
          {t.type === "error" ? "⚠ " : "✓ "}{t.message}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, push };
}

// ── Confirm delete modal ───────────────────────────────────────────────────────
function ConfirmDelete({ doc, onConfirm, onCancel, loading }) {
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0,
      background: "rgba(7,22,47,0.72)", display: "flex",
      alignItems: "center", justifyContent: "center",
      zIndex: 600, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 12, width: "min(420px, 95vw)",
        boxShadow: "0 25px 80px rgba(7,22,47,0.35)",
        border: "1px solid #CBD5E1", overflow: "hidden",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0",
          display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%",
            background: "#FEE2E2", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🗑</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#07162F", marginBottom: 4 }}>
              Delete Document
            </div>
            <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
              Are you sure you want to permanently delete{" "}
              <strong style={{ color: "#07162F" }}>{doc?.file_name || doc?.name}</strong>?
              This action cannot be undone.
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 24px", display: "flex", gap: 10,
          justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={S.btnSec} disabled={loading}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{
            ...S.btnDanger, opacity: loading ? 0.6 : 1,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {loading && <span style={S.spinner} />}
            {loading ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit modal ─────────────────────────────────────────────────────────────────
function EditModal({ doc, onClose, onSaved, toast }) {
  const [form, setForm]     = useState({
    file_name: doc.file_name || doc.name || "",
    category:  doc.category  || "",
    verified:  doc.verified  || false,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSave = async () => {
    if (!form.file_name.trim()) { setError("File name cannot be empty."); return; }
    if (!form.category)         { setError("Please select a category."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await documentsAPI.update(doc.id, {
        file_name: form.file_name.trim(),
        category:  form.category,
        verified:  form.verified,
      });
      onSaved(res.data);
      toast("Document updated successfully.");
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0,
      background: "rgba(7,22,47,0.72)", display: "flex",
      alignItems: "center", justifyContent: "center",
      zIndex: 600, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 12, width: "min(480px,95vw)",
        boxShadow: "0 25px 80px rgba(7,22,47,0.35)",
        border: "1px solid #CBD5E1", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#07162F,#0C2D5E)",
          padding: "20px 24px", position: "relative" }}>
          <button onClick={onClose} style={S.modalClose}>×</button>
          <div style={S.modalEyebrow}>Edit Document</div>
          <div style={S.modalTitle}>Update file details</div>
        </div>

        <div style={{ padding: "22px 24px", display: "flex",
          flexDirection: "column", gap: 16 }}>
          {error && <div style={S.errorBox}>⚠ {error}</div>}

          {/* File name */}
          <div>
            <label style={S.label}>Document Name</label>
            <input value={form.file_name}
              onChange={e => setForm(p => ({ ...p, file_name: e.target.value }))}
              style={S.input}
              placeholder="e.g. CPE301 Marking Scheme 2024.pdf"
            />
            <div style={S.hint}>You can rename the document without re-uploading.</div>
          </div>

          {/* Category */}
          <div>
            <label style={S.label}>Category *</label>
            <select value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              style={{ ...S.input, color: form.category ? "#07162F" : "#94A3B8" }}>
              <option value="">Select category…</option>
              {DOC_CATEGORIES.map(c => (
                <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          {/* Verified toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px", background: "#F8FAFC",
            border: "1px solid #E2E8F0", borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#07162F" }}>
                Mark as Verified
              </div>
              <div style={{ fontSize: 11, color: "#64748B" }}>
                Verified documents are visible to the NUC visiting team
              </div>
            </div>
            <button onClick={() => setForm(p => ({ ...p, verified: !p.verified }))}
              style={{
                width: 44, height: 24, borderRadius: 12, border: "none",
                background: form.verified ? "#059669" : "#CBD5E1",
                cursor: "pointer", position: "relative", transition: "background 0.2s",
                flexShrink: 0,
              }}>
              <span style={{
                position: "absolute", top: 2,
                left: form.verified ? 22 : 2,
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff", transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={S.btnSec} disabled={loading}>Cancel</button>
            <button onClick={handleSave} disabled={loading} style={{
              ...S.btnPri, flex: 1, justifyContent: "center",
              opacity: loading ? 0.7 : 1,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {loading && <span style={S.spinner} />}
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Upload modal ───────────────────────────────────────────────────────────────
function UploadModal({ programmes, onClose, onUploaded, toast }) {
  const [programmeId, setProgrammeId] = useState("");
  const [category,    setCategory]    = useState("");
  const [files,       setFiles]       = useState([]); // [{file, id, progress, status, error}]
  const [errors,      setErrors]      = useState({});
  const dropRef  = useRef(null);
  const inputRef = useRef(null);

  const addFiles = (incoming) => {
    const valid = [];
    for (const file of incoming) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast(`"${file.name}" is not an allowed file type.`, "error");
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        toast(`"${file.name}" exceeds ${MAX_MB}MB.`, "error");
        continue;
      }
      valid.push({ file, id: `${Date.now()}-${Math.random()}`, progress: 0,
        status: "pending", error: "" });
    }
    setFiles(p => [...p, ...valid]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropRef.current?.classList.remove("drag-over");
    addFiles([...e.dataTransfer.files]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dropRef.current?.style && (dropRef.current.style.borderColor = "#2563EB");
  };

  const handleDragLeave = () => {
    dropRef.current?.style && (dropRef.current.style.borderColor = "#CBD5E1");
  };

  const removeFile = (id) => setFiles(p => p.filter(f => f.id !== id));

  const validate = () => {
    const e = {};
    if (!programmeId) e.programmeId = "Select a programme.";
    if (!category)    e.category    = "Select a category.";
    if (files.length === 0) e.files = "Add at least one file.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUpload = async () => {
    if (!validate()) return;

    // Upload files one by one, updating progress per file
    for (const item of files) {
      if (item.status === "done") continue;

      // Mark as uploading
      setFiles(p => p.map(f => f.id === item.id
        ? { ...f, status: "uploading", progress: 0 } : f));

      try {
        const fd = new FormData();
        fd.append("file",      item.file);
        fd.append("file_name", item.file.name);
        fd.append("category",  category);

        await documentsAPI.upload(programmeId, fd, (pct) => {
          setFiles(p => p.map(f => f.id === item.id
            ? { ...f, progress: pct } : f));
        });

        setFiles(p => p.map(f => f.id === item.id
          ? { ...f, status: "done", progress: 100 } : f));

      } catch (err) {
        const msg = err.response?.data?.detail
          || err.response?.data?.file?.[0]
          || "Upload failed.";
        setFiles(p => p.map(f => f.id === item.id
          ? { ...f, status: "error", error: msg } : f));
      }
    }

    const allDone = files.every(f => f.status === "done");
    if (allDone || files.some(f => f.status === "done")) {
      const doneCount = files.filter(f => f.status === "done").length;
      toast(`${doneCount} file${doneCount > 1 ? "s" : ""} uploaded successfully.`);
      onUploaded();
      if (allDone) onClose();
    }
  };

  const allDone    = files.length > 0 && files.every(f => f.status === "done");
  const uploading  = files.some(f => f.status === "uploading");

  return (
    <div onClick={!uploading ? onClose : undefined}
      style={{ position: "fixed", inset: 0,
        background: "rgba(7,22,47,0.75)", display: "flex",
        alignItems: "center", justifyContent: "center",
        zIndex: 600, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 12, width: "min(560px,95vw)",
        maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 25px 80px rgba(7,22,47,0.35)",
        border: "1px solid #CBD5E1",
      }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#07162F,#0C2D5E)",
          padding: "20px 26px", position: "relative" }}>
          {!uploading && <button onClick={onClose} style={S.modalClose}>×</button>}
          <div style={S.modalEyebrow}>Evidence Locker</div>
          <div style={S.modalTitle}>Upload Documents</div>
          <div style={{ color: "#64748B", fontSize: 12, marginTop: 3 }}>
            PDF, Word, Excel, JPG, PNG — max {MAX_MB}MB per file
          </div>
        </div>

        <div style={{ padding: "22px 26px", display: "flex",
          flexDirection: "column", gap: 18 }}>

          {/* Programme select */}
          <div>
            <label style={S.label}>Programme *</label>
            <select value={programmeId}
              onChange={e => { setProgrammeId(e.target.value); setErrors(p => ({ ...p, programmeId: "" })); }}
              disabled={uploading}
              style={{ ...S.input, color: programmeId ? "#07162F" : "#94A3B8",
                borderColor: errors.programmeId ? "#DC2626" : "#CBD5E1" }}>
              <option value="">Select programme…</option>
              {programmes.map(p => (
                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
              ))}
            </select>
            {errors.programmeId && <div style={S.fieldErr}>{errors.programmeId}</div>}
          </div>

          {/* Category select */}
          <div>
            <label style={S.label}>Document Category *</label>
            <select value={category}
              onChange={e => { setCategory(e.target.value); setErrors(p => ({ ...p, category: "" })); }}
              disabled={uploading}
              style={{ ...S.input, color: category ? "#07162F" : "#94A3B8",
                borderColor: errors.category ? "#DC2626" : "#CBD5E1" }}>
              <option value="">Select category…</option>
              {DOC_CATEGORIES.map(c => (
                <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
              ))}
            </select>
            {errors.category && <div style={S.fieldErr}>{errors.category}</div>}
          </div>

          {/* Drop zone */}
          <div>
            <label style={S.label}>Files *</label>
            <div
              ref={dropRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !uploading && inputRef.current?.click()}
              style={{
                border: `2px dashed ${errors.files ? "#DC2626" : "#CBD5E1"}`,
                borderRadius: 10, padding: "28px 20px", textAlign: "center",
                background: "#FAFAFA", cursor: uploading ? "default" : "pointer",
                transition: "border-color 0.15s, background 0.15s",
              }}>
              <input ref={inputRef} type="file" multiple
                accept={ALLOWED_EXT} style={{ display: "none" }}
                onChange={e => addFiles([...e.target.files])} />
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.35 }}>📁</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                {uploading ? "Upload in progress…" : "Drop files here or click to browse"}
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                You can select multiple files at once
              </div>
            </div>
            {errors.files && <div style={S.fieldErr}>{errors.files}</div>}
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {files.map(item => (
                <div key={item.id} style={{
                  border: `1px solid ${item.status === "error" ? "#FCA5A5" : item.status === "done" ? "#6EE7B7" : "#E2E8F0"}`,
                  borderRadius: 8, padding: "10px 14px",
                  background: item.status === "error" ? "#FEF2F2" : item.status === "done" ? "#F0FDF4" : "#F8FAFC",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>
                        {item.status === "done" ? "✅" : item.status === "error" ? "❌" : "📄"}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#07162F",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.file.name}
                        </div>
                        <div style={{ fontSize: 10, color: "#94A3B8",
                          fontFamily: "'IBM Plex Mono',monospace" }}>
                          {fmtSize(item.file.size)}
                        </div>
                      </div>
                    </div>
                    {item.status !== "uploading" && !allDone && (
                      <button onClick={() => removeFile(item.id)}
                        style={{ background: "none", border: "none", cursor: "pointer",
                          fontSize: 16, color: "#94A3B8", padding: 4, flexShrink: 0 }}>
                        ×
                      </button>
                    )}
                    {item.status === "done" && (
                      <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace",
                        fontWeight: 700, color: "#059669", flexShrink: 0 }}>Uploaded</span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {item.status === "uploading" && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 4, background: "#E5E7EB",
                        borderRadius: 9999, overflow: "hidden" }}>
                        <div style={{ height: "100%", background: "#2563EB",
                          borderRadius: 9999, width: `${item.progress}%`,
                          transition: "width 0.3s ease" }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#2563EB", marginTop: 4,
                        fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>
                        {item.progress}%
                      </div>
                    </div>
                  )}
                  {item.status === "error" && (
                    <div style={{ fontSize: 11, color: "#DC2626", marginTop: 5 }}>
                      {item.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            {!allDone && (
              <button onClick={!uploading ? onClose : undefined}
                disabled={uploading} style={{ ...S.btnSec, opacity: uploading ? 0.5 : 1 }}>
                Cancel
              </button>
            )}
            {allDone ? (
              <button onClick={onClose} style={{ ...S.btnPri, flex: 1,
                justifyContent: "center", display: "flex",
                background: "linear-gradient(135deg,#059669,#047857)" }}>
                ✓ Done
              </button>
            ) : (
              <button onClick={handleUpload} disabled={uploading || files.length === 0}
                style={{ ...S.btnPri, flex: 1, justifyContent: "center",
                  display: "flex", alignItems: "center", gap: 6,
                  opacity: uploading || files.length === 0 ? 0.6 : 1 }}>
                {uploading ? (
                  <><span style={S.spinner} /> Uploading…</>
                ) : (
                  `📤 Upload ${files.length > 0 ? `${files.length} File${files.length > 1 ? "s" : ""}` : ""}`
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Documents Page ────────────────────────────────────────────────────────
export default function Documents() {
  const { isNUCVisitor, can } = useRole();
  const [documents,   setDocuments]   = useState([]);
  const [programmes,  setProgrammes]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [totalCount,  setTotalCount]  = useState(0);

  // Filters
  const [search,      setSearch]      = useState("");
  const [catFilter,   setCatFilter]   = useState("");
  const [progFilter,  setProgFilter]  = useState("");
  const [verFilter,   setVerFilter]   = useState("");   // "" | "true" | "false"
  const [ordering,    setOrdering]    = useState("-uploaded_at");
  const [page,        setPage]        = useState(1);
  const PAGE_SIZE = 20;

  // Modals
  const [showUpload,   setShowUpload]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { toasts, push: toast } = useToast();

  // ── Load documents ───────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: PAGE_SIZE,
        ordering,
        ...(search    && { search }),
        ...(catFilter && { category: catFilter }),
        ...(progFilter && { programme: progFilter }),
        ...(verFilter  && { verified: verFilter }),
      };
      const res = await documentsAPI.listAll(params);
      // DRF pagination: { count, results } or flat array
      if (res.data.results) {
        setDocuments(res.data.results);
        setTotalCount(res.data.count);
      } else {
        setDocuments(res.data);
        setTotalCount(res.data.length);
      }
    } catch {
      // Fallback demo data so the UI is still usable before backend is ready
      setDocuments(DEMO_DOCS);
      setTotalCount(DEMO_DOCS.length);
    } finally {
      setLoading(false);
    }
  }, [search, catFilter, progFilter, verFilter, ordering, page]);

  // Load programmes (for upload modal dropdown + filter)
  const loadProgrammes = useCallback(async () => {
    try {
      const res = await programmesAPI.list();
      setProgrammes(res.data.results || res.data);
    } catch {
      setProgrammes(DEMO_PROGRAMMES);
    }
  }, []);

  useEffect(() => { loadProgrammes(); }, [loadProgrammes]);
  useEffect(() => { load(); }, [load]);
  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, catFilter, progFilter, verFilter, ordering]);

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await documentsAPI.delete(deleteTarget.id);
      setDocuments(p => p.filter(d => d.id !== deleteTarget.id));
      setTotalCount(p => p - 1);
      toast(`"${deleteTarget.file_name || deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      toast(err.response?.data?.detail || "Delete failed. Please try again.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── After edit ────────────────────────────────────────────────────────────────
  const handleSaved = (updated) => {
    setDocuments(p => p.map(d => d.id === updated.id ? updated : d));
  };

  // ── Sort helper ────────────────────────────────────────────────────────────────
  const toggleSort = (field) => {
    setOrdering(prev => prev === field ? `-${field}` : field);
  };
  const sortIcon = (field) => {
    if (ordering === field)   return " ↑";
    if (ordering === `-${field}`) return " ↓";
    return "";
  };

  // ── KPI counts ────────────────────────────────────────────────────────────────
  const verified   = documents.filter(d => d.verified).length;
  const unverified = documents.filter(d => !d.verified).length;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div style={{ fontFamily: "'IBM Plex Sans','Segoe UI',sans-serif",
      background: "#F0F4F8", minHeight: "100vh", padding: "32px 36px" }}>

      {/* NUC Visitor read-only banner */}
      {isNUCVisitor && (
        <div style={{
          background:"#EDE9FE", border:"1px solid #C4B5FD",
          borderRadius:8, padding:"11px 16px", marginBottom:20,
          fontSize:12, color:"#7C3AED",
          display:"flex", alignItems:"center", gap:8,
          fontFamily:"'IBM Plex Mono',monospace", fontWeight:600,
        }}>
          🔍 Read-only view — you can view and download verified documents only.
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        input:focus, select:focus, textarea:focus { border-color: #0C2D5E !important; box-shadow: 0 0 0 3px rgba(12,45,94,0.08); }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 26, display: "flex",
        justifyContent: "space-between", alignItems: "flex-end",
        flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ fontSize: 10, color: "#94A3B8",
            fontFamily: "'IBM Plex Mono',monospace",
            letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
            Evidence Locker · All Programmes
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#07162F", margin: 0 }}>
            Document Management
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
            Upload, manage, and track NUC accreditation documents across all programmes.
          </p>
        </div>
        {!isNUCVisitor && (
          <button onClick={() => setShowUpload(true)} style={{
            ...S.btnPri, display: "flex", alignItems: "center", gap: 8,
            padding: "11px 20px", fontSize: 13,
          }}>
            📤 Upload Documents
          </button>
        )}
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)",
        gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Documents",  value: totalCount,    icon: "📄", color: "#07162F" },
          { label: "Verified",         value: verified,      icon: "✅", color: "#059669" },
          { label: "Pending Review",   value: unverified,    icon: "⏳", color: "#D97706" },
          { label: "Programmes",       value: programmes.length, icon: "🏛", color: "#2563EB" },
        ].map((k, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #E2E8F0",
            borderRadius: 10, padding: "18px 20px",
            boxShadow: "0 1px 4px rgba(7,22,47,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 9, color: "#94A3B8",
                  fontFamily: "'IBM Plex Mono',monospace",
                  letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                  {k.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: k.color,
                  fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1 }}>
                  {loading ? "—" : k.value}
                </div>
              </div>
              <span style={{ fontSize: 22, opacity: 0.12, alignSelf: "flex-start" }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters bar ── */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0",
        borderRadius: 10, padding: "14px 18px", marginBottom: 18,
        display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
        boxShadow: "0 1px 4px rgba(7,22,47,0.06)" }}>

        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <span style={{ position: "absolute", left: 11, top: "50%",
            transform: "translateY(-50%)", fontSize: 13, color: "#94A3B8" }}>🔍</span>
          <input value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by filename…"
            style={{ ...S.input, paddingLeft: 34, margin: 0 }}
          />
        </div>

        {/* Programme filter */}
        <select value={progFilter}
          onChange={e => setProgFilter(e.target.value)}
          style={{ ...S.input, width: "auto", minWidth: 170,
            color: progFilter ? "#07162F" : "#94A3B8" }}>
          <option value="">All Programmes</option>
          {programmes.map(p => (
            <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
          ))}
        </select>

        {/* Category filter */}
        <select value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          style={{ ...S.input, width: "auto", minWidth: 160,
            color: catFilter ? "#07162F" : "#94A3B8" }}>
          <option value="">All Categories</option>
          {DOC_CATEGORIES.map(c => (
            <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
          ))}
        </select>

        {/* Verified filter */}
        <select value={verFilter}
          onChange={e => setVerFilter(e.target.value)}
          style={{ ...S.input, width: "auto", minWidth: 140,
            color: verFilter ? "#07162F" : "#94A3B8" }}>
          <option value="">All Statuses</option>
          <option value="true">✅ Verified</option>
          <option value="false">⏳ Pending</option>
        </select>

        {/* Clear */}
        {(search || catFilter || progFilter || verFilter) && (
          <button onClick={() => {
            setSearch(""); setCatFilter(""); setProgFilter(""); setVerFilter("");
          }} style={{ ...S.btnSec, fontSize: 11, padding: "7px 12px",
            color: "#DC2626", borderColor: "#FCA5A5" }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Category quick-filter chips ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => setCatFilter("")} style={{
          ...S.chip, ...(catFilter === "" ? S.chipActive : {}),
        }}>All</button>
        {DOC_CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setCatFilter(c.key)} style={{
            ...S.chip, ...(catFilter === c.key ? S.chipActive : {}),
          }}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* ── Documents table ── */}
      <div style={{ background: "#fff", borderRadius: 10,
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 4px rgba(7,22,47,0.06)", overflow: "hidden" }}>

        {/* Table header with sort */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {[
                  { label: "Document",   field: "file_name"   },
                  { label: "Programme",  field: "programme"   },
                  { label: "Category",   field: "category"    },
                  { label: "Uploaded",   field: "uploaded_at" },
                  { label: "Size",       field: "file_size"   },
                  { label: "Status",     field: "verified"    },
                  { label: "Actions",    field: null          },
                ].map(col => (
                  <th key={col.label} onClick={col.field ? () => toggleSort(col.field) : undefined}
                    style={{
                      padding: "11px 14px", textAlign: "left",
                      fontSize: 9, color: "#94A3B8",
                      fontFamily: "'IBM Plex Mono',monospace",
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      fontWeight: 700, borderBottom: "2px solid #E2E8F0",
                      whiteSpace: "nowrap", userSelect: "none",
                      cursor: col.field ? "pointer" : "default",
                      background: col.field && (ordering === col.field || ordering === `-${col.field}`)
                        ? "#F0F4F8" : "transparent",
                    }}>
                    {col.label}{col.field ? sortIcon(col.field) : ""}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                // Skeleton rows
                [...Array(6)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    {[...Array(7)].map((__, j) => (
                      <td key={j} style={{ padding: "14px" }}>
                        <div style={{ height: 12, borderRadius: 4,
                          background: "#F1F5F9",
                          width: j === 0 ? "70%" : j === 6 ? "60%" : "80%",
                          animation: "pulse 1.5s infinite" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "56px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📭</div>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace",
                      color: "#94A3B8", fontSize: 13, marginBottom: 12 }}>
                      No documents found.
                    </div>
                    <button onClick={() => setShowUpload(true)} style={S.btnPri}>
                      📤 Upload the first document
                    </button>
                  </td>
                </tr>
              ) : documents.map((doc, i) => (
                <tr key={doc.id} style={{
                  borderBottom: "1px solid #F1F5F9",
                  background: i % 2 === 0 ? "#fff" : "#FAFBFC",
                  transition: "background 0.1s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#EFF6FF"}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFBFC"}
                >
                  {/* Document name */}
                  <td style={{ padding: "12px 14px", maxWidth: 240 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{catIcon(doc.category)}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#07162F",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {doc.file_name || doc.name}
                        </div>
                        {doc.file_url && (
                          <a href={`${BASE_URL}${doc.file_url}`}
                            target="_blank" rel="noreferrer"
                            style={{ fontSize: 10, color: "#2563EB",
                              textDecoration: "none", fontFamily: "'IBM Plex Mono',monospace" }}
                            onClick={e => e.stopPropagation()}>
                            ↗ Open file
                          </a>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Programme */}
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#07162F" }}>
                      {doc.programme_code || doc.programme?.code || "—"}
                    </div>
                    <div style={{ fontSize: 10, color: "#94A3B8",
                      overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap", maxWidth: 140 }}>
                      {doc.programme_name || doc.programme?.name || ""}
                    </div>
                  </td>

                  {/* Category */}
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      fontSize: 10, fontFamily: "'IBM Plex Mono',monospace",
                      background: "#EFF6FF", color: "#1D4ED8",
                      border: "1px solid #BFDBFE",
                      padding: "2px 8px", borderRadius: 3, fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}>
                      {catLabel(doc.category)}
                    </span>
                  </td>

                  {/* Uploaded */}
                  <td style={{ padding: "12px 14px",
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 11, color: "#64748B", whiteSpace: "nowrap" }}>
                    {fmtDate(doc.uploaded_at)}
                    {doc.uploaded_by_name && (
                      <div style={{ fontSize: 10, color: "#94A3B8" }}>
                        {doc.uploaded_by_name}
                      </div>
                    )}
                  </td>

                  {/* Size */}
                  <td style={{ padding: "12px 14px",
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 11, color: "#64748B" }}>
                    {fmtSize(doc.file_size)}
                  </td>

                  {/* Verified badge */}
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      fontSize: 10, fontFamily: "'IBM Plex Mono',monospace",
                      fontWeight: 700, padding: "3px 9px", borderRadius: 4,
                      background: doc.verified ? "#D1FAE5" : "#FEF3C7",
                      color:      doc.verified ? "#065F46" : "#92400E",
                      border: `1px solid ${doc.verified ? "#6EE7B7" : "#FCD34D"}`,
                      whiteSpace: "nowrap",
                    }}>
                      {doc.verified ? "✓ Verified" : "⏳ Pending"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                      {/* View / Download — all roles */}
                      {doc.file_url ? (
                        <a href={`${BASE_URL}${doc.file_url}`}
                          target="_blank" rel="noreferrer"
                          style={{ ...S.actionBtn, textDecoration: "none",
                            background: "#F8FAFC", color: "#374151",
                            border: "1px solid #E2E8F0" }}>
                          👁 View
                        </a>
                      ) : (
                        <button disabled style={{ ...S.actionBtn,
                          opacity: 0.4, cursor: "not-allowed" }}>
                          👁 View
                        </button>
                      )}

                      {/* Edit — HOD + APU only */}
                      {!isNUCVisitor && (
                        <button onClick={() => setEditTarget(doc)}
                          style={{ ...S.actionBtn,
                            background: "#EFF6FF", color: "#1D4ED8",
                            border: "1px solid #BFDBFE" }}>
                          ✏ Edit
                        </button>
                      )}

                      {/* Verify — APU only */}
                      {can.verifyDocument && !doc.verified && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await documentsAPI.verify(doc.id);
                              handleSaved(res.data);
                              toast("Document marked as verified.");
                            } catch {
                              toast("Could not verify document.", "error");
                            }
                          }}
                          style={{ ...S.actionBtn,
                            background: "#D1FAE5", color: "#065F46",
                            border: "1px solid #6EE7B7" }}>
                          ✓ Verify
                        </button>
                      )}

                      {/* Delete — HOD + APU only */}
                      {!isNUCVisitor && (
                        <button onClick={() => setDeleteTarget(doc)}
                          style={{ ...S.actionBtn,
                            background: "#FEF2F2", color: "#DC2626",
                            border: "1px solid #FECACA" }}>
                          🗑 Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ padding: "14px 18px", borderTop: "1px solid #E2E8F0",
            display: "flex", justifyContent: "space-between",
            alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 12, color: "#64748B",
              fontFamily: "'IBM Plex Mono',monospace" }}>
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ ...S.btnSec, padding: "6px 12px", fontSize: 11,
                  opacity: page === 1 ? 0.4 : 1 }}>
                ← Prev
              </button>
              {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                const n = i + 1;
                return (
                  <button key={n} onClick={() => setPage(n)} style={{
                    ...S.btnSec, padding: "6px 12px", fontSize: 11,
                    background: page === n ? "#07162F" : "#fff",
                    color:      page === n ? "#fff"    : "#374151",
                    borderColor: page === n ? "#07162F" : "#CBD5E1",
                  }}>{n}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ ...S.btnSec, padding: "6px 12px", fontSize: 11,
                  opacity: page === totalPages ? 0.4 : 1 }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showUpload && (
        <UploadModal
          programmes={programmes}
          onClose={() => setShowUpload(false)}
          onUploaded={load}
          toast={toast}
        />
      )}
      {editTarget && (
        <EditModal
          doc={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
          toast={toast}
        />
      )}
      {deleteTarget && (
        <ConfirmDelete
          doc={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      {/* ── Toast stack ── */}
      <Toast toasts={toasts} />
    </div>
  );
}

// ── Shared style tokens ────────────────────────────────────────────────────────
const S = {
  input: {
    width: "100%", padding: "9px 13px",
    border: "1.5px solid #CBD5E1", borderRadius: 7,
    fontFamily: "'IBM Plex Sans',sans-serif",
    fontSize: 13, color: "#07162F", background: "#fff",
    outline: "none", boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  label: {
    fontSize: 11, fontFamily: "'IBM Plex Mono',monospace",
    fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", color: "#374151",
    display: "block", marginBottom: 7,
  },
  hint: { fontSize: 11, color: "#94A3B8", marginTop: 3, lineHeight: 1.5 },
  fieldErr: { fontSize: 11, color: "#DC2626", marginTop: 4, fontWeight: 500 },
  errorBox: {
    background: "#FEE2E2", border: "1px solid #FCA5A5",
    color: "#DC2626", borderRadius: 7, padding: "10px 14px",
    fontSize: 13, fontWeight: 500,
  },
  btnPri: {
    padding: "9px 18px", borderRadius: 7, cursor: "pointer",
    fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: 12,
    background: "linear-gradient(135deg,#07162F,#0C2D5E)",
    color: "#fff", border: "none", letterSpacing: "0.04em",
  },
  btnSec: {
    padding: "9px 16px", borderRadius: 7, cursor: "pointer",
    fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: 12,
    background: "#fff", color: "#374151", border: "1.5px solid #CBD5E1",
  },
  btnDanger: {
    padding: "9px 18px", borderRadius: 7, cursor: "pointer",
    fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: 12,
    background: "#DC2626", color: "#fff", border: "none",
  },
  actionBtn: {
    padding: "4px 9px", borderRadius: 5, cursor: "pointer",
    fontFamily: "'IBM Plex Mono',monospace", fontSize: 10,
    fontWeight: 700, whiteSpace: "nowrap",
  },
  chip: {
    padding: "4px 12px", borderRadius: 20, cursor: "pointer",
    fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 700,
    border: "1.5px solid #E2E8F0", background: "#fff", color: "#6B7280",
    transition: "all 0.12s",
  },
  chipActive: {
    background: "#EFF6FF", color: "#1D4ED8", borderColor: "#BFDBFE",
  },
  modalClose: {
    position: "absolute", top: 14, right: 14,
    width: 28, height: 28, borderRadius: "50%",
    background: "rgba(255,255,255,0.1)", border: "none",
    color: "#fff", fontSize: 16, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modalEyebrow: {
    fontSize: 9, color: "#94A3B8", fontFamily: "'IBM Plex Mono',monospace",
    letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4,
  },
  modalTitle: { fontSize: 17, fontWeight: 700, color: "#fff" },
  spinner: {
    display: "inline-block", width: 14, height: 14,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff", borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
};

// ── Demo fallback data ────────────────────────────────────────────────────────
const DEMO_PROGRAMMES = [
  { id: "C001", code: "CPE", name: "B.Eng. Computer Engineering" },
  { id: "C002", code: "BCH", name: "B.Sc. Biochemistry" },
  { id: "C003", code: "LAW", name: "LL.B. Law" },
];
const DEMO_DOCS = [
  { id:"D001", file_name:"CPE301 Marking Scheme 2024.pdf", category:"marking_schemes", programme_code:"CPE", programme_name:"B.Eng. Computer Engineering", uploaded_at:"2024-02-10", file_size:245760, verified:true,  file_url:null, uploaded_by_name:"Dr. A. Okafor" },
  { id:"D002", file_name:"Data Structures Lecture Notes.pdf", category:"lesson_notes", programme_code:"CPE", programme_name:"B.Eng. Computer Engineering", uploaded_at:"2024-01-22", file_size:1258291, verified:true,  file_url:null, uploaded_by_name:"Dr. A. Okafor" },
  { id:"D003", file_name:"300L CA Records 2023.xlsx",   category:"ca_records",       programme_code:"CPE", programme_name:"B.Eng. Computer Engineering", uploaded_at:"2024-03-01", file_size:90112,  verified:false, file_url:null, uploaded_by_name:"Mrs. B. Eze" },
  { id:"D004", file_name:"External Examiner Report 2023.pdf", category:"examiner_reports", programme_code:"BCH", programme_name:"B.Sc. Biochemistry", uploaded_at:"2023-12-15", file_size:524288, verified:true, file_url:null, uploaded_by_name:"Prof. C. Nwosu" },
  { id:"D005", file_name:"Staff CV — Dr. Emeka Obi.pdf", category:"staff_files",     programme_code:"CPE", programme_name:"B.Eng. Computer Engineering", uploaded_at:"2024-01-05", file_size:184320, verified:true,  file_url:null, uploaded_by_name:"Dr. A. Okafor" },
  { id:"D006", file_name:"LAW401 Question Paper 2024.pdf", category:"question_papers", programme_code:"LAW", programme_name:"LL.B. Law", uploaded_at:"2024-04-20", file_size:102400, verified:false, file_url:null, uploaded_by_name:"Mr. D. Adeyemi" },
  { id:"D007", file_name:"BCH Research Publication 2023.pdf", category:"research_evidence", programme_code:"BCH", programme_name:"B.Sc. Biochemistry", uploaded_at:"2024-02-28", file_size:819200, verified:true, file_url:null, uploaded_by_name:"Prof. C. Nwosu" },
  { id:"D008", file_name:"Faculty QA Report Q1 2024.pdf", category:"qa_reports",     programme_code:"CPE", programme_name:"B.Eng. Computer Engineering", uploaded_at:"2024-04-01", file_size:307200, verified:false, file_url:null, uploaded_by_name:"Dr. A. Okafor" },
];