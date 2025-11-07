import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Complaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [response, setResponse] = useState('');
  const navigate = useNavigate();

  const fetchComplaints = () => {
    setLoading(true);
    setError('');
    fetch('/api/lsp/complaints', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => {
            throw new Error(err.error || `Failed to fetch complaints (${res.status})`);
          });
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setComplaints(data);
        } else {
          setComplaints([]);
          setError('Invalid data format received from server');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch complaints');
        setComplaints([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResponse = async () => {
    if (!selectedComplaint || !response.trim()) {
      alert('Please provide a response/resolution');
      return;
    }
    
    try {
      const res = await fetch(`/api/lsp/complaints/${selectedComplaint.id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ 
          status: 'resolved',
          resolution: response.trim()
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || `Failed to submit response (${res.status})`);
      }
      
      // Update local state
      setComplaints(prevComplaints =>
        prevComplaints.map(complaint =>
          complaint.id === selectedComplaint.id
            ? { ...complaint, status: 'resolved', resolution: response }
            : complaint
        )
      );
      
      setShowResponseModal(false);
      setSelectedComplaint(null);
      setResponse('');
      
      // Refresh complaints to get updated data
      fetchComplaints();
      
      alert('Resolution comment submitted successfully!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openResponseModal = (complaint: any) => {
    setSelectedComplaint(complaint);
    setResponse(complaint.resolution || '');
    setShowResponseModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return '#ef4444';
      case 'in_progress': return '#f59e0b';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusBadge = (status: string) => {
    const color = getStatusColor(status);
    return {
      background: `${color}20`,
      color: color,
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase' as const
    };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const color = getPriorityColor(priority);
    return {
      background: `${color}20`,
      color: color,
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase' as const
    };
  };

  if (loading) return <div style={{ padding: 32 }}>Loading complaints...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Complaint Management</h1>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      
      <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => fetchComplaints()}
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
              fetchComplaints();
            } else {
              setLoading(true);
              setError('');
              fetch(`/api/lsp/complaints?status=${status}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              })
                .then(res => {
                  if (!res.ok) {
                    return res.json().then(err => {
                      throw new Error(err.error || `Failed to fetch complaints (${res.status})`);
                    });
                  }
                  return res.json();
                })
                .then(data => {
                  if (Array.isArray(data)) {
                    setComplaints(data);
                  } else {
                    setComplaints([]);
                    setError('Invalid data format received from server');
                  }
                })
                .catch((err) => {
                  setError(err.message || 'Failed to fetch complaints');
                  setComplaints([]);
                })
                .finally(() => setLoading(false));
            }
          }}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Title</th>
            <th style={thStyle}>Complainant</th>
            <th style={thStyle}>Priority</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Created</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(complaints) && complaints.map((c) => (
            <tr key={c.id} style={{ backgroundColor: '#f9f9f9' }}>
              <td style={tdStyle}>{c.id}</td>
              <td style={tdStyle}>
                <span style={{ 
                  background: '#e5e7eb', 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  fontWeight: 500
                }}>
                  {c.complaint_type}
                </span>
              </td>
              <td style={tdStyle}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: '12px', color: '#666', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.description}
                </div>
                {c.resolution && (
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#10b981', 
                    marginTop: 4,
                    fontWeight: 500
                  }}>
                    ✓ Resolution provided
                  </div>
                )}
              </td>
              <td style={tdStyle}>
                <div>
                  <div style={{ fontWeight: 600 }}>{c.complainant_name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{c.complainant_email}</div>
                </div>
              </td>
              <td style={tdStyle}>
                <span style={getPriorityBadge(c.priority)}>
                  {c.priority}
                </span>
              </td>
              <td style={tdStyle}>
                <span style={getStatusBadge(c.status)}>
                  {c.status}
                </span>
              </td>
              <td style={tdStyle}>
                {new Date(c.created_at).toLocaleDateString()}
              </td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    style={{ ...actionButton, color: '#2563eb' }}
                    onClick={() => navigate(`/complaints/${c.id}`)}
                  >
                    View
                  </button>
                  {(c.status === 'open' || c.status === 'in_progress') && (
                    <button
                      style={{ ...actionButton, color: '#10b981' }}
                      onClick={() => openResponseModal(c)}
                    >
                      Respond
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {complaints.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          No complaints found
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ marginBottom: 20 }}>Add Resolution Comment</h3>
            
            <div style={{ marginBottom: 16, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
              <h4 style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Complaint Details</h4>
              <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
                <strong>Type:</strong> {selectedComplaint?.complaint_type}
              </p>
              <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>
                <strong>Title:</strong> {selectedComplaint?.title}
              </p>
              <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>
                <strong>Description:</strong> {selectedComplaint?.description}
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Resolution Comment</label>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
                Provide a detailed resolution comment that will be visible to the complainant.
              </p>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Enter your resolution comment explaining how you've addressed the complaint..."
                style={{ ...inputStyle, height: '120px', resize: 'vertical' }}
              />
            </div>
            {selectedComplaint?.resolution && (
              <div style={{ marginBottom: 16, padding: 12, background: '#f0f9ff', borderRadius: 4, borderLeft: '3px solid #3b82f6' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6', marginBottom: 4 }}>Previous Resolution:</div>
                <div style={{ fontSize: '13px', color: '#333', whiteSpace: 'pre-wrap' }}>
                  {selectedComplaint.resolution}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowResponseModal(false)}
                style={{ ...actionButton, color: '#6b7280' }}
              >
                Cancel
              </button>
              <button
                onClick={handleResponse}
                style={{
                  ...actionButton,
                  background: '#10b981',
                  color: 'white',
                  border: 'none'
                }}
              >
                Submit Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  borderCollapse: 'collapse' as const
};

const thStyle: React.CSSProperties = { 
  padding: 12, 
  textAlign: 'left', 
  background: '#f4f6f8', 
  fontWeight: 600,
  borderBottom: '2px solid #e5e7eb'
};

const tdStyle: React.CSSProperties = { 
  padding: 12, 
  borderTop: '1px solid #eee',
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
  maxWidth: 600,
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
