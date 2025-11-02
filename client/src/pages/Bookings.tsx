import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Bookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchBookings = () => {
    setLoading(true);
    fetch('/api/lsp/bookings', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => res.json())
      .then(data => {
        setBookings(data);
        setFilteredBookings(data);
      })
      .catch(() => setError('Failed to fetch bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBookings(bookings);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = bookings.filter((booking) => {
      if (booking.id?.toString().includes(query)) return true;
      if (booking.container_number?.toLowerCase().includes(query)) return true;
      if (booking.status?.toLowerCase().includes(query)) return true;
      if (booking.user_name?.toLowerCase().includes(query)) return true;
      if (booking.user_email?.toLowerCase().includes(query)) return true;
      if (booking.user_company_name?.toLowerCase().includes(query)) return true;
      if (booking.cargo_type?.toLowerCase().includes(query)) return true;
      return false;
    });

    setFilteredBookings(filtered);
  }, [searchQuery, bookings]);

  const handleStatusChange = async (bookingId: number, status: string) => {
    if (!window.confirm(`Change booking status to ${status}?`)) return;
    
    try {
      const res = await fetch(`/api/lsp/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      
      // Update local state
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: status.toLowerCase() }
            : booking
        )
      );
      
      alert(`Booking ${status} successfully!`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'confirmed': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'closed': return '#6b7280';
      case 'cancelled': return '#dc2626';
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

  if (loading) return <div style={{ padding: 32 }}>Loading bookings...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Bookings Management</h1>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      
      <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => fetchBookings()}
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
              fetchBookings();
            } else {
              fetch(`/api/lsp/bookings?status=${status}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              })
                .then(res => res.json())
                .then(data => {
                  setBookings(data);
                  setFilteredBookings(data);
                });
            }
          }}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <div style={{ flex: 1, minWidth: 300, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by booking ID, container number, status, customer name, email, company, or cargo type..."
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
          Showing {filteredBookings.length} of {bookings.length} bookings
        </div>
      )}

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Container</th>
            <th style={thStyle}>Customer</th>
            <th style={thStyle}>Cargo Type</th>
            <th style={thStyle}>Weight/Volume</th>
            <th style={thStyle}>Booking Date</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBookings.map((b) => (
            <tr key={b.id} style={{ backgroundColor: '#f9f9f9' }}>
              <td style={tdStyle}>{b.id}</td>
              <td style={tdStyle}>
                <div>
                  <div style={{ fontWeight: 600 }}>{b.container_number || b.container_id}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {b.container_size || ''} {b.container_type || ''}
                  </div>
                </div>
              </td>
              <td style={tdStyle}>
                <div>
                  <div style={{ fontWeight: 600 }}>{b.user_name || 'N/A'}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{b.user_email || 'N/A'}</div>
                  {b.user_company_name && (
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                      {b.user_company_name}
                    </div>
                  )}
                </div>
              </td>
              <td style={tdStyle}>{b.cargo_type || 'General'}</td>
              <td style={tdStyle}>
                <div style={{ fontSize: '12px' }}>
                  <div>{b.cargo_weight ? `${b.cargo_weight} kg` : 'N/A'}</div>
                  <div>{b.cargo_volume ? `${b.cargo_volume} m³` : 'N/A'}</div>
                </div>
              </td>
              <td style={tdStyle}>{new Date(b.booking_date).toLocaleDateString()}</td>
              <td style={tdStyle}>
                <span style={getStatusBadge(b.status || 'pending')}>
                  {(b.status || 'pending').toUpperCase()}
                </span>
              </td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    style={{ ...actionButton, color: '#2563eb' }}
                    onClick={() => navigate(`/bookings/${b.id}`)}
                  >
                    View
                  </button>
                  {b.status === 'pending' && (
                    <>
                      <button
                        style={{ ...actionButton, color: '#10b981' }}
                        onClick={() => handleStatusChange(b.id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        style={{ ...actionButton, color: '#ef4444' }}
                        onClick={() => handleStatusChange(b.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {b.status === 'approved' && (
                    <button
                      style={{ ...actionButton, color: '#6b7280' }}
                      onClick={() => handleStatusChange(b.id, 'closed')}
                    >
                      Close
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {filteredBookings.length === 0 && bookings.length > 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          No bookings found matching your search.
        </div>
      )}
      {bookings.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          No bookings found
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
