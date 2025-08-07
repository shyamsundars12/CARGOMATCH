import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Shipments() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/lsp/shipments', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => res.json())
      .then(setShipments)
      .catch(() => setError('Failed to fetch shipments'));
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Shipments</h1>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Container</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((s) => (
            <tr key={s.id}>
              <td style={tdStyle}>{s.id}</td>
              <td style={tdStyle}>{s.container_number}</td>
              <td style={tdStyle}>{s.status}</td>
              <td style={tdStyle}>
                <button style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => navigate(`/shipments/${s.id}`)}>View</button>
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
