import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { name: "Dashboard", path: "/admin/dashboard" },
  { name: "Users", path: "/admin/users" },
  { name: "LSPs", path: "/admin/lsps" },
  { name: "Container Types", path: "/admin/container-types" },
  { name: "Containers", path: "/admin/containers" },
  { name: "Container Approval", path: "/admin/container-approval" },
  { name: "Bookings", path: "/admin/bookings" },
  { name: "Shipments", path: "/admin/shipments" },
  { name: "Complaints", path: "/admin/complaints" },
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside
      style={{
        width: 220,
        background: "#fff",
        height: "100vh",
        boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          padding: 24,
          fontWeight: 700,
          fontSize: 20,
          borderBottom: "1px solid #eee",
        }}
      >
        Admin Panel
      </div>
      <nav style={{ marginTop: 24 }}>
        {navItems.map((item) => (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              padding: "12px 32px",
              cursor: "pointer",
              background:
                location.pathname === item.path ? "#e0e7ff" : "transparent",
              fontWeight: location.pathname === item.path ? 600 : 400,
              color: location.pathname === item.path ? "#98a9cbff" : "#222",
            }}
          >
            {item.name}
          </div>
        ))}

        {/* Logout */}
        <div
          onClick={() => {
            localStorage.removeItem("adminToken");
            navigate("/admin/login");
          }}
          style={{
            padding: "12px 32px",
            cursor: "pointer",
            color: "#dc2626",
            marginTop: 32,
          }}
        >
          Logout
        </div>
      </nav>
    </aside>
  );
}
