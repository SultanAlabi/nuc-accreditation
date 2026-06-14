
// src/pages/Dashboard.jsx
// NO role restriction on this route — all three roles land here.
// Internally renders HODDashboard, APUDashboard, or NUCDashboard based on role.

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRole, STATUS } from "../hooks/useRole";
import { programmesAPI, notificationsAPI } from "../services/api";


const PAGE   = { fontFamily:"'Segoe UI',Arial,sans-serif", background:"#F0F4F8", minHeight:"100vh", padding:"32px 36px" };
const H1     = { fontSize:26, fontWeight:700, color:"#07162F", margin:"0 0 5px" };
const SUB    = { fontSize:13, color:"#64748B", margin:0 };
const LABEL  = { fontSize:10, fontWeight:700, fontFamily:"monospace", color:"#6B7280", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:12 };
const BP     = { padding:"9px 18px", borderRadius:7, cursor:"pointer", fontFamily:"monospace", fontWeight:700, fontSize:12, background:"linear-gradient(135deg,#07162F,#0C2D5E)", color:"#fff", border:"none" };
const BS     = { padding:"9px 14px", borderRadius:7, cursor:"pointer", fontFamily:"monospace", fontWeight:700, fontSize:12, background:"#fff", color:"#374151", border:"1.5px solid #CBD5E1" };
const BPURP  = { padding:"9px 14px", borderRadius:7, cursor:"pointer", fontFamily:"monospace", fontWeight:700, fontSize:12, background:"#7C3AED", color:"#fff", border:"none" };
const BGREEN = { padding:"9px 14px", borderRadius:7, cursor:"pointer", fontFamily:"monospace", fontWeight:700, fontSize:12, background:"#059669", color:"#fff", border:"none" };
const BRED   = { padding:"9px 14px", borderRadius:7, cursor:"pointer", fontFamily:"monospace", fontWeight:700, fontSize:12, background:"#DC2626", color:"#fff", border:"none" };

const STATUS_CFG = {
  PENDING:          { label:"Pending",          bg:"#FEF3C7", color:"#D97706", dot:"#D97706", border:"#FCD34D" },
  IN_REVIEW:        { label:"In Review",         bg:"#DBEAFE", color:"#2563EB", dot:"#2563EB", border:"#BFDBFE" },
  FORWARDED_TO_NUC: { label:"Forwarded to NUC", bg:"#EDE9FE", color:"#7C3AED", dot:"#7C3AED", border:"#C4B5FD" },
  ACCREDITED:       { label:"Accredited",        bg:"#D1FAE5", color:"#059669", dot:"#059669", border:"#6EE7B7" },
  DENIED:           { label:"Denied",            bg:"#FEE2E2", color:"#DC2626", dot:"#DC2626", border:"#FCA5A5" },
};

// ── Shared atoms ──────────────────────────────────────────────────────────────
function Badge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.PENDING;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:4, background:s.bg, color:s.color,
      border:`1px solid ${s.border}`, fontFamily:"monospace",
      fontSize:10, fontWeight:700, textTransform:"uppercase", whiteSpace:"nowrap" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot }}/>
      {s.label}
    </span>
  );
}

function KPI({ label, value, sub, color, icon, loading, onClick, accent }) {
  return (
    <div onClick={onClick} style={{
      background:"#fff", border:"1px solid #E2E8F0",
      borderTop:`3px solid ${accent||"#E2E8F0"}`,
      borderRadius:10, padding:"20px 22px",
      boxShadow:"0 1px 4px rgba(7,22,47,0.06)",
      cursor:onClick?"pointer":"default", transition:"all 0.15s" }}
      onMouseEnter={e=>{if(onClick){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 20px rgba(7,22,47,0.1)";}}}
      onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 1px 4px rgba(7,22,47,0.06)";}}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:9, color:"#94A3B8", fontFamily:"monospace",
            letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>{label}</div>
          {loading
            ? <div style={{ height:34, width:64, background:"#F1F5F9", borderRadius:6, animation:"pulse 1.5s infinite" }}/>
            : <div style={{ fontSize:32, fontWeight:700, color:color||"#07162F", fontFamily:"monospace", lineHeight:1 }}>{value??0}</div>}
          <div style={{ fontSize:11, color:"#94A3B8", marginTop:6 }}>{sub}</div>
        </div>
        <span style={{ fontSize:24, opacity:0.08 }}>{icon}</span>
      </div>
    </div>
  );
}

function QuickLink({ icon, label, sub, action }) {
  return (
    <div onClick={action} style={{ background:"#fff", border:"1px solid #E2E8F0",
      borderRadius:10, padding:"16px 18px", cursor:"pointer",
      boxShadow:"0 1px 4px rgba(7,22,47,0.06)", transition:"all 0.15s" }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 20px rgba(7,22,47,0.1)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 1px 4px rgba(7,22,47,0.06)";}}>
      <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:13, fontWeight:700, color:"#07162F" }}>{label}</div>
      <div style={{ fontSize:11, color:"#94A3B8", marginTop:3 }}>{sub}</div>
    </div>
  );
}

function DenyModal({ programme, onConfirm, onClose, loading }) {
  const [comment, setComment] = useState("");
  if (!programme) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0,
      background:"rgba(7,22,47,0.75)", display:"flex",
      alignItems:"center", justifyContent:"center",
      zIndex:500, backdropFilter:"blur(4px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#fff", borderRadius:12, width:"min(480px,95vw)",
        padding:"28px", boxShadow:"0 25px 80px rgba(7,22,47,0.35)" }}>
        <h3 style={{ fontSize:18, fontWeight:700, color:"#DC2626", margin:"0 0 6px" }}>
          Deny Programme
        </h3>
        <p style={{ fontSize:13, color:"#64748B", margin:"0 0 16px" }}>
          <strong>{programme.name}</strong> — provide a reason. This will be sent to the HOD.
        </p>
        <label style={{ display:"block", fontSize:11, fontFamily:"monospace",
          fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
          color:"#374151", marginBottom:7 }}>
          Reason for Denial *
        </label>
        <textarea value={comment} onChange={e=>setComment(e.target.value)}
          placeholder="Provide a clear reason why this programme is being denied…"
          rows={4} style={{ width:"100%", padding:"10px 13px",
            border:"1.5px solid #CBD5E1", borderRadius:7,
            fontFamily:"'Segoe UI',Arial,sans-serif", fontSize:13,
            color:"#07162F", background:"#fff", outline:"none",
            boxSizing:"border-box", resize:"vertical", marginBottom:16 }}/>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={BS}>Cancel</button>
          <button onClick={()=>onConfirm(comment)}
            disabled={!comment.trim()||loading}
            style={{ ...BRED, opacity:(!comment.trim()||loading)?0.5:1 }}>
            {loading?"Submitting…":"Confirm Deny"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToastMsg({ toast }) {
  if (!toast) return null;
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999,
      background:toast.type==="error"?"#DC2626":"#059669",
      color:"#fff", padding:"12px 20px", borderRadius:8,
      fontSize:13, fontWeight:600, minWidth:240,
      boxShadow:"0 8px 24px rgba(7,22,47,0.25)",
      borderLeft:`3px solid ${toast.type==="error"?"#FCA5A5":"#6EE7B7"}`,
      animation:"fadeIn 0.2s ease" }}>
      {toast.type==="error"?"⚠ ":"✓ "}{toast.msg}
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(()=>setToast(null), 3500);
  };
  return { toast, show };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOD DASHBOARD — My programmes (PENDING + IN_REVIEW), submit buttons
// ═══════════════════════════════════════════════════════════════════════════════
function HODDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, show } = useToast();
  const [programmes, setProgrammes] = useState([]);
  const [unread,     setUnread]     = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [actionLoad, setActionLoad] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, rRes, nRes] = await Promise.all([
        programmesAPI.list({ status:"PENDING" }),
        programmesAPI.list({ status:"IN_REVIEW" }),
        notificationsAPI.list(),
      ]);
      setProgrammes([...(pRes.data||[]), ...(rRes.data||[])]);
      setUnread((nRes.data||[]).filter(n=>!n.is_read).length);
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(()=>{ load(); },[load]);

  const handleSubmit = async (id) => {
    setActionLoad(p=>({...p,[id]:"submit"}));
    try {
      await programmesAPI.submit(id);
      show("Programme submitted for APU review.");
      load();
    } catch(e){ show(e.response?.data?.error||"Failed to submit.","error"); }
    finally { setActionLoad(p=>({...p,[id]:null})); }
  };

  const pending  = programmes.filter(p=>p.status==="PENDING");
  const inReview = programmes.filter(p=>p.status==="IN_REVIEW");

  return (
    <div style={PAGE}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}`}</style>

      <div style={{ marginBottom:28, display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:10, color:"#94A3B8", fontFamily:"monospace", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Head of Department</div>
          <h1 style={H1}>My Dashboard</h1>
          <p style={SUB}>Welcome back, {user?.first_name||"HOD"}. Here's where your programmes stand.</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={load} style={BS}>🔄 Refresh</button>
          <button onClick={()=>navigate("/courses/new")} style={BP}>+ New Programme</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
        <KPI label="Total Programmes"  value={programmes.length} sub="All my submissions"  color="#07162F" icon="◈"  loading={loading} accent="#07162F"/>
        <KPI label="Pending"           value={pending.length}    sub="Need submission"     color="#D97706" icon="⏳" loading={loading} accent="#D97706"/>
        <KPI label="In Review"         value={inReview.length}   sub="With APU Officer"   color="#2563EB" icon="🔍" loading={loading} accent="#2563EB"/>
        <KPI label="Unread Alerts"     value={unread}            sub="Notifications"       color="#DC2626" icon="🔔" loading={loading} accent="#DC2626" onClick={()=>navigate("/notifications")}/>
      </div>

      {!loading && pending.length>0 && (
        <div style={{ background:"linear-gradient(135deg,#FEF3C7,#FDE68A)", border:"1px solid #F59E0B",
          borderRadius:10, padding:"14px 20px", marginBottom:24,
          display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>⚡</span>
          <div>
            <div style={{ fontWeight:700, color:"#92400E", fontSize:13 }}>{pending.length} programme{pending.length>1?"s":""} awaiting your submission</div>
            <div style={{ fontSize:12, color:"#78350F", marginTop:2 }}>Submit them to APU to move the accreditation process forward.</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
          {[1,2,3].map(i=><div key={i} style={{ height:180, background:"#fff", borderRadius:10, border:"1px solid #E2E8F0", animation:"pulse 1.5s infinite" }}/>)}
        </div>
      ) : programmes.length===0 ? (
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #E2E8F0", padding:"64px 20px", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12, opacity:0.15 }}>📋</div>
          <div style={{ fontFamily:"monospace", color:"#94A3B8", fontSize:13, marginBottom:14 }}>No programmes yet.</div>
          <button onClick={()=>navigate("/courses/new")} style={BP}>+ Create Programme</button>
        </div>
      ) : (
        <>
          {pending.length>0 && (
            <div style={{ marginBottom:24 }}>
              <div style={LABEL}>Pending — Awaiting Submission ({pending.length})</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
                {pending.map(p=>(
                  <div key={p.id} style={{ background:"#fff", border:"1px solid #FCD34D", borderLeft:"4px solid #D97706", borderRadius:10, padding:"16px 18px", boxShadow:"0 1px 4px rgba(7,22,47,0.06)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div>
                        <div style={{ fontSize:9, color:"#94A3B8", fontFamily:"monospace", textTransform:"uppercase", marginBottom:2 }}>{p.faculty} · {p.department}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#07162F" }}>{p.name}</div>
                      </div>
                      <Badge status={p.status}/>
                    </div>
                    <div style={{ fontSize:12, color:"#64748B", marginBottom:12 }}>👨‍🎓 {p.student_count||0} students · 👨‍🏫 {p.staff_count||0} staff</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>navigate(`/courses/${p.id}`)} style={BS}>View →</button>
                      <button onClick={()=>handleSubmit(p.id)} disabled={actionLoad[p.id]==="submit"}
                        style={{ ...BP, opacity:actionLoad[p.id]?0.7:1 }}>
                        {actionLoad[p.id]==="submit"?"Submitting…":"📤 Submit for Review"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {inReview.length>0 && (
            <div>
              <div style={LABEL}>In Review with APU ({inReview.length})</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
                {inReview.map(p=>(
                  <div key={p.id} style={{ background:"#fff", border:"1px solid #BFDBFE", borderLeft:"4px solid #2563EB", borderRadius:10, padding:"16px 18px", boxShadow:"0 1px 4px rgba(7,22,47,0.06)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div>
                        <div style={{ fontSize:9, color:"#94A3B8", fontFamily:"monospace", textTransform:"uppercase", marginBottom:2 }}>{p.faculty} · {p.department}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#07162F" }}>{p.name}</div>
                      </div>
                      <Badge status={p.status}/>
                    </div>
                    <div style={{ fontSize:12, color:"#64748B", marginBottom:12 }}>👨‍🎓 {p.student_count||0} students · 👨‍🏫 {p.staff_count||0} staff</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>navigate(`/courses/${p.id}`)} style={BS}>View Details →</button>
                      <button onClick={()=>navigate(`/documents?programme=${p.id}`)} style={{ ...BS, color:"#059669", borderColor:"#6EE7B7" }}>📁 Documents</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop:28, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14 }}>
        <QuickLink icon="📁" label="Upload Documents"  sub="Add evidence to your programmes"    action={()=>navigate("/documents")}/>
        <QuickLink icon="⊞"  label="Ratio Calculator"  sub="Check NUC staff:student compliance" action={()=>navigate("/calculator")}/>
        <QuickLink icon="📋" label="NUC Standards"      sub="View minimum ratio requirements"    action={()=>navigate("/nuc-standards")}/>
        <QuickLink icon="🔔" label="Notifications"      sub={`${unread} unread alert${unread!==1?"s":""}`} action={()=>navigate("/notifications")}/>
      </div>
      <ToastMsg toast={toast}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APU DASHBOARD — IN_REVIEW queue, forward to NUC, verify docs, waiting badge
// ═══════════════════════════════════════════════════════════════════════════════
function APUDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, show } = useToast();
  const [programmes, setProgrammes] = useState([]);
  const [unread,     setUnread]     = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [actionLoad, setActionLoad] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, nRes] = await Promise.all([
        programmesAPI.list({ status:"IN_REVIEW" }),
        notificationsAPI.list(),
      ]);
      setProgrammes(rRes.data||[]);
      setUnread((nRes.data||[]).filter(n=>!n.is_read).length);
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(()=>{ load(); },[load]);

  const handleForward = async (id) => {
    setActionLoad(p=>({...p,[id]:"forward"}));
    try {
      await programmesAPI.forward(id);
      show("Programme forwarded to NUC.");
      load();
    } catch(e){ show(e.response?.data?.error||"Failed to forward.","error"); }
    finally { setActionLoad(p=>({...p,[id]:null})); }
  };

  const total = programmes.length;

  return (
    <div style={PAGE}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}} @keyframes blink{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      <div style={{ marginBottom:28, display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:10, color:"#94A3B8", fontFamily:"monospace", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Academic Planning Unit</div>
          <h1 style={{ ...H1, display:"flex", alignItems:"center", gap:12 }}>
            Review Dashboard
            {total>0 && (
              <span style={{ background:"#DC2626", color:"#fff", fontFamily:"monospace",
                fontSize:13, fontWeight:700, padding:"2px 12px", borderRadius:9999,
                animation:"blink 2s infinite" }}>
                {total} waiting
              </span>
            )}
          </h1>
          <p style={SUB}>
            Welcome back, {user?.first_name||"APU Officer"}.
            {total>0 ? ` You have ${total} programme${total>1?"s":""} awaiting review.` : " Your review queue is currently empty."}
          </p>
        </div>
        <button onClick={load} style={BS}>🔄 Refresh</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
        <KPI label="In Review Queue"   value={total}  sub="Awaiting your review"     color="#2563EB" icon="⊟" loading={loading} accent="#2563EB"/>
        <KPI label="Unread Alerts"     value={unread} sub="Notifications"             color="#DC2626" icon="🔔" loading={loading} accent="#DC2626" onClick={()=>navigate("/notifications")}/>
        <KPI label="Verify Documents"  value="→"     sub="Review uploaded evidence"   color="#059669" icon="✅" loading={false}   accent="#059669" onClick={()=>navigate("/documents")}/>
        <KPI label="NUC Standards"     value="→"     sub="View ratio requirements"    color="#7C3AED" icon="📋" loading={false}   accent="#7C3AED" onClick={()=>navigate("/nuc-standards")}/>
      </div>

      {!loading && total>0 && (
        <div style={{ background:"linear-gradient(135deg,#EFF6FF,#DBEAFE)", border:"1px solid #BFDBFE",
          borderRadius:10, padding:"16px 20px", marginBottom:24,
          display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:"50%", background:"#2563EB",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>🏛</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, color:"#1D4ED8", fontSize:14 }}>{total} programme{total>1?"s":""} in your review queue</div>
            <div style={{ fontSize:12, color:"#3B82F6", marginTop:2 }}>Review documents, verify them, then forward compliant programmes to NUC for final decision.</div>
          </div>
          <button onClick={()=>navigate("/documents")} style={{ ...BS, fontSize:11, flexShrink:0 }}>Verify Documents →</button>
        </div>
      )}

      {loading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:16 }}>
          {[1,2,3].map(i=><div key={i} style={{ height:200, background:"#fff", borderRadius:10, border:"1px solid #E2E8F0", animation:"pulse 1.5s infinite" }}/>)}
        </div>
      ) : programmes.length===0 ? (
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #E2E8F0", padding:"64px 20px", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12, opacity:0.15 }}>✅</div>
          <div style={{ fontFamily:"monospace", color:"#94A3B8", fontSize:13 }}>Review queue is empty. No programmes awaiting APU review.</div>
        </div>
      ) : (
        <>
          <div style={LABEL}>Review Queue — IN_REVIEW ({total})</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:16 }}>
            {programmes.map(p=>(
              <div key={p.id} style={{ background:"#fff", border:"1px solid #BFDBFE", borderLeft:"4px solid #2563EB",
                borderRadius:10, overflow:"hidden", boxShadow:"0 1px 4px rgba(7,22,47,0.06)", transition:"box-shadow 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(7,22,47,0.1)"}
                onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(7,22,47,0.06)"}>
                <div style={{ padding:"16px 18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:9, color:"#94A3B8", fontFamily:"monospace", textTransform:"uppercase", marginBottom:2 }}>{p.faculty} · {p.department}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#07162F", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                    </div>
                    <Badge status={p.status}/>
                  </div>
                  <div style={{ fontSize:12, color:"#64748B", marginBottom:10 }}>👨‍🎓 {(p.student_count||0).toLocaleString()} students · 👨‍🏫 {p.staff_count||0} staff</div>
                  {p.student_count>0 && p.staff_count>0 && (
                    <div style={{ padding:"7px 11px", background:"#F8FAFC", borderRadius:6,
                      fontSize:11, fontFamily:"monospace", marginBottom:12 }}>
                      Current ratio: <strong>1 : {(p.student_count/p.staff_count).toFixed(1)}</strong>
                    </div>
                  )}
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <button onClick={()=>navigate(`/courses/${p.id}`)} style={BS}>Review →</button>
                    <button onClick={()=>navigate(`/documents?programme=${p.id}`)}
                      style={{ ...BS, color:"#059669", borderColor:"#6EE7B7", background:"#F0FDF4" }}>
                      ✅ Verify Docs
                    </button>
                    <button onClick={()=>handleForward(p.id)} disabled={actionLoad[p.id]==="forward"}
                      style={{ ...BPURP, opacity:actionLoad[p.id]?0.7:1 }}>
                      {actionLoad[p.id]==="forward"?"Forwarding…":"🚀 Forward to NUC"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop:28, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14 }}>
        <QuickLink icon="✅" label="Verify Documents"  sub="Review and verify uploaded evidence"  action={()=>navigate("/documents")}/>
        <QuickLink icon="⊞"  label="Ratio Calculator"  sub="Check NUC staff:student compliance"  action={()=>navigate("/calculator")}/>
        <QuickLink icon="📋" label="NUC Standards"      sub="View all minimum ratio requirements" action={()=>navigate("/nuc-standards")}/>
        <QuickLink icon="🔔" label="Notifications"      sub={`${unread} unread alert${unread!==1?"s":""}`} action={()=>navigate("/notifications")}/>
      </div>
      <ToastMsg toast={toast}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NUC VISITOR DASHBOARD — FORWARDED_TO_NUC, Accredit + Deny decisions
// ═══════════════════════════════════════════════════════════════════════════════
function NUCDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, show } = useToast();
  const [programmes, setProgrammes] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [actionLoad, setActionLoad] = useState({});
  const [denyTarget, setDenyTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await programmesAPI.list({ status:"FORWARDED_TO_NUC" });
      setProgrammes(res.data||[]);
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(()=>{ load(); },[load]);

  const handleDecision = async (id, decision, comments="") => {
    setActionLoad(p=>({...p,[id]:decision}));
    try {
      await programmesAPI.decision(id, { decision, comments });
      show(`Programme ${decision==="ACCREDITED"?"accredited":"denied"}.`);
      setDenyTarget(null);
      load();
    } catch(e){ show(e.response?.data?.error||"Decision failed.","error"); }
    finally { setActionLoad(p=>({...p,[id]:null})); }
  };

  const total = programmes.length;

  return (
    <div style={PAGE}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}`}</style>

      <div style={{ marginBottom:28, display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:10, color:"#94A3B8", fontFamily:"monospace", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>NUC Visiting Team</div>
          <h1 style={H1}>Accreditation Decision Panel</h1>
          <p style={SUB}>Welcome, {user?.first_name||"NUC Officer"}. {total>0 ? `${total} programme${total>1?"s":""} await your final decision.` : "No programmes awaiting decision."}</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={load} style={BS}>🔄 Refresh</button>
          <button onClick={()=>navigate("/nuc-standards")} style={BS}>📋 NUC Standards</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:28 }}>
        <KPI label="Awaiting Decision"  value={total} sub="Forwarded to NUC"       color="#7C3AED" icon="🏛" loading={loading} accent="#7C3AED"/>
        <KPI label="Ratio Calculator"   value="→"    sub="Check compliance"         color="#2563EB" icon="⊞" loading={false}   accent="#2563EB" onClick={()=>navigate("/calculator")}/>
        <KPI label="NUC Standards"      value="→"    sub="View ratio requirements"  color="#059669" icon="📋" loading={false}   accent="#059669" onClick={()=>navigate("/nuc-standards")}/>
      </div>

      <div style={{ background:"linear-gradient(135deg,#EDE9FE,#DDD6FE)", border:"1px solid #C4B5FD",
        borderRadius:10, padding:"14px 20px", marginBottom:24,
        display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:20 }}>🔍</span>
        <div>
          <div style={{ fontWeight:700, color:"#5B21B6", fontSize:13 }}>NUC Visitor — Final Decision Authority</div>
          <div style={{ fontSize:12, color:"#7C3AED", marginTop:2 }}>You have read-only access to all programme documents. Use the Accredit or Deny buttons below to submit your final decision.</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:16 }}>
          {[1,2,3].map(i=><div key={i} style={{ height:220, background:"#fff", borderRadius:10, border:"1px solid #E2E8F0", animation:"pulse 1.5s infinite" }}/>)}
        </div>
      ) : programmes.length===0 ? (
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #E2E8F0", padding:"64px 20px", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12, opacity:0.15 }}>🏛</div>
          <div style={{ fontFamily:"monospace", color:"#94A3B8", fontSize:13 }}>No programmes have been forwarded to NUC yet.</div>
        </div>
      ) : (
        <>
          <div style={LABEL}>Awaiting Final NUC Decision ({total})</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:16 }}>
            {programmes.map(p=>(
              <div key={p.id} style={{ background:"#fff", border:"1px solid #C4B5FD",
                borderLeft:"4px solid #7C3AED", borderRadius:10, overflow:"hidden",
                boxShadow:"0 1px 4px rgba(7,22,47,0.06)", transition:"box-shadow 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(7,22,47,0.1)"}
                onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(7,22,47,0.06)"}>
                <div style={{ background:"linear-gradient(135deg,#07162F,#0C2D5E)", padding:"14px 18px" }}>
                  <div style={{ fontSize:9, color:"#94A3B8", fontFamily:"monospace", textTransform:"uppercase", marginBottom:3 }}>{p.faculty} · {p.department}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                  <div style={{ marginTop:8 }}><Badge status={p.status}/></div>
                </div>
                <div style={{ padding:"16px 18px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                    {[
                      { l:"Students",  v:(p.student_count||0).toLocaleString() },
                      { l:"Staff",     v:p.staff_count||0 },
                      { l:"Faculty",   v:p.faculty||"—" },
                      { l:"Ratio",     v:p.student_count&&p.staff_count?`1 : ${(p.student_count/p.staff_count).toFixed(1)}`:"—" },
                    ].map((s,i)=>(
                      <div key={i} style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:6, padding:"8px 11px" }}>
                        <div style={{ fontSize:8, color:"#94A3B8", fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:3 }}>{s.l}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#07162F", fontFamily:"monospace" }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <button onClick={()=>navigate(`/courses/${p.id}`)} style={BS}>View Documents →</button>
                    <button onClick={()=>handleDecision(p.id,"ACCREDITED")} disabled={actionLoad[p.id]==="ACCREDITED"}
                      style={{ ...BGREEN, flex:1, opacity:actionLoad[p.id]?0.7:1 }}>
                      {actionLoad[p.id]==="ACCREDITED"?"Processing…":"✓ Accredit"}
                    </button>
                    <button onClick={()=>setDenyTarget(p)} disabled={!!actionLoad[p.id]}
                      style={{ ...BRED, flex:1, opacity:actionLoad[p.id]?0.5:1 }}>
                      ✕ Deny
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop:28, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14 }}>
        <QuickLink icon="⊞"  label="Ratio Calculator" sub="Verify staff:student ratios"    action={()=>navigate("/calculator")}/>
        <QuickLink icon="📋" label="NUC Standards"     sub="View all ratio requirements"    action={()=>navigate("/nuc-standards")}/>
        <QuickLink icon="👥" label="Team Portal"       sub="View accreditation team"        action={()=>navigate("/team")}/>
      </div>

      <DenyModal
        programme={denyTarget}
        onClose={()=>setDenyTarget(null)}
        loading={denyTarget && actionLoad[denyTarget.id]==="DENIED"}
        onConfirm={(comment)=>handleDecision(denyTarget.id,"DENIED",comment)}
      />
      <ToastMsg toast={toast}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT EXPORT — routes to correct dashboard, never shows AccessDenied
// ═══════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { isHOD, isAPU, isNUC } = useRole();
  if (isHOD) return <HODDashboard />;
  if (isAPU) return <APUDashboard />;
  if (isNUC) return <NUCDashboard />;
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      minHeight:"60vh", fontFamily:"monospace", color:"#94A3B8", fontSize:13 }}>
      Loading dashboard…
    </div>
  );
}
