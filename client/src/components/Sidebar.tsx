import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Profile", path: "/profile" },
  { name: "Containers", path: "/containers" },
  { name: "Booking Approval", path: "/booking-approval" },
  { name: "Bookings", path: "/bookings" },
  { name: "Shipments", path: "/shipments" },
  { name: "Complaints", path: "/complaints" },
  { name: "Analytics", path: "/analytics" },
];

export default function Sidebar() {
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
        LSP Dashboard
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
        <div
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            navigate("/login");
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
