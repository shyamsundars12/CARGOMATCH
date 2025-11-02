import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLSPs() {
  const [lsps, setLSPs] = useState<any[]>([]);
  const [filteredLSPs, setFilteredLSPs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedLSP, setSelectedLSP] = useState<any>(null);
  const [verificationData, setVerificationData] = useState({ is_verified: false, verification_status: 'pending' });
  const navigate = useNavigate();

  const fetchLSPs = () => {
    setLoading(true);
    setError("");
    fetch("/api/admin/lsps", {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then(err => {
            throw new Error(err.error || `Failed to fetch LSPs: ${res.status} ${res.statusText}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        // Ensure data is an array
        if (Array.isArray(data)) {
          setLSPs(data);
          setFilteredLSPs(data);
        } else {
          console.error('Expected array but got:', typeof data, data);
          setLSPs([]);
          setFilteredLSPs([]);
          setError('Invalid data format received from server');
        }
      })
      .catch((err) => {
        console.error('Error fetching LSPs:', err);
        setError(err.message || "Failed to fetch LSPs");
        setLSPs([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLSPs();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLSPs(lsps);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = lsps.filter((lsp) => {
      if (lsp.company_name?.toLowerCase().includes(query)) return true;
      if (lsp.name?.toLowerCase().includes(query)) return true;
      if (lsp.email?.toLowerCase().includes(query)) return true;
      if (lsp.phone?.toLowerCase().includes(query)) return true;
      if (lsp.pan_number?.toLowerCase().includes(query)) return true;
      if (lsp.gst_number?.toLowerCase().includes(query)) return true;
      return false;
    });

    setFilteredLSPs(filtered);
  }, [searchQuery, lsps]);

  const getVerificationStatus = (lsp: any) => {
    // Use verification_status field instead of is_verified
    if (lsp.verification_status === 'approved') {
      return { label: "Verified", color: "green" };
    }
    if (lsp.verification_status === 'rejected') {
      return { label: "Rejected", color: "red" };
    }
    if (lsp.verification_status === 'pending') {
      return { label: "Pending", color: "orange" };
    }
    // Fallback to is_verified if verification_status is not available
    if (lsp.is_verified === true) {
      return { label: "Verified", color: "green" };
    }
    if (lsp.is_verified === false) {
      return { label: "Rejected", color: "red" };
    }
    return { label: "Pending", color: "orange" };
  };

  const getApprovalStatus = (lsp: any) => {
    // Approval status logic based on verification_status and is_active
    if (lsp.verification_status === 'rejected') {
      return { label: "Rejected", color: "red" };
    }
    if (lsp.verification_status === 'pending') {
      return { label: "Pending", color: "orange" };
    }
    if (lsp.verification_status === 'approved') {
      if (lsp.is_active === true) {
        return { label: "Approved", color: "green" };
      } else {
        return { label: "Pending", color: "orange" }; // Approved but not activated yet
      }
    }
    // Fallback for any other cases
    return { label: "Pending", color: "orange" };
  };

  const handleVerification = async () => {
    if (!selectedLSP) return;
    
    // Use lsp_profile_id if available, otherwise fall back to id
    const lspId = selectedLSP.lsp_profile_id || selectedLSP.id;
    
    if (!lspId) {
      alert('Invalid LSP ID');
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/lsps/${lspId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(verificationData),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update verification');
      }
      
      // Update local state with the API response data
      const updatedLSPData = await res.json();
      setLSPs(prevLSPs =>
        prevLSPs.map(lsp => {
          const currentLspId = lsp.lsp_profile_id || lsp.id;
          const selectedLspId = selectedLSP.lsp_profile_id || selectedLSP.id;
          return currentLspId === selectedLspId
            ? { ...lsp, ...updatedLSPData }
            : lsp;
        })
      );
      
      setShowVerificationModal(false);
      setSelectedLSP(null);
      setVerificationData({ is_verified: false, verification_status: 'pending' });
      alert('LSP verification updated successfully!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openVerificationModal = (lsp: any) => {
    setSelectedLSP(lsp);
    setVerificationData({
      is_verified: lsp.is_verified || false,
      verification_status: lsp.verification_status || 'pending'
    });
    setShowVerificationModal(true);
  };

  if (loading) return <div style={{ padding: 32 }}>Loading LSPs...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>LSP Management</h1>
      {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
      
      <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => fetchLSPs()}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
        <select
          onChange={(e) => {
            const status = e.target.value;
            if (status === 'all') {
              fetchLSPs();
            } else {
              // Filter by verification status
              const filtered = lsps.filter(lsp => {
                if (status === 'verified') return lsp.is_verified === true;
                if (status === 'pending') return lsp.is_verified === null || lsp.verification_status === 'pending';
                if (status === 'rejected') return lsp.is_verified === false;
                return true;
              });
              setFilteredLSPs(filtered);
            }
          }}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="all">All LSPs</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending Verification</option>
          <option value="rejected">Rejected</option>
        </select>

        <div style={{ flex: 1, minWidth: 300, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by company name, contact person, email, phone, PAN, or GST..."
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
          Showing {filteredLSPs.length} of {lsps.length} LSPs
        </div>
      )}

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Company Name</th>
            <th style={thStyle}>Contact Person</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Phone</th>
            <th style={thStyle}>Approval Status</th>
            <th style={thStyle}>Verification Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredLSPs.map((lsp) => {
            const approvalStatus = getApprovalStatus(lsp);
            const verificationStatus = getVerificationStatus(lsp);
            return (
              <tr key={lsp.id} style={{ backgroundColor: '#f9f9f9' }}>
                <td style={tdStyle}>{lsp.id}</td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 600 }}>{lsp.company_name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>PAN: {lsp.pan_number}</div>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 600 }}>{lsp.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{lsp.email}</div>
                </td>
                <td style={tdStyle}>{lsp.email}</td>
                <td style={tdStyle}>{lsp.phone}</td>
                <td style={{ ...tdStyle, color: approvalStatus.color, fontWeight: 600 }}>
                  <span style={{
                    background: `${approvalStatus.color}20`,
                    color: approvalStatus.color,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase' as const
                  }}>
                    {approvalStatus.label}
                  </span>
                </td>
                <td style={{ ...tdStyle, color: verificationStatus.color, fontWeight: 600 }}>
                  <span style={{
                    background: `${verificationStatus.color}20`,
                    color: verificationStatus.color,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase' as const
                  }}>
                    {verificationStatus.label}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      style={{ ...actionButton, color: '#2563eb' }}
                      onClick={() => {
                        // Use lsp_profile_id for navigation to LSP detail page
                        const lspId = lsp.lsp_profile_id || lsp.id;
                        if (lspId && lspId !== 'undefined' && lspId !== 'null') {
                          // Navigate to LSP detail page (you may need to create this route)
                          // For now, navigate to users page with a note that this is an LSP
                          navigate(`/admin/lsps/${lspId}`);
                        } else {
                          console.error('Invalid LSP ID for navigation:', lsp);
                          alert('Invalid LSP ID');
                        }
                      }}
                    >
                      View Details
                    </button>
                    <button
                      style={{ ...actionButton, color: '#10b981' }}
                      onClick={() => openVerificationModal(lsp)}
                    >
                      Verify
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {filteredLSPs.length === 0 && lsps.length > 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          No LSPs found matching your search.
        </div>
      )}
      {lsps.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          No LSPs found
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ marginBottom: 20 }}>Verify LSP</h3>
            
            <div style={{ marginBottom: 16, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
              <h4 style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>LSP Details</h4>
              <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
                <strong>Company:</strong> {selectedLSP?.company_name}
              </p>
              <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>
                <strong>Contact:</strong> {selectedLSP?.name} ({selectedLSP?.email})
              </p>
              <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>
                <strong>PAN:</strong> {selectedLSP?.pan_number}
              </p>
              <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>
                <strong>GST:</strong> {selectedLSP?.gst_number}
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Verification Status</label>
              <select
                value={verificationData.verification_status}
                onChange={(e) => setVerificationData({ ...verificationData, verification_status: e.target.value })}
                style={inputStyle}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={verificationData.is_verified}
                  onChange={(e) => setVerificationData({ ...verificationData, is_verified: e.target.checked })}
                />
                <span style={{ fontWeight: 600 }}>Mark as Verified</span>
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowVerificationModal(false)}
                style={{ ...actionButton, color: '#6b7280' }}
              >
                Cancel
              </button>
              <button
                onClick={handleVerification}
                style={{
                  ...actionButton,
                  background: '#10b981',
                  color: 'white',
                  border: 'none'
                }}
              >
                Update Verification
              </button>
            </div>
          </div>
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
  borderCollapse: 'collapse' as const
};

const thStyle: React.CSSProperties = {
  padding: 12,
  background: "#f4f6f8",
  textAlign: "left",
  fontWeight: 600,
  borderBottom: '2px solid #e5e7eb'
};

const tdStyle: React.CSSProperties = {
  padding: 12,
  borderTop: "1px solid #eee",
  verticalAlign: 'top' as const
};

const actionButton: React.CSSProperties = {
  background: 'none',
  border: '1px solid currentColor',
  padding: '4px 8px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 500
};

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalContent: React.CSSProperties = {
  background: 'white',
  padding: 24,
  borderRadius: 8,
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
  width: '90%',
  maxWidth: 500,
  maxHeight: '90vh',
  overflow: 'auto'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  fontSize: '14px'
};
