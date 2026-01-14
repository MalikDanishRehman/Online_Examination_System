import { Navigate } from "react-router-dom";
import { isLoggedIn, getRole } from "./auth";
import { dbg } from './debugger';

export const Protected = ({ children, roles }) => {
  if (!isLoggedIn()) {
    dbg.log("ProtectedRoute: not logged in");
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(getRole())) {
    dbg.log("ProtectedRoute: role mismatch", getRole());
    return <Navigate to="/login" />;
  }

  return children;
};

export const PublicOnly = ({ children }) => {
  if (isLoggedIn()) {
    dbg.log("PublicOnly: already logged in");
    return <Navigate to={`/${getRole()}`} />;
  }
  return children;
};
