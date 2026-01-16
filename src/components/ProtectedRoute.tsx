import { Navigate } from "react-router-dom";
import { getUser } from "../utils/auth";
import { dbg } from "../utils/debugger";

export default function ProtectedRoute({ children, allowedRoles }) {
  const user = getUser();

  if (!user) {
    dbg.log("ProtectedRoute: No user, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    dbg.log("ProtectedRoute: Unauthorized role", user.role);
    return <Navigate to="/login" replace />;
  }

  return children;
}