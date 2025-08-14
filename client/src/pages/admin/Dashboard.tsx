import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/dashboard", {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    })
      .then((res) => res.json())
      .then(setStats)
      .catch(() => setError("Failed to load dashboard stats"));
  }, []);

  if (error) return <div style={{ padding: 32, color: "red" }}>{error}</div>;
  if (!stats) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Admin Dashboard</h1>
      <div style={gridStyle}>
        <div style={cardStyle}>Users: {stats.users}</div>
        <div style={cardStyle}>LSPs: {stats.lsps}</div>
        <div style={cardStyle}>Traders: {stats.traders}</div>
        <div style={cardStyle}>Container Types: {stats.containerTypes}</div>
        <div style={cardStyle}>Containers: {stats.containers}</div>
        <div style={cardStyle}>Bookings: {stats.bookings}</div>
        
      </div>
    </div>
  );
}

const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 };
const cardStyle: React.CSSProperties = { background: "#fff", padding: 16, borderRadius: 8, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" };
