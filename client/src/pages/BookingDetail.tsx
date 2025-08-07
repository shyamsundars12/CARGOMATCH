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

  if (!booking) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Booking Detail</h1>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      {message && <div style={{ color: 'green', marginBottom: 16 }}>{message}</div>}
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div><b>ID:</b> {booking.id}</div>
        <div><b>Container:</b> {booking.container_number}</div>
        <div><b>Status:</b> {booking.status}</div>
        <div><b>Customer:</b> {booking.customer_name || booking.customer_email}</div>
        {/* Add more fields as needed */}
      </div>
      {booking.status !== 'closed' && (
        <button style={{ background: '#dc2626', color: '#fff', padding: 12, borderRadius: 4, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 24 }} onClick={handleClose}>
          Close Booking
        </button>
      )}
      <button style={{ marginLeft: 16, background: '#eee', color: '#222', padding: 12, borderRadius: 4, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 24 }} onClick={() => navigate('/bookings')}>
        Back
      </button>
    </div>
  );
}
