import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/admin/bookings", {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setBookings(data);
          setFilteredBookings(data);
        } else {
          setError("Invalid data format received");
        }
      })
      .catch((err) => {
        console.error("Error fetching bookings:", err);
        setError("Failed to fetch bookings");
      });
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
      if (booking.exporter_name?.toLowerCase().includes(query)) return true;
      if (booking.exporter_email?.toLowerCase().includes(query)) return true;
      if (booking.importer_name?.toLowerCase().includes(query)) return true;
      if (booking.importer_email?.toLowerCase().includes(query)) return true;
      return false;
    });

    setFilteredBookings(filtered);
  }, [searchQuery, bookings]);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        All Bookings
      </h1>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by booking ID, container number, status, or trader details..."
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

      {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
      <table
        style={{
          width: "100%",
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Container</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Trader</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(filteredBookings) && filteredBookings.map((b) => (
            <tr key={b.id}>
              <td style={tdStyle}>{b.id}</td>
              <td style={tdStyle}>{b.container_number}</td>
              <td style={tdStyle}>{b.status}</td>
              <td style={tdStyle}>
                {b.exporter_name || b.exporter_email || 'N/A'}
              </td>
              <td style={tdStyle}>
                <button
                  style={{
                    color: "#2563eb",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/admin/bookings/${b.id}`)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {filteredBookings.length === 0 && bookings.length > 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666', background: '#fff', borderRadius: 8, marginTop: 16 }}>
          No bookings found matching your search.
        </div>
      )}
    </div>
  );
}
const thStyle: React.CSSProperties = {
  padding: 10,
  textAlign: "left",
  background: "#f4f6f8",
  fontWeight: 600,
};
const tdStyle: React.CSSProperties = {
  padding: 10,
  borderTop: "1px solid #eee",
};

