// src/components/common/RoleGate.jsx
import { useAuth } from "../../context/AuthContext";

export default function RoleGate({ allow, deny, fallback = null, children }) {
  const { user } = useAuth();
  const role = user?.role;
  if (allow && !allow.includes(role)) return fallback;
  if (deny  &&  deny.includes(role))  return fallback;
  return children;
}