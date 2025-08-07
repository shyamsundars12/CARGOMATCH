import { useEffect, useState } from 'react';

function ContainerForm({ onClose, onSuccess, initial, editId }: { onClose: () => void; onSuccess: () => void; initial?: any; editId?: number }) {
  const [form, setForm] = useState(
    initial || {
      container_type_id: '',
      container_number: '',
      size: '',
      type: '',
      capacity: '',
      current_location: '',
      departure_date: '',
      arrival_date: '',
      origin_port: '',
      destination_port: '',
      route_description: '',
      price_per_unit: '',
      currency: 'USD',
    }
  );
  const [error, setError] = useState('');
  const [containerTypes, setContainerTypes] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/lsp/container-types', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => res.json())
      .then(setContainerTypes)
      .catch(() => setContainerTypes([]));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/lsp/containers/${editId}` : '/api/lsp/containers';
      const payload = {
        ...form,
        container_type_id: form.container_type_id ? Number(form.container_type_id) : undefined,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        price_per_unit: form.price_per_unit ? Number(form.price_per_unit) : undefined,
      };
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(editId ? 'Failed to update container' : 'Failed to add container');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{editId ? 'Edit Container' : 'Add New Container'}</h3>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <label>Container Type</label>
      <select style={inputStyle} name="container_type_id" value={form.container_type_id} onChange={handleChange} required>
        <option value="">Select Type</option>
        {containerTypes.map((ct) => (
          <option key={ct.id} value={ct.id}>{ct.type_name} - {ct.size}</option>
        ))}
      </select>
      <input style={inputStyle} name="container_number" placeholder="Container Number" value={form.container_number} onChange={handleChange} required />
      <input style={inputStyle} name="type" placeholder="Type" value={form.type} onChange={handleChange} required />
      <input style={inputStyle} name="size" placeholder="Size" value={form.size} onChange={handleChange} required />
      <input style={inputStyle} name="capacity" type="number" placeholder="Capacity" value={form.capacity} onChange={handleChange} required />
      <input style={inputStyle} name="current_location" placeholder="Current Location" value={form.current_location} onChange={handleChange} required />
      <input style={inputStyle} name="origin_port" placeholder="Origin Port" value={form.origin_port} onChange={handleChange} required />
      <input style={inputStyle} name="destination_port" placeholder="Destination Port" value={form.destination_port} onChange={handleChange} required />
      <input style={inputStyle} name="departure_date" type="date" placeholder="Departure Date" value={form.departure_date} onChange={handleChange} required />
      <input style={inputStyle} name="arrival_date" type="date" placeholder="Arrival Date" value={form.arrival_date} onChange={handleChange} required />
      <input style={inputStyle} name="route_description" placeholder="Route Description" value={form.route_description} onChange={handleChange} />
      <input style={inputStyle} name="price_per_unit" type="number" placeholder="Price per Unit" value={form.price_per_unit} onChange={handleChange} required />
      <input style={inputStyle} name="currency" placeholder="Currency" value={form.currency} onChange={handleChange} required />
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <button style={{ background: '#2563eb', color: '#fff', padding: 10, borderRadius: 4, fontWeight: 600, border: 'none', cursor: 'pointer', flex: 1 }} type="submit">Save</button>
        <button style={{ background: '#eee', color: '#222', padding: 10, borderRadius: 4, fontWeight: 600, border: 'none', cursor: 'pointer', flex: 1 }} type="button" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  marginBottom: 10,
  padding: 10,
  borderRadius: 4,
  border: '1px solid #ddd',
};

export default function Containers() {
  const [containers, setContainers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [editInitial, setEditInitial] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchContainers = () => {
    fetch('/api/lsp/containers', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => res.json())
      .then(setContainers)
      .catch(() => setError('Failed to fetch containers'));
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this container?')) return;
    await fetch(`/api/lsp/containers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    fetchContainers();
  };

  const handleEdit = (container: any) => {
    setEditId(container.id);
    setEditInitial(container);
    setShowForm(true);
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Containers</h1>
      <button style={{ background: '#2563eb', color: '#fff', padding: 12, borderRadius: 4, fontWeight: 600, border: 'none', cursor: 'pointer', marginBottom: 24 }} onClick={() => { setShowForm(true); setEditId(null); setEditInitial(null); }}>
        Add New Container
      </button>
      {showForm && (
        <ContainerForm
          onClose={() => setShowForm(false)}
          onSuccess={fetchContainers}
          initial={editInitial}
          editId={editId || undefined}
        />
      )}
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <thead>
          <tr>
            <th style={thStyle}>Number</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Size</th>
            <th style={thStyle}>Capacity</th>
            <th style={thStyle}>Current Location</th>
            <th style={thStyle}>Origin</th>
            <th style={thStyle}>Destination</th>
            <th style={thStyle}>Departure</th>
            <th style={thStyle}>Arrival</th>
            <th style={thStyle}>Price</th>
            <th style={thStyle}>Currency</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {containers.map((c) => (
            <tr key={c.id}>
              <td style={tdStyle}>{c.container_number}</td>
              <td style={tdStyle}>{c.type}</td>
              <td style={tdStyle}>{c.size}</td>
              <td style={tdStyle}>{c.capacity}</td>
              <td style={tdStyle}>{c.current_location}</td>
              <td style={tdStyle}>{c.origin_port}</td>
              <td style={tdStyle}>{c.destination_port}</td>
              <td style={tdStyle}>{c.departure_date}</td>
              <td style={tdStyle}>{c.arrival_date}</td>
              <td style={tdStyle}>{c.price_per_unit}</td>
              <td style={tdStyle}>{c.currency}</td>
              <td style={tdStyle}>
                <button style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', marginRight: 8 }} onClick={() => handleEdit(c)}>Edit</button>
                <button style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => handleDelete(c.id)}>Delete</button>
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
