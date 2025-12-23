import AdminSidebar from "./AdminSidebar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6f8' }}>
        <AdminSidebar />
        <main style={{ flex: 1, padding: 32 }}>
          <Outlet />
        </main>
      </div>
  );
}