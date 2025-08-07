import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ShipmentDetail() {
  const { id } = useParams();
  const [shipment, setShipment] = useState<any>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/lsp/shipments/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => res.json())
      .then(data => {
        setShipment(data);
        setStatus(data.status);
      })
      .catch(() => setError('Failed to fetch shipment'));
  }, [id]);

  const handleUpdate = async () => {
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/lsp/shipments/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setMessage('Status updated!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!shipment) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Shipment Detail</h1>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      {message && <div style={{ color: 'green', marginBottom: 16 }}>{message}</div>}
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div><b>ID:</b> {shipment.id}</div>
        <div><b>Container:</b> {shipment.container_number}</div>
        <div><b>Status:</b> {shipment.status}</div>
        {/* Add more fields as needed */}
      </div>
      <div style={{ marginTop: 24 }}>
        <label style={{ marginRight: 8 }}>Update Status:</label>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }}>
          <option value="pending">Pending</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
        </select>
        <button style={{ marginLeft: 12, background: '#2563eb', color: '#fff', padding: 10, borderRadius: 4, fontWeight: 600, border: 'none', cursor: 'pointer' }} onClick={handleUpdate}>
          Update
        </button>
        <button style={{ marginLeft: 16, background: '#eee', color: '#222', padding: 10, borderRadius: 4, fontWeight: 600, border: 'none', cursor: 'pointer' }} onClick={() => navigate('/shipments')}>
          Back
        </button>
      </div>
    </div>
  );
}
