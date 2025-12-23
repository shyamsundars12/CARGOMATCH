import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function AdminComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolution, setResolution] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    
    fetch(`/api/admin/complaints/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setComplaint(data);
        setStatus(data.status || '');
        setResolution(data.resolution || '');
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching complaint:", err);
        setError("Failed to fetch complaint details");
        setLoading(false);
      });
  }, [id]);

  const handleResolve = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`/api/admin/complaints/${id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ status, resolution }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve complaint');
      }

      // Refresh complaint data
      const updatedComplaint = await response.json();
      setComplaint(updatedComplaint);
      alert('Complaint resolved successfully');
    } catch (err) {
      console.error('Error resolving complaint:', err);
      alert('Failed to resolve complaint');
    }
  };

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

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div>Loading complaint details...</div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
          Complaint Details
        </h1>
        <div style={{ color: "red", marginBottom: 16 }}>{error || "Complaint not found"}</div>
        <button
          onClick={() => navigate("/admin/complaints")}
          style={{
            padding: "8px 16px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Back to Complaints
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button
          onClick={() => navigate("/admin/complaints")}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginRight: 16,
          }}
        >
          ← Back to Complaints
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          Complaint Details
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Complaint Information */}
        <div style={{ background: "#fff", padding: 24, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Complaint Information</h2>
          <div style={{ marginBottom: 12 }}>
            <strong>ID:</strong> {complaint.id}
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Title:</strong> {complaint.title}
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Description:</strong> {complaint.description}
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Category:</strong> {complaint.category || 'N/A'}
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Status:</strong> 
            <span style={{ 
              color: getStatusColor(complaint.status), 
              fontWeight: 600, 
              marginLeft: 8 
            }}>
              {complaint.status?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Priority:</strong> 
            <span style={{ 
              color: getPriorityColor(complaint.priority), 
              fontWeight: 600, 
              marginLeft: 8 
            }}>
              {complaint.priority?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Created:</strong> {complaint.created_at ? new Date(complaint.created_at).toLocaleString() : 'N/A'}
          </div>
          {complaint.resolved_at && (
            <div style={{ marginBottom: 12 }}>
              <strong>Resolved:</strong> {new Date(complaint.resolved_at).toLocaleString()}
            </div>
          )}
        </div>

        {/* Related Information */}
        <div style={{ background: "#fff", padding: 24, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Related Information</h2>
          <div style={{ marginBottom: 12 }}>
            <strong>Complainant:</strong> {complaint.complainant_name || 'N/A'}
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Complainant Email:</strong> {complaint.complainant_email || 'N/A'}
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>LSP Company:</strong> {complaint.lsp_company || 'N/A'}
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Container Number:</strong> {complaint.container_number || 'N/A'}
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Booking Date:</strong> {complaint.booking_date ? new Date(complaint.booking_date).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      </div>

      {/* Resolution Section */}
      <div style={{ background: "#fff", padding: 24, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Resolution</h2>
        
        {complaint.resolution ? (
          <div style={{ marginBottom: 16 }}>
            <strong>Current Resolution:</strong>
            <div style={{ 
              background: "#f8f9fa", 
              padding: 12, 
              borderRadius: 4, 
              marginTop: 8,
              whiteSpace: 'pre-wrap'
            }}>
              {complaint.resolution}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <strong>Resolution:</strong>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Enter resolution details..."
              style={{
                width: "100%",
                minHeight: 100,
                padding: 12,
                border: "1px solid #ddd",
                borderRadius: 4,
                marginTop: 8,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <strong>Status:</strong>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              marginLeft: 8,
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {!complaint.resolution && (
          <button
            onClick={handleResolve}
            style={{
              padding: "12px 24px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Resolve Complaint
          </button>
        )}
      </div>
    </div>
  );
}
