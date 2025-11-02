import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/lsp/bookings/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => res.json())
      .then(setBooking)
      .catch(() => setError('Failed to fetch booking'));
  }, [id]);

  const handleClose = async () => {
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/lsp/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: 'closed' }),
      });
      if (!res.ok) throw new Error('Failed to close booking');
      setMessage('Booking closed!');
      setTimeout(() => navigate('/bookings'), 1000);
    } catch (err: any) {
      setError(err.message);
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
      padding: '4px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      display: 'inline-block'
    };
  };

  if (!booking) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Booking Detail</h1>
      {error && <div style={{ color: 'red', marginBottom: 16, padding: 12, background: '#fee', borderRadius: 4 }}>{error}</div>}
      {message && <div style={{ color: 'green', marginBottom: 16, padding: 12, background: '#efe', borderRadius: 4 }}>{message}</div>}
      
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Booking ID</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>#{booking.id}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Status</div>
            <span style={getStatusBadge(booking.status || 'pending')}>
              {(booking.status || 'pending').toUpperCase()}
            </span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 12, color: '#333' }}>Container Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Container Number</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.container_number || booking.container_id || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Container Type</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>
                {booking.container_size || ''} {booking.container_type || ''} {booking.container_size && booking.container_type ? '' : 'N/A'}
              </div>
            </div>
            {booking.origin_port && booking.destination_port && (
              <>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Origin Port</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.origin_port}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Destination Port</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.destination_port}</div>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 12, color: '#333' }}>Customer Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Customer Name</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.user_name || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.user_email || 'N/A'}</div>
            </div>
            {booking.user_company_name && (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Company</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.user_company_name}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 12, color: '#333' }}>Cargo Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Cargo Type</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.cargo_type || 'General'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Weight</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.cargo_weight ? `${booking.cargo_weight} kg` : booking.weight ? `${booking.weight} kg` : 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Volume</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.cargo_volume ? `${booking.cargo_volume} m³` : booking.volume ? `${booking.volume} m³` : 'N/A'}</div>
            </div>
            {booking.booked_units && (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Booked Units</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.booked_units}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: 16 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 12, color: '#333' }}>Booking Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Booking Date</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>
                {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : booking.created_at ? new Date(booking.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </div>
            </div>
            {booking.total_price && (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Total Price</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: booking.currency || 'INR',
                  }).format(booking.total_price)}
                </div>
              </div>
            )}
            {booking.payment_status && (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Payment Status</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.payment_status.toUpperCase()}</div>
              </div>
            )}
            {booking.tracking_number && (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Tracking Number</div>
                <div style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'monospace' }}>{booking.tracking_number}</div>
              </div>
            )}
          </div>
          {booking.notes && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: '14px', padding: 12, background: '#f9f9f9', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                {booking.notes}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {booking.status && booking.status.toLowerCase() !== 'closed' && booking.status.toLowerCase() !== 'cancelled' && (
          <button 
            style={{ 
              background: '#dc2626', 
              color: '#fff', 
              padding: '12px 24px', 
              borderRadius: 4, 
              fontWeight: 600, 
              border: 'none', 
              cursor: 'pointer'
            }} 
            onClick={handleClose}
          >
            Close Booking
          </button>
        )}
        <button 
          style={{ 
            background: '#eee', 
            color: '#222', 
            padding: '12px 24px', 
            borderRadius: 4, 
            fontWeight: 600, 
            border: 'none', 
            cursor: 'pointer'
          }} 
          onClick={() => navigate('/bookings')}
        >
          Back
        </button>
      </div>
    </div>
  );
}
