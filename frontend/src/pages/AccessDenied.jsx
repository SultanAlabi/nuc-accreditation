import { useNavigate } from "react-router-dom";
import { useRole } from "../hooks/useRole";

export default function AccessDenied() {
  const navigate = useNavigate();
  const { role, isNUCVisitor } = useRole();

  return (
    <div style={{
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      minHeight:"80vh", padding:"40px",
      fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",
    }}>
      <div style={{
        background:"#fff", border:"1px solid #E2E8F0",
        borderRadius:16, padding:"48px 40px",
        maxWidth:480, width:"100%", textAlign:"center",
        boxShadow:"0 4px 24px rgba(7,22,47,0.08)",
      }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#07162F",
          margin:"0 0 8px" }}>Access Restricted</h1>
        <p style={{ fontSize:13, color:"#64748B", lineHeight:1.7,
          margin:"0 0 24px" }}>
          Your role <strong style={{ fontFamily:"'IBM Plex Mono',monospace",
            background:"#EDE9FE", color:"#7C3AED",
            padding:"1px 6px", borderRadius:3 }}>
            {role}
          </strong> does not have permission to view this page.
          {isNUCVisitor && (
            <> As an NUC Visitor, you have read-only access to the Team Portal and assigned programme evidence lockers.</>
          )}
        </p>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={() => navigate(-1)} style={S.btnSec}>
            ← Go Back
          </button>
          <button
            onClick={() => navigate(isNUCVisitor ? "/team" : "/dashboard")}
            style={S.btnPri}>
            {isNUCVisitor ? "Go to Team Portal" : "Go to Dashboard"}
          </button>
        </div>
      </div>
    </div>
  );
}

const S = {
  btnPri: {
    padding:"10px 20px", borderRadius:7, cursor:"pointer",
    fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:12,
    background:"linear-gradient(135deg,#07162F,#0C2D5E)",
    color:"#fff", border:"none",
  },
  btnSec: {
    padding:"10px 18px", borderRadius:7, cursor:"pointer",
    fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:12,
    background:"#fff", color:"#374151", border:"1.5px solid #CBD5E1",
  },
};