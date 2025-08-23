// Users.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [filterRole, setFilterRole] = useState("ALL");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then(setUsers)
      .catch(() => setError("Failed to fetch users"));
  }, []);

  const filteredUsers =
    filterRole === "ALL" ? users : users.filter((u) => u.role === filterRole);

  // Helper to get verification status label and color (null | true | false)
  const getVerificationStatus = (user: any) => {
    if (user.is_approved === null) {
      return { label: "Pending Approval", color: "orange" };
    }
    if (user.is_approved === true) {
      return { label: "Approved", color: "green" };
    }
    if (user.is_approved === false) {
      return { label: "Rejected", color: "red" };
    }
    return { label: "Unknown", color: "gray" }; // fallback
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>All Users</h1>
      {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}

      <div style={{ marginBottom: 24 }}>
        <label htmlFor="roleFilter" style={{ marginRight: 8, fontWeight: 600 }}>
          Filter by Role:
        </label>
        <select
          id="roleFilter"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        >
          <option value="ALL">All</option>
          <option value="lsp">LSP</option>
          <option value="trader">Trader</option>
        </select>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Approval Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((u) => {
            const status = getVerificationStatus(u);
            return (
              <tr
                key={u.id}
                onClick={() => navigate(`/admin/users/${u.id}`)}
                style={{ cursor: "pointer", backgroundColor: "#f9f9f9" }}
              >
                <td style={tdStyle}>{u.id}</td>
                <td style={tdStyle}>{u.name}</td>
                <td style={tdStyle}>{u.email}</td>
                <td style={tdStyle}>{u.role}</td>
                <td style={{ ...tdStyle, color: status.color, fontWeight: 600 }}>
                  {status.label}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

const thStyle: React.CSSProperties = {
  padding: 10,
  background: "#f4f6f8",
  textAlign: "left",
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: 10,
  borderTop: "1px solid #eee",
};
