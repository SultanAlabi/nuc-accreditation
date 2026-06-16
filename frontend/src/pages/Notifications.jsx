// src/pages/Notifications.jsx
//
// Django endpoints:
//   GET    /api/notifications/?read=&notification_type=&page=
//   PATCH  /api/notifications/:id/   { read: true }
//   POST   /api/notifications/mark-all-read/
//   DELETE /api/notifications/:id/

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { notificationsAPI } from "../services/api";

// ── Config ────────────────────────────────────────────────────────────────────
const TYPE = {
  resource_visit:     { label:"Resource Visit",      color:"#DC2626", bg:"#FEE2E2", border:"#FCA5A5", icon:"📋" },
  full_accreditation: { label:"Full Accreditation",  color:"#D97706", bg:"#FEF3C7", border:"#FCD34D", icon:"🏛"  },
  reaccreditation:    { label:"Re-accreditation",    color:"#7C3AED", bg:"#EDE9FE", border:"#C4B5FD", icon:"🔄" },
  document_verified:  { label:"Document Verified",   color:"#059669", bg:"#D1FAE5", border:"#6EE7B7", icon:"✅" },
  programme_approved: { label:"Programme Approved",  color:"#2563EB", bg:"#DBEAFE", border:"#BFDBFE", icon:"✓"  },
  ratio_warning:      { label:"Ratio Warning",       color:"#DC2626", bg:"#FEE2E2", border:"#FCA5A5", icon:"⚠"  },
  system:             { label:"System",              color:"#64748B", bg:"#F1F5F9", border:"#CBD5E1", icon:"ℹ"  },
  // Backend notification types mapped to frontend display types
  STATUS_CHANGE:      { label:"Status Change",       color:"#2563EB", bg:"#DBEAFE", border:"#BFDBFE", icon:"🔄" },
  MILESTONE_DUE:      { label:"Milestone Due",       color:"#D97706", bg:"#FEF3C7", border:"#FCD34D", icon:"📅" },
  DOCUMENT_VERIFIED:  { label:"Document Verified",   color:"#059669", bg:"#D1FAE5", border:"#6EE7B7", icon:"✅" },
};

// Map backend notification type → frontend TYPE key
const BACKEND_TYPE_MAP = {
  STATUS_CHANGE:      "STATUS_CHANGE",
  MILESTONE_DUE:      "MILESTONE_DUE",
  DOCUMENT_VERIFIED:  "DOCUMENT_VERIFIED",
};

// 2 demo entries only — rest comes from real backend
const DEMO = [
  {
    id:"DEMO-1", notification_type:"resource_visit", read:false,
    created_at: new Date(Date.now() - 2*3600000).toISOString(),
    title:"Resource Visit Due in 47 Days — CPE",
    body:"B.Eng. Computer Engineering is approaching its 3-year Resource Visit window. Ensure all documents in the Evidence Locker are uploaded and verified before the NUC team arrives.",
    programme_id:"C001", programme_name:"B.Eng. Computer Engineering", programme_code:"CPE",
  },
  {
    id:"DEMO-2", notification_type:"ratio_warning", read:false,
    created_at: new Date(Date.now() - 5*3600000).toISOString(),
    title:"Student:Lecturer Ratio Exceeded — BCH",
    body:"B.Sc. Biochemistry currently has a ratio of 34:1, exceeding the NUC maximum of 30:1. Hire at least 2 additional lecturers before your next accreditation visit.",
    programme_id:"C002", programme_name:"B.Sc. Biochemistry", programme_code:"BCH",
  },
];

function timeAgo(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return "Just now";
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 604800)return `${Math.floor(s/86400)}d ago`;
  return new Date(d).toLocaleDateString("en-NG",{day:"2-digit",month:"short",year:"numeric"});
}

// Backend uses `is_read`; demo data and some legacy fields use `read`.
// Normalize so the rest of the UI only checks one source of truth.
const isUnread = (n) => !(n.is_read ?? n.read);

// ── Toast ─────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type="success") => {
    const id = Date.now();
    setToasts(p => [...p,{id,msg,type}]);
    setTimeout(() => setToasts(p => p.filter(t=>t.id!==id)), 3500);
  },[]);
  return { toasts, push };
}

function ToastStack({ toasts }) {
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,
      display:"flex",flexDirection:"column",gap:8}}>
      {toasts.map(t=>(
        <div key={t.id} style={{
          background: t.type==="error"?"#DC2626":"#07162F",
          color:"#fff",padding:"11px 16px",borderRadius:8,
          boxShadow:"0 8px 24px rgba(7,22,47,0.25)",
          fontSize:13,fontWeight:600,minWidth:260,maxWidth:340,
          borderLeft:`3px solid ${t.type==="error"?"#FCA5A5":"#22D3EE"}`,
          animation:"fadeIn 0.2s ease",
        }}>
          {t.type==="error"?"⚠ ":"✓ "}{t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Single notification row ───────────────────────────────────────────────────
function NotifRow({ n, selected, onSelect, onRead, onDismiss, isDemo }) {
  const typeKey = BACKEND_TYPE_MAP[n.type] || n.notification_type || "system";
  const cfg = TYPE[typeKey] || TYPE.system;
  const unread = isUnread(n);

  return (
    <div style={{
      display:"flex", borderBottom:"1px solid #F1F5F9",
      background: selected ? "#EFF6FF" : unread ? "#FAFBFF" : "#fff",
      transition:"background 0.1s", position:"relative",
    }}>
      {/* Unread stripe */}
      <div style={{ width:3, flexShrink:0,
        background: unread ? cfg.color : "transparent",
        borderRadius:"2px 0 0 2px" }} />

      {/* Checkbox */}
      <div style={{padding:"16px 12px 16px 14px",
        display:"flex",alignItems:"flex-start"}}>
        <input type="checkbox" checked={selected}
          onChange={()=>onSelect(n.id)}
          style={{width:15,height:15,cursor:"pointer",
            accentColor:"#07162F",marginTop:2}}/>
      </div>

      {/* Icon */}
      <div style={{paddingTop:16,paddingRight:12,flexShrink:0}}>
        <div style={{width:36,height:36,borderRadius:"50%",
          background:cfg.bg,border:`1px solid ${cfg.border}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:16}}>
          {cfg.icon}
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,padding:"14px 0 14px",minWidth:0}}>
        {/* Type badge + time */}
        <div style={{display:"flex",justifyContent:"space-between",
          alignItems:"flex-start",gap:10,marginBottom:4}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{
              fontSize:10,fontFamily:"'IBM Plex Mono',monospace",
              fontWeight:700,padding:"2px 7px",borderRadius:3,
              background:cfg.bg,color:cfg.color,
              border:`1px solid ${cfg.border}`,whiteSpace:"nowrap",
            }}>{cfg.label}</span>
            {isDemo && (
              <span style={{fontSize:9,fontFamily:"'IBM Plex Mono',monospace",
                background:"#FEF3C7",color:"#92400E",
                border:"1px solid #FCD34D",
                padding:"1px 5px",borderRadius:3,fontWeight:700}}>
                DEMO
              </span>
            )}
            {unread && <span style={{width:7,height:7,borderRadius:"50%",
              background:cfg.color,display:"inline-block"}}/>}
          </div>
          <span style={{fontSize:10,color:"#94A3B8",whiteSpace:"nowrap",
            fontFamily:"'IBM Plex Mono',monospace",flexShrink:0}}>
            {timeAgo(n.created_at)}
          </span>
        </div>

        {/* Title */}
        <div style={{fontSize:13,fontWeight:unread?700:500,
          color:"#07162F",marginBottom:5,lineHeight:1.35}}>
          {n.title}
        </div>

        {/* Body */}
        <div style={{fontSize:12,color:"#64748B",
          lineHeight:1.6,marginBottom:10}}>
          {n.body}
        </div>

        {/* Actions */}
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          {n.programme_id && (
            <Link to={`/courses/${n.programme_id}`}
              style={{fontSize:11,fontWeight:700,color:"#2563EB",
                textDecoration:"none",fontFamily:"'IBM Plex Mono',monospace"}}>
              {n.programme_code} → View Programme
            </Link>
          )}
          {unread && (
            <button onClick={()=>onRead(n.id)} style={ghost}>
              ✓ Mark read
            </button>
          )}
          <button onClick={()=>onDismiss(n.id)}
            style={{...ghost,color:"#DC2626"}}>
            🗑 Dismiss
          </button>
        </div>
      </div>
      <div style={{width:16}}/>
    </div>
  );
}

const ghost = {
  background:"none",border:"none",cursor:"pointer",
  fontSize:11,color:"#64748B",
  fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,padding:"2px 0",
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Notifications() {
  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [totalCount,   setTotalCount]   = useState(0);
  const [typeFilter,   setTypeFilter]   = useState("");
  const [readFilter,   setReadFilter]   = useState("");
  const [selected,     setSelected]     = useState(new Set());
  const [bulkLoading,  setBulkLoading]  = useState(false);
  const [page,         setPage]         = useState(1);
  const [usingFallback,setUsingFallback]= useState(false);
  const PAGE_SIZE = 15;
  const { toasts, push: toast } = useToast();

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page, page_size: PAGE_SIZE,
        ordering: "-created_at",
        ...(typeFilter && { type: typeFilter }),
        ...(readFilter !== "" && { read: readFilter }),
      };
      const res = await notificationsAPI.list(params);
      const data = res.data;
      if (data.results !== undefined) {
        // Normalize backend fields to frontend expectations
        const normalized = data.results.map(n => ({
          ...n,
          notification_type: n.type || n.notification_type,
          title: n.title || n.message || "",
          body: n.body || n.message || "",
          read: n.is_read ?? n.read,
        }));
        setItems(normalized);
        setTotalCount(data.count);
      } else if (Array.isArray(data)) {
        const normalized = data.map(n => ({
          ...n,
          notification_type: n.type || n.notification_type,
          title: n.title || n.message || "",
          body: n.body || n.message || "",
          read: n.is_read ?? n.read,
        }));
        setItems(normalized);
        setTotalCount(normalized.length);
      } else {
        setItems([]);
        setTotalCount(0);
      }
      setUsingFallback(false);
    } catch {
      // Show 2 demo items while backend is connecting
      let filtered = DEMO;
      if (readFilter === "false") filtered = filtered.filter(n=>isUnread(n));
      if (readFilter === "true")  filtered = filtered.filter(n=>!isUnread(n));
      if (typeFilter) filtered = filtered.filter(n=>n.notification_type===typeFilter);
      setItems(filtered);
      setTotalCount(filtered.length);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, readFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [typeFilter, readFilter]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleRead = async (id) => {
    try { await notificationsAPI.markRead(id); } catch {}
    setItems(p => p.map(n => n.id===id ? {...n, is_read:true, read:true} : n));
    toast("Marked as read.");
  };

  const handleDismiss = async (id) => {
    try { await notificationsAPI.dismiss(id); } catch {}
    setItems(p => p.filter(n => n.id!==id));
    setTotalCount(p => Math.max(0, p-1));
    setSelected(p => { const s=new Set(p); s.delete(id); return s; });
    toast("Notification dismissed.");
  };

  const handleMarkAllRead = async () => {
    setBulkLoading(true);
    try { await notificationsAPI.markAllRead(); } catch {}
    setItems(p => p.map(n => ({...n, is_read:true, read:true})));
    toast("All notifications marked as read.");
    setBulkLoading(false);
  };

  const handleBulkRead = async () => {
    setBulkLoading(true);
    const ids = [...selected];
    await Promise.allSettled(ids.map(id => notificationsAPI.markRead(id)));
    setItems(p => p.map(n => ids.includes(n.id) ? {...n, is_read:true, read:true} : n));
    setSelected(new Set());
    toast(`${ids.length} notification${ids.length>1?"s":""} marked as read.`);
    setBulkLoading(false);
  };

  const handleBulkDismiss = async () => {
    setBulkLoading(true);
    const ids = [...selected];
    await Promise.allSettled(ids.map(id => notificationsAPI.dismiss(id)));
    setItems(p => p.filter(n => !ids.includes(n.id)));
    setTotalCount(p => Math.max(0, p-ids.length));
    setSelected(new Set());
    toast(`${ids.length} notification${ids.length>1?"s":""} dismissed.`);
    setBulkLoading(false);
  };

  const toggleSelect  = (id) => setSelected(p => { const s=new Set(p); s.has(id)?s.delete(id):s.add(id); return s; });
  const toggleAll     = () => setSelected(selected.size===items.length ? new Set() : new Set(items.map(n=>n.id)));

  const unreadCount = items.filter(n => isUnread(n)).length;
  const totalPages  = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div style={{fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",
      background:"#F0F4F8",minHeight:"100vh",padding:"32px 36px"}}>

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none} }
        @keyframes pulse  { 0%,100%{opacity:1}50%{opacity:0.4} }
      `}</style>

      {/* Header */}
      <div style={{marginBottom:24,display:"flex",
        justifyContent:"space-between",alignItems:"flex-end",
        flexWrap:"wrap",gap:14}}>
        <div>
          <div style={{fontSize:10,color:"#94A3B8",
            fontFamily:"'IBM Plex Mono',monospace",
            letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>
            Milestone Alerts
          </div>
          <h1 style={{fontSize:24,fontWeight:700,color:"#07162F",
            margin:"0 0 4px",display:"flex",alignItems:"center",gap:10}}>
            Notifications
            {unreadCount > 0 && (
              <span style={{background:"#DC2626",color:"#fff",
                fontFamily:"'IBM Plex Mono',monospace",
                fontSize:12,fontWeight:700,
                padding:"2px 9px",borderRadius:9999}}>
                {unreadCount}
              </span>
            )}
          </h1>
          <p style={{fontSize:13,color:"#64748B",margin:0}}>
            {totalCount} notification{totalCount!==1?"s":""}
            {unreadCount>0 ? ` · ${unreadCount} unread` : " · all read"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} disabled={bulkLoading}
            style={{...btnSec,display:"flex",alignItems:"center",gap:6,
              opacity:bulkLoading?0.6:1}}>
            ✓ Mark all as read
          </button>
        )}
      </div>

      {/* Demo banner */}
      {usingFallback && (
        <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",
          borderRadius:8,padding:"10px 16px",marginBottom:20,
          fontSize:12,color:"#1D4ED8",display:"flex",gap:8,alignItems:"center"}}>
          ℹ <strong>Showing 2 demo notifications.</strong> Connect Django backend at{" "}
          <code style={{fontFamily:"'IBM Plex Mono',monospace",
            background:"#DBEAFE",padding:"1px 5px",borderRadius:3}}>
            /api/notifications/
          </code>{" "}to load real data.
        </div>
      )}

      {/* KPI strip */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",
        gap:14,marginBottom:22}}>
        {[
          {label:"Total",     value:totalCount,  color:"#07162F"},
          {label:"Unread",    value:unreadCount, color:"#DC2626"},
          {label:"Urgent",    value:items.filter(n=>["resource_visit","ratio_warning"].includes(n.notification_type)).length, color:"#D97706"},
          {label:"This Session", value:items.length, color:"#2563EB"},
        ].map((k,i)=>(
          <div key={i} style={{background:"#fff",border:"1px solid #E2E8F0",
            borderRadius:10,padding:"16px 18px",
            boxShadow:"0 1px 4px rgba(7,22,47,0.06)"}}>
            <div style={{fontSize:9,color:"#94A3B8",
              fontFamily:"'IBM Plex Mono',monospace",
              letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>
              {k.label}
            </div>
            <div style={{fontSize:26,fontWeight:700,color:k.color,
              fontFamily:"'IBM Plex Mono',monospace",lineHeight:1}}>
              {loading ? "—" : k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{background:"#fff",border:"1px solid #E2E8F0",
        borderRadius:10,padding:"12px 16px",marginBottom:16,
        display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",
        boxShadow:"0 1px 4px rgba(7,22,47,0.06)"}}>

        {/* Read toggle */}
        <div style={{display:"flex",border:"1px solid #E2E8F0",
          borderRadius:6,overflow:"hidden",flexShrink:0}}>
          {[["","All"],["false","Unread"],["true","Read"]].map(([v,label])=>(
            <button key={v} onClick={()=>setReadFilter(v)} style={{
              padding:"7px 14px",border:"none",cursor:"pointer",
              fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:700,
              background:readFilter===v?"#07162F":"#fff",
              color:readFilter===v?"#fff":"#6B7280",transition:"all 0.12s",
            }}>{label}</button>
          ))}
        </div>

        {/* Type filter */}
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
          style={{...selectStyle,minWidth:180,
            color:typeFilter?"#07162F":"#94A3B8"}}>
          <option value="">All Types</option>
          {Object.entries(TYPE).map(([k,v])=>(
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div style={{display:"flex",gap:8,alignItems:"center",
            padding:"6px 12px",background:"#EFF6FF",
            border:"1px solid #BFDBFE",borderRadius:7}}>
            <span style={{fontSize:11,fontFamily:"'IBM Plex Mono',monospace",
              fontWeight:700,color:"#1D4ED8"}}>
              {selected.size} selected
            </span>
            <button onClick={handleBulkRead} disabled={bulkLoading}
              style={{padding:"4px 10px",borderRadius:4,cursor:"pointer",
                fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:700,
                background:"#D1FAE5",color:"#065F46",border:"1px solid #6EE7B7"}}>
              ✓ Mark read
            </button>
            <button onClick={handleBulkDismiss} disabled={bulkLoading}
              style={{padding:"4px 10px",borderRadius:4,cursor:"pointer",
                fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:700,
                background:"#FEE2E2",color:"#DC2626",border:"1px solid #FCA5A5"}}>
              🗑 Dismiss
            </button>
          </div>
        )}

        {(typeFilter || readFilter) && (
          <button onClick={()=>{setTypeFilter("");setReadFilter("");}}
            style={{...btnSec,fontSize:11,padding:"6px 12px",
              color:"#DC2626",borderColor:"#FCA5A5"}}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* List */}
      <div style={{background:"#fff",borderRadius:10,
        border:"1px solid #E2E8F0",
        boxShadow:"0 1px 4px rgba(7,22,47,0.06)",overflow:"hidden"}}>

        {/* List header */}
        <div style={{padding:"10px 14px 10px 16px",
          borderBottom:"2px solid #E2E8F0",
          display:"flex",alignItems:"center",gap:12,
          background:"#F8FAFC"}}>
          <input type="checkbox"
            checked={selected.size===items.length && items.length>0}
            onChange={toggleAll}
            style={{width:15,height:15,cursor:"pointer",accentColor:"#07162F"}}/>
          <span style={{fontSize:10,fontFamily:"'IBM Plex Mono',monospace",
            fontWeight:700,color:"#94A3B8",
            letterSpacing:"0.1em",textTransform:"uppercase"}}>
            {loading ? "Loading…"
              : `${items.length} notification${items.length!==1?"s":""}`}
          </span>
        </div>

        {loading ? (
          [...Array(4)].map((_,i)=>(
            <div key={i} style={{display:"flex",gap:14,
              padding:"16px 20px",borderBottom:"1px solid #F1F5F9"}}>
              <div style={{width:36,height:36,borderRadius:"50%",
                background:"#F1F5F9",animation:"pulse 1.5s infinite",flexShrink:0}}/>
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
                {[40,80,60].map((w,j)=>(
                  <div key={j} style={{height:10,width:`${w}%`,borderRadius:4,
                    background:"#F1F5F9",animation:"pulse 1.5s infinite"}}/>
                ))}
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div style={{padding:"60px 20px",textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:12,opacity:0.2}}>🔔</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",
              color:"#94A3B8",fontSize:13,marginBottom:8}}>
              {readFilter==="false"
                ? "You're all caught up — no unread notifications."
                : "No notifications found."}
            </div>
            {(typeFilter||readFilter) && (
              <button onClick={()=>{setTypeFilter("");setReadFilter("");}}
                style={{...btnSec,fontSize:12,marginTop:4}}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          items.map(n => (
            <NotifRow key={n.id} n={n}
              selected={selected.has(n.id)}
              onSelect={toggleSelect}
              onRead={handleRead}
              onDismiss={handleDismiss}
              isDemo={n.id.startsWith("DEMO-")}
            />
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{padding:"13px 16px",borderTop:"1px solid #E2E8F0",
            display:"flex",justifyContent:"space-between",
            alignItems:"center",flexWrap:"wrap",gap:10}}>
            <div style={{fontSize:11,color:"#64748B",
              fontFamily:"'IBM Plex Mono',monospace"}}>
              Page {page} of {totalPages}
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))}
                disabled={page===1}
                style={{...btnSec,padding:"6px 12px",fontSize:11,
                  opacity:page===1?0.4:1}}>← Prev</button>
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))}
                disabled={page===totalPages}
                style={{...btnSec,padding:"6px 12px",fontSize:11,
                  opacity:page===totalPages?0.4:1}}>Next →</button>
            </div>
          </div>
        )}
      </div>

      <ToastStack toasts={toasts}/>
    </div>
  );
}

const btnSec = {
  padding:"8px 14px",borderRadius:7,cursor:"pointer",
  fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:12,
  background:"#fff",color:"#374151",border:"1.5px solid #CBD5E1",
};
const selectStyle = {
  padding:"8px 12px",border:"1.5px solid #CBD5E1",borderRadius:7,
  fontFamily:"'IBM Plex Sans',sans-serif",fontSize:12,
  background:"#fff",outline:"none",cursor:"pointer",
};