import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminContainers() {
  const [containers, setContainers] = useState<any[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchContainers = () => {
    fetch("/api/admin/containers", {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    })
      .then((res) => res.json())
      .then(setContainers)
      .catch(() => setError("Failed to fetch containers"));
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    if (!window.confirm(`Change status to ${status}?`)) return;
    try {
      const res = await fetch(`/api/admin/containers/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`, // Fixed token key here
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      fetchContainers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Navigate to detail on row click
  const onRowClick = (id: number) => {
    navigate(`/admin/containers/${id}`);
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>All Containers</h1>
      {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
      <table
        style={{
          width: "100%",
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Number</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Size</th>
            <th style={thStyle}>Capacity</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {containers.map((c) => (
            <tr
              key={c.id}
              onClick={() => onRowClick(c.id)} // Row click navigates
              style={{ cursor: "pointer" }}
            >
              <td style={tdStyle}>{c.container_number}</td>
              <td style={tdStyle}>{c.type}</td>
              <td style={tdStyle}>{c.size}</td>
              <td style={tdStyle}>{c.capacity}</td>
              <td style={tdStyle}>{c.status}</td>
              <td
                style={tdStyle}
                onClick={e => e.stopPropagation()} // Prevent row click when clicking buttons
              >
                {/* Remove "View" button as entire row is clickable now */}
                {c.status !== "APPROVED" && (
                  <button
                    style={{ ...linkBtn, color: "green" }}
                    onClick={() => handleStatusChange(c.id, "APPROVED")}
                  >
                    Approve
                  </button>
                )}
                {c.status !== "REJECTED" && (
                  <button
                    style={{ ...linkBtn, color: "red" }}
                    onClick={() => handleStatusChange(c.id, "REJECTED")}
                  >
                    Reject
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: 10,
  textAlign: "left",
  background: "#f4f6f8",
  fontWeight: 600,
};
const tdStyle: React.CSSProperties = {
  padding: 10,
  borderTop: "1px solid #eee",
};
const linkBtn: React.CSSProperties = {
  color: "#2563eb",
  background: "none",
  border: "none",
  cursor: "pointer",
  marginRight: 8,
};
