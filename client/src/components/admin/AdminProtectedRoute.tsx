import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";

export default function AdminProtectedRoute({ children }: { children: ReactElement }) {
  const token = localStorage.getItem("adminToken"); // Admin token
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
