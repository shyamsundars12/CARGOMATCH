import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const token = localStorage.getItem("token"); // LSP token
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
