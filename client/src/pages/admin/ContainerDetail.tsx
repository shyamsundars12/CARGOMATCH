import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function AdminContainerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/containers/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    })
      .then((res) => res.json())
      .then(setData)
      .catch(() => setError("Failed to fetch container details"));
  }, [id]);

  if (error) {
    return <div style={{ padding: 32, color: "red" }}>{error}</div>;
  }
  if (!data) {
    return <div style={{ padding: 32 }}>Loading...</div>;
  }

  const { container, bookings } = data;

  return (
    <div style={{ padding: 32 }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 16,
          background: "#eee",
          padding: "8px 12px",
          borderRadius: 4,
          border: "none",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        Container Details
      </h1>

      {/* Container Info */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Container Information</h2>
        <p><strong>Number:</strong> {container.container_number}</p>
        <p><strong>Type:</strong> {container.type}</p>
        <p><strong>Size:</strong> {container.size}</p>
        <p><strong>Capacity:</strong> {container.capacity}</p>
        <p><strong>Status:</strong> {container.status}</p>
        <p><strong>Current Location:</strong> {container.current_location}</p>
        <p><strong>Origin Port:</strong> {container.origin_port}</p>
        <p><strong>Destination Port:</strong> {container.destination_port}</p>
        <p><strong>Departure Date:</strong> {container.departure_date}</p>
        <p><strong>Arrival Date:</strong> {container.arrival_date}</p>
        <p><strong>Route Description:</strong> {container.route_description}</p>
        <p>
          <strong>Price per Unit:</strong> {container.price_per_unit}{" "}
          {container.currency}
        </p>
      </section>

      {/* LSP Info */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>LSP Information</h2>
        <p><strong>Name:</strong> {container.lsp_name}</p>
        <p><strong>Email:</strong> {container.lsp_email}</p>
        <p><strong>Company:</strong> {container.company_name}</p>
        <p><strong>Phone:</strong> {container.lsp_phone}</p>
        <p><strong>Address:</strong> {container.lsp_address}</p>
        <p>
          <strong>Verification Status:</strong>{" "}
          <span
            style={{
            color: container.lsp_is_approved ? "green" : "orange",
            fontWeight: 600,
            }}
          >
          {container.lsp_is_approved ? "Verified ✅" : "Not Verified ⚠️"}
          </span>
        </p>
      </section>
    
      {/* Bookings */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Bookings</h2>
        {bookings.length === 0 ? (
          <p>No bookings found for this container.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Trader Name</th>
                <th style={thStyle}>Trader Email</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b: any) => (
                <tr key={b.id}>
                  <td style={tdStyle}>{b.id}</td>
                  <td style={tdStyle}>{b.status}</td>
                  <td style={tdStyle}>{b.trader_name}</td>
                  <td style={tdStyle}>{b.trader_email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  background: "#fff",
  padding: 20,
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  marginBottom: 24,
};
const sectionTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  marginBottom: 12,
};
const thStyle: React.CSSProperties = {
  padding: 8,
  background: "#f4f6f8",
  textAlign: "left",
  fontWeight: 600,
  borderBottom: "1px solid #ddd",
};
const tdStyle: React.CSSProperties = {
  padding: 8,
  borderBottom: "1px solid #eee",
};
