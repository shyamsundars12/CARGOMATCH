import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';

export default function ComplaintDetail() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    
    fetch(getApiUrl(`/api/lsp/complaints/${id}`), {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Complaint not found');
          }
          return res.json().then(err => {
            throw new Error(err.error || `Failed to fetch complaint (${res.status})`);
          });
        }
        return res.json();
      })
      .then(data => {
        setComplaint(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch complaint details');
        setLoading(false);
      });
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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
    switch (priority?.toLowerCase()) {
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

  if (loading) {
    return <div style={{ padding: 32 }}>Loading complaint details...</div>;
  }

  if (error || !complaint) {
    return (
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Complaint Details</h1>
        <div style={{ color: 'red', marginBottom: 16 }}>{error || 'Complaint not found'}</div>
        <button
          onClick={() => navigate('/complaints')}
          style={{
            padding: '8px 16px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
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
          onClick={() => navigate('/complaints')}
          style={{
            padding: '8px 16px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: 16
          }}
        >
          ← Back to Complaints
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Complaint Details</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Complaint Information */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Complaint Information</h2>
          <div style={{ marginBottom: 12 }}>
            <strong>ID:</strong> {complaint.id}
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Type:</strong> {complaint.complaint_type || complaint.category || 'N/A'}
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Title:</strong> {complaint.title}
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Description:</strong>
            <div style={{ 
              marginTop: 8, 
              padding: 12, 
              background: '#f8f9fa', 
              borderRadius: 4,
              whiteSpace: 'pre-wrap'
            }}>
              {complaint.description}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Status:</strong>
            <span style={getStatusBadge(complaint.status)}>
              {complaint.status}
            </span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Priority:</strong>
            <span style={getPriorityBadge(complaint.priority)}>
              {complaint.priority}
            </span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Created:</strong> {new Date(complaint.created_at).toLocaleString()}
          </div>
          {complaint.resolved_at && (
            <div style={{ marginBottom: 12 }}>
              <strong>Resolved:</strong> {new Date(complaint.resolved_at).toLocaleString()}
            </div>
          )}
        </div>

        {/* Related Information */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Related Information</h2>
          <div style={{ marginBottom: 12 }}>
            <strong>Complainant:</strong> {complaint.complainant_name || 'N/A'}
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Email:</strong> {complaint.complainant_email || 'N/A'}
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
      {complaint.resolution ? (
        <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ 
              fontSize: '20px', 
              marginRight: 8,
              color: '#10b981'
            }}>✓</span>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#10b981' }}>Resolution Comment</h2>
            {complaint.resolved_at && (
              <span style={{ 
                marginLeft: 'auto', 
                fontSize: '12px', 
                color: '#666' 
              }}>
                Resolved: {new Date(complaint.resolved_at).toLocaleString()}
              </span>
            )}
          </div>
          <div style={{ 
            background: '#f0fdf4', 
            padding: 16, 
            borderRadius: 4,
            whiteSpace: 'pre-wrap',
            borderLeft: '3px solid #10b981',
            color: '#166534'
          }}>
            {complaint.resolution}
          </div>
        </div>
      ) : (
        <div style={{ 
          background: '#fff', 
          padding: 24, 
          borderRadius: 8, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          marginBottom: 24,
          border: '1px dashed #ddd'
        }}>
          <div style={{ textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: '14px', marginBottom: 8 }}>No resolution comment has been added yet</div>
            <div style={{ fontSize: '12px' }}>Resolution will appear here once the LSP responds to this complaint</div>
          </div>
        </div>
      )}
    </div>
  );
}

