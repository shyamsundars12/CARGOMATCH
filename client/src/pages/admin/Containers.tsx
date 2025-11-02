import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminContainers() {
  const [containers, setContainers] = useState<any[]>([]);
  const [filteredContainers, setFilteredContainers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchContainers = () => {
    fetch("/api/admin/containers/approved", {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Ensure data is an array
        if (Array.isArray(data)) {
          setContainers(data);
          setFilteredContainers(data);
        } else {
          console.error('Expected array but got:', typeof data, data);
          setContainers([]);
          setFilteredContainers([]);
        }
      })
      .catch((err) => {
        console.error('Error fetching containers:', err);
        setError("Failed to fetch containers");
        setContainers([]);
      });
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContainers(containers);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = containers.filter((container) => {
      if (container.container_number?.toLowerCase().includes(query)) return true;
      if (container.type_name?.toLowerCase().includes(query)) return true;
      if (container.type?.toLowerCase().includes(query)) return true;
      if (container.container_size?.toLowerCase().includes(query)) return true;
      if (container.size?.toLowerCase().includes(query)) return true;
      if (container.origin_port?.toLowerCase().includes(query)) return true;
      if (container.destination_port?.toLowerCase().includes(query)) return true;
      if (container.status?.toLowerCase().includes(query)) return true;
      return false;
    });

    setFilteredContainers(filtered);
  }, [searchQuery, containers]);

  const handleStatusChange = async (id: number, status: string) => {
    if (!window.confirm(`Change status to ${status}?`)) return;
    try {
      const res = await fetch(`/api/admin/containers/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update status");
      }
      
      // Update the local state immediately for better UX
      setContainers(prevContainers => 
        prevContainers.map(container => 
          container.id === id 
            ? { ...container, status: status.toLowerCase() }
            : container
        )
      );
      
      // Also refresh from server to ensure consistency
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
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by container number, type, size, ports, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 4,
              border: '1px solid #ddd',
              fontSize: 14
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: '#eee',
                color: '#666',
                padding: '10px 16px',
                borderRadius: 4,
                border: '1px solid #ddd',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {searchQuery && (
        <div style={{ marginBottom: 16, fontSize: 14, color: '#666' }}>
          Showing {filteredContainers.length} of {containers.length} containers
        </div>
      )}

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
            <th style={thStyle}>Dimensions</th>
            <th style={thStyle}>Weight</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(filteredContainers) && filteredContainers.map((c) => (
            <tr
              key={c.id}
              onClick={() => onRowClick(c.id)} // Row click navigates
              style={{ cursor: "pointer" }}
            >
              <td style={tdStyle}>{c.container_number}</td>
              <td style={tdStyle}>{c.type_name || c.type || 'N/A'}</td>
              <td style={tdStyle}>{c.container_size || c.size || 'N/A'}</td>
              <td style={tdStyle}>{c.container_capacity || c.capacity || 'N/A'}</td>
              <td style={tdStyle}>
                {c.length && c.width && c.height 
                  ? `${c.length} × ${c.width} × ${c.height} m` 
                  : 'N/A'
                }
              </td>
              <td style={tdStyle}>{c.weight ? `${c.weight} kg` : 'N/A'}</td>
              <td style={tdStyle}>{c.status}</td>
              <td
                style={tdStyle}
                onClick={e => e.stopPropagation()} // Prevent row click when clicking buttons
              >
                {/* Show appropriate buttons based on current status */}
                {c.status !== "approved" && c.status !== "APPROVED" && (
                  <button
                    style={{ ...linkBtn, color: "green" }}
                    onClick={() => handleStatusChange(c.id, "APPROVED")}
                  >
                    Approve
                  </button>
                )}
                {c.status !== "rejected" && c.status !== "REJECTED" && (
                  <button
                    style={{ ...linkBtn, color: "red" }}
                    onClick={() => handleStatusChange(c.id, "REJECTED")}
                  >
                    Reject
                  </button>
                )}
                {(c.status === "approved" || c.status === "APPROVED") && (
                  <span style={{ ...linkBtn, color: "green", fontWeight: "bold" }}>
                    ✓ Approved
                  </span>
                )}
                {(c.status === "rejected" || c.status === "REJECTED") && (
                  <span style={{ ...linkBtn, color: "red", fontWeight: "bold" }}>
                    ✗ Rejected
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {filteredContainers.length === 0 && containers.length > 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666', background: '#fff', borderRadius: 8, marginTop: 16 }}>
          No containers found matching your search.
        </div>
      )}
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

