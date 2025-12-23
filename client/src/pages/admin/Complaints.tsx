import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/admin/complaints", {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setComplaints(data);
        } else {
          setError("Invalid data format received");
        }
      })
      .catch((err) => {
        console.error("Error fetching complaints:", err);
        setError("Failed to fetch complaints");
      });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'red';
      case 'in_progress': return 'orange';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Complaint Management</h1>
      {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Title</th>
            <th style={thStyle}>Complainant</th>
            <th style={thStyle}>LSP Company</th>
            <th style={thStyle}>Container #</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Priority</th>
            <th style={thStyle}>Created At</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(complaints) && complaints.map((complaint) => (
            <tr key={complaint.id}>
              <td style={tdStyle}>{complaint.id}</td>
              <td style={tdStyle}>{complaint.title}</td>
              <td style={tdStyle}>{complaint.complainant_name}</td>
              <td style={tdStyle}>{complaint.lsp_company}</td>
              <td style={tdStyle}>{complaint.container_number}</td>
              <td style={{ ...tdStyle, color: getStatusColor(complaint.status), fontWeight: 600 }}>
                {complaint.status?.toUpperCase() || 'UNKNOWN'}
              </td>
              <td style={{ ...tdStyle, color: getPriorityColor(complaint.priority), fontWeight: 600 }}>
                {complaint.priority?.toUpperCase() || 'UNKNOWN'}
              </td>
              <td style={tdStyle}>
                {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : 'N/A'}
              </td>
              <td style={tdStyle}>
                <button
                  style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}
                  onClick={() => navigate(`/admin/complaints/${complaint.id}`)}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
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
