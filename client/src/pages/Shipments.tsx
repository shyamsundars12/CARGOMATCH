import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Shipments() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', location: '', description: '' });
  const navigate = useNavigate();

  const fetchShipments = () => {
    setLoading(true);
    fetch('/api/lsp/shipments', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => res.json())
      .then(setShipments)
      .catch(() => setError('Failed to fetch shipments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleStatusUpdate = async () => {
    if (!selectedShipment || !statusUpdate.status) return;
    
    try {
      const res = await fetch(`/api/lsp/shipments/${selectedShipment.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(statusUpdate),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      
      // Update local state
      setShipments(prevShipments =>
        prevShipments.map(shipment =>
          shipment.id === selectedShipment.id
            ? { ...shipment, ...statusUpdate }
            : shipment
        )
      );
      
      setShowStatusModal(false);
      setSelectedShipment(null);
      setStatusUpdate({ status: '', location: '', description: '' });
      alert('Shipment status updated successfully!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openStatusModal = (shipment: any) => {
    setSelectedShipment(shipment);
    setStatusUpdate({
      status: shipment.status,
      location: shipment.current_location || '',
      description: ''
    });
    setShowStatusModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled': return '#3b82f6';
      case 'in_transit': return '#f59e0b';
      case 'delivered': return '#10b981';
      case 'closed': return '#6b7280';
      case 'delayed': return '#ef4444';
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

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus.toLowerCase()) {
      case 'scheduled': return 'in_transit';
      case 'in_transit': return 'delivered';
      case 'delivered': return 'closed';
      default: return currentStatus;
    }
  };

  if (loading) return <div style={{ padding: 32 }}>Loading shipments...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Shipment Management</h1>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      
      <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => fetchShipments()}
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
              fetchShipments();
            } else {
              fetch(`/api/lsp/shipments?status=${status}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              })
                .then(res => res.json())
                .then(setShipments);
            }
          }}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="closed">Closed</option>
          <option value="delayed">Delayed</option>
        </select>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Shipment #</th>
            <th style={thStyle}>Container</th>
            <th style={thStyle}>Route</th>
            <th style={thStyle}>Current Location</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Est. Arrival</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((s) => (
            <tr key={s.id} style={{ backgroundColor: '#f9f9f9' }}>
              <td style={tdStyle}>
                <div style={{ fontWeight: 600 }}>{s.shipment_number}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>ID: {s.id}</div>
              </td>
              <td style={tdStyle}>
                <div style={{ fontWeight: 600 }}>{s.container_number}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{s.container_size} {s.container_type}</div>
              </td>
              <td style={tdStyle}>
                <div style={{ fontSize: '12px' }}>
                  <div>{s.departure_port} → {s.arrival_port}</div>
                </div>
              </td>
              <td style={tdStyle}>{s.current_location || 'N/A'}</td>
              <td style={tdStyle}>
                <span style={getStatusBadge(s.status)}>
                  {s.status}
                </span>
              </td>
              <td style={tdStyle}>
                {s.estimated_arrival_date ? new Date(s.estimated_arrival_date).toLocaleDateString() : 'N/A'}
              </td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    style={{ ...actionButton, color: '#2563eb' }}
                    onClick={() => navigate(`/shipments/${s.id}`)}
                  >
                    View
                  </button>
                  <button
                    style={{ ...actionButton, color: '#10b981' }}
                    onClick={() => openStatusModal(s)}
                  >
                    Update Status
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {shipments.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          No shipments found
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ marginBottom: 20 }}>Update Shipment Status</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Status</label>
              <select
                value={statusUpdate.status}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                style={inputStyle}
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="closed">Closed</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Current Location</label>
              <input
                type="text"
                value={statusUpdate.location}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, location: e.target.value })}
                placeholder="Enter current location"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Description (Optional)</label>
              <textarea
                value={statusUpdate.description}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, description: e.target.value })}
                placeholder="Enter status description"
                style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowStatusModal(false)}
                style={{ ...actionButton, color: '#6b7280' }}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                style={{
                  ...actionButton,
                  background: '#10b981',
                  color: 'white',
                  border: 'none'
                }}
              >
                Update Status
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
