// Users.tsx - Traders Only
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [filterStatus]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = users.filter((user) => {
      if (user.name?.toLowerCase().includes(query)) return true;
      if (user.email?.toLowerCase().includes(query)) return true;
      if (user.company_name?.toLowerCase().includes(query)) return true;
      if (user.phone_number?.toLowerCase().includes(query)) return true;
      return false;
    });

    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = filterStatus === "ALL" 
        ? "/api/admin/users" 
        : `/api/admin/users?role=${filterStatus}`;
      
      const response = await fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem("adminToken")}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error("Failed to approve user");
      
      // Refresh the users list
      await fetchUsers();
    } catch (err) {
      setError("Failed to approve user");
    }
  };

  const handleReject = async (userId: string) => {
    const reason = prompt("Please enter rejection reason:");
    if (!reason) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem("adminToken")}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejectionReason: reason })
      });
      
      if (!response.ok) throw new Error("Failed to reject user");
      
      // Refresh the users list
      await fetchUsers();
    } catch (err) {
      setError("Failed to reject user");
    }
  };

  // Helper to get approval status label and color
  const getApprovalStatus = (user: any) => {
    // Check if user is active and verified
    if (user.is_active && user.verification_status === 'approved') {
      return { label: "Approved", color: "green" };
    }
    // Check if user is rejected
    if (user.verification_status === 'rejected') {
      return { label: "Rejected", color: "red" };
    }
    // Check if user is pending (not active or verification status is pending)
    if (!user.is_active || user.verification_status === 'pending') {
      return { label: "Pending", color: "orange" };
    }
    // Default case
    return { label: "Unknown", color: "gray" };
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Traders Management</h1>
      {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}

      <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label htmlFor="statusFilter" style={{ fontWeight: 600 }}>
            Filter by Status:
          </label>
          <select
            id="statusFilter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
          >
            <option value="ALL">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 300, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by name, email, company, or phone..."
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
          Showing {filteredUsers.length} of {users.length} traders
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}>Loading...</div>
      ) : (
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Email</th>
              <th style={thStyle}>Company</th>
              <th style={thStyle}>Phone</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
            {filteredUsers.map((user) => {
              const status = getApprovalStatus(user);
            return (
                <tr key={user.id} style={{ backgroundColor: "#f9f9f9" }}>
                  <td style={tdStyle}>{user.name}</td>
                  <td style={tdStyle}>{user.email}</td>
                  <td style={tdStyle}>{user.company_name || '-'}</td>
                  <td style={tdStyle}>{user.phone_number || '-'}</td>
                <td style={{ ...tdStyle, color: status.color, fontWeight: 600 }}>
                  {status.label}
                </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(!user.is_active || user.verification_status === 'pending') && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(user.id);
                            }}
                            style={{
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(user.id);
                            }}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/users/${user.id}`);
                        }}
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        View
                      </button>
                    </div>
                  </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      )}
      
      {filteredUsers.length === 0 && !loading && users.length > 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          No traders found matching your search.
        </div>
      )}
      {users.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          No traders found
        </div>
      )}
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

