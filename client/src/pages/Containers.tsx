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
      currency: 'INR',
      length: '',
      width: '',
      height: '',
      weight: '',
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
        length: form.length ? Number(form.length) : undefined,
        width: form.width ? Number(form.width) : undefined,
        height: form.height ? Number(form.height) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
      };
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || (editId ? 'Failed to update container' : 'Failed to add container'));
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{editId ? 'Edit Container' : 'Add New Container'}</h3>
      <p style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
        {editId ? 'Note: You can only edit containers that are pending approval. Once approved by admin, containers cannot be modified.' : 
         'Fill in all required details. After submission, your container will be reviewed by admin before being listed.'}
      </p>
      {error && <div style={{ color: 'red', marginBottom: 12, padding: 8, background: '#fee', borderRadius: 4 }}>{error}</div>}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Container Type *</label>
          <select style={inputStyle} name="container_type_id" value={form.container_type_id} onChange={handleChange} required>
            <option value="">Select Container Type</option>
            {containerTypes.map((ct) => (
              <option key={ct.id} value={ct.id}>{ct.type_name} - {ct.size}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Container Number *</label>
          <input style={inputStyle} name="container_number" placeholder="e.g., CONT1234567" value={form.container_number} onChange={handleChange} required />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Container Size *</label>
          <input style={inputStyle} name="size" placeholder="e.g., 20ft, 40ft" value={form.size} onChange={handleChange} required />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Container Type *</label>
          <input style={inputStyle} name="type" placeholder="e.g., Standard, Refrigerated" value={form.type} onChange={handleChange} required />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Capacity (kg) *</label>
          <input style={inputStyle} name="capacity" type="number" placeholder="e.g., 28000" value={form.capacity} onChange={handleChange} required />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Weight (kg)</label>
          <input style={inputStyle} name="weight" type="number" placeholder="e.g., 2300" value={form.weight} onChange={handleChange} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Current Location *</label>
          <input style={inputStyle} name="current_location" placeholder="e.g., Mumbai Port" value={form.current_location} onChange={handleChange} required />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Length (m)</label>
          <input style={inputStyle} name="length" type="number" step="0.01" placeholder="e.g., 6.06" value={form.length} onChange={handleChange} />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Width (m)</label>
          <input style={inputStyle} name="width" type="number" step="0.01" placeholder="e.g., 2.44" value={form.width} onChange={handleChange} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Height (m)</label>
          <input style={inputStyle} name="height" type="number" step="0.01" placeholder="e.g., 2.59" value={form.height} onChange={handleChange} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Origin Port *</label>
          <input style={inputStyle} name="origin_port" placeholder="e.g., Mumbai Port, India" value={form.origin_port} onChange={handleChange} required />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Destination Port *</label>
          <input style={inputStyle} name="destination_port" placeholder="e.g., Port of Singapore" value={form.destination_port} onChange={handleChange} required />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Departure Date *</label>
          <input style={inputStyle} name="departure_date" type="date" value={form.departure_date} onChange={handleChange} required />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Arrival Date *</label>
          <input style={inputStyle} name="arrival_date" type="date" value={form.arrival_date} onChange={handleChange} required />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Route Description</label>
        <textarea 
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} 
          name="route_description" 
          placeholder="Describe the shipping route, stops, and any relevant details" 
          value={form.route_description} 
          onChange={(e) => setForm({ ...form, route_description: e.target.value })} 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Price per Unit *</label>
          <input style={inputStyle} name="price_per_unit" type="number" step="0.01" placeholder="e.g., 50000" value={form.price_per_unit} onChange={handleChange} required />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Currency *</label>
          <select style={inputStyle} name="currency" value={form.currency} onChange={handleChange} required>
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <button style={{ background: '#2563eb', color: '#fff', padding: 12, borderRadius: 4, fontWeight: 600, border: 'none', cursor: 'pointer', flex: 1 }} type="submit">
          {editId ? 'Update Container' : 'Submit for Approval'}
        </button>
        <button style={{ background: '#eee', color: '#222', padding: 12, borderRadius: 4, fontWeight: 600, border: 'none', cursor: 'pointer', flex: 1 }} type="button" onClick={onClose}>Cancel</button>
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
  const [filteredContainers, setFilteredContainers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [editInitial, setEditInitial] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchContainers = () => {
    fetch('/api/lsp/containers', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => res.json())
      .then(data => {
        setContainers(data);
        setFilteredContainers(data);
      })
      .catch(() => setError('Failed to fetch containers'));
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContainers(containers);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = containers.filter((container) => {
      if (container.container_number?.toLowerCase().includes(query)) return true;
      if (container.type?.toLowerCase().includes(query)) return true;
      if (container.size?.toLowerCase().includes(query)) return true;
      if (container.type_name?.toLowerCase().includes(query)) return true;
      if (container.origin_port?.toLowerCase().includes(query)) return true;
      if (container.destination_port?.toLowerCase().includes(query)) return true;
      if (container.current_location?.toLowerCase().includes(query)) return true;
      if (container.container_approval_status?.toLowerCase().includes(query)) return true;
      return false;
    });

    setFilteredContainers(filtered);
  }, [searchQuery, containers]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this container?')) return;
    try {
      const res = await fetch(`/api/lsp/containers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete container');
      }
      fetchContainers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (container: any) => {
    if (container.container_approval_status === 'approved') {
      alert('Cannot edit container after admin approval. Container is locked.');
      return;
    }
    setEditId(container.id);
    setEditInitial(container);
    setShowForm(true);
  };

  const getApprovalStatusBadge = (status: string) => {
    const statusLower = (status || 'pending').toLowerCase();
    let color = '#f59e0b'; // pending - orange
    let label = 'Pending';
    
    if (statusLower === 'approved') {
      color = '#10b981'; // approved - green
      label = 'Approved';
    } else if (statusLower === 'rejected') {
      color = '#ef4444'; // rejected - red
      label = 'Rejected';
    }

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

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>My Containers</h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
        Manage your container listings. Containers are reviewed by admin before being visible to traders. 
        Once approved, containers cannot be modified.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <button 
          style={{ 
            background: '#2563eb', 
            color: '#fff', 
            padding: '12px 24px', 
            borderRadius: 4, 
            fontWeight: 600, 
            border: 'none', 
            cursor: 'pointer'
          }} 
          onClick={() => { 
            setShowForm(true); 
            setEditId(null); 
            setEditInitial(null); 
          }}
        >
          + Add New Container
        </button>

        <div style={{ flex: 1, minWidth: 300, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by container number, type, size, ports, location, or status..."
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
          Showing {filteredContainers.length} of {containers.length} containers
        </div>
      )}

      {showForm && (
        <ContainerForm
          onClose={() => {
            setShowForm(false);
            setEditId(null);
            setEditInitial(null);
          }}
          onSuccess={fetchContainers}
          initial={editInitial}
          editId={editId || undefined}
        />
      )}
      
      {error && <div style={{ color: 'red', marginBottom: 16, padding: 12, background: '#fee', borderRadius: 4 }}>{error}</div>}
      
      {filteredContainers.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 40, 
          background: '#fff', 
          borderRadius: 8, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          color: '#666'
        }}>
          {searchQuery ? 'No containers found matching your search.' : 'No containers yet. Click "Add New Container" to create your first listing.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Container #</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Size</th>
                <th style={thStyle}>Origin</th>
                <th style={thStyle}>Destination</th>
                <th style={thStyle}>Departure</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContainers.map((c) => {
                const isApproved = c.container_approval_status === 'approved';
                return (
                  <tr key={c.id}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{c.container_number || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{c.current_location || ''}</div>
                    </td>
                    <td style={tdStyle}>
                      <div>{c.type_name || c.type || 'N/A'}</div>
                    </td>
                    <td style={tdStyle}>{c.size || 'N/A'}</td>
                    <td style={tdStyle}>{c.origin_port || 'N/A'}</td>
                    <td style={tdStyle}>{c.destination_port || 'N/A'}</td>
                    <td style={tdStyle}>
                      {c.departure_date ? new Date(c.departure_date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td style={tdStyle}>
                      {c.price_per_unit ? `${new Intl.NumberFormat('en-IN').format(c.price_per_unit)} ${c.currency || 'INR'}` : 'N/A'}
                    </td>
                    <td style={tdStyle}>
                      <span style={getApprovalStatusBadge(c.container_approval_status)}>
                        {(c.container_approval_status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {!isApproved ? (
                          <>
                            <button 
                              style={{ 
                                color: '#2563eb', 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                fontSize: '12px',
                                textDecoration: 'underline'
                              }} 
                              onClick={() => handleEdit(c)}
                            >
                              Edit
                            </button>
                            <button 
                              style={{ 
                                color: '#dc2626', 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer',
                                fontSize: '12px',
                                textDecoration: 'underline'
                              }} 
                              onClick={() => handleDelete(c.id)}
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <span style={{ color: '#6b7280', fontSize: '12px', fontStyle: 'italic' }}>
                            Locked (Approved)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: 10, textAlign: 'left', background: '#f4f6f8', fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: 10, borderTop: '1px solid #eee' };
