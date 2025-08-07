import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Bookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/lsp/bookings', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => res.json())
      .then(setBookings)
      .catch(() => setError('Failed to fetch bookings'));
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Bookings</h1>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Container</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Customer</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td style={tdStyle}>{b.id}</td>
              <td style={tdStyle}>{b.container_number}</td>
              <td style={tdStyle}>{b.status}</td>
              <td style={tdStyle}>{b.customer_name || b.customer_email}</td>
              <td style={tdStyle}>
                <button style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => navigate(`/bookings/${b.id}`)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: 10, textAlign: 'left', background: '#f4f6f8', fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: 10, borderTop: '1px solid #eee' };
