import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminShipments() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/admin/shipments", {
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
          setShipments(data);
        } else {
          setError("Invalid data format received");
        }
      })
      .catch((err) => {
        console.error("Error fetching shipments:", err);
        setError("Failed to fetch shipments");
      });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'blue';
      case 'in_transit': return 'orange';
      case 'delivered': return 'green';
      case 'closed': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Shipment Management</h1>
      {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Shipment #</th>
            <th style={thStyle}>Container #</th>
            <th style={thStyle}>LSP Company</th>
            <th style={thStyle}>Trader</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Departure Port</th>
            <th style={thStyle}>Arrival Port</th>
            <th style={thStyle}>Created At</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(shipments) && shipments.map((shipment) => (
            <tr key={shipment.id}>
              <td style={tdStyle}>{shipment.tracking_number || shipment.id}</td>
              <td style={tdStyle}>{shipment.container_number}</td>
              <td style={tdStyle}>{shipment.lsp_company}</td>
              <td style={tdStyle}>{shipment.exporter_name || 'N/A'}</td>
              <td style={{ ...tdStyle, color: getStatusColor(shipment.status), fontWeight: 600 }}>
                {shipment.status?.toUpperCase() || 'UNKNOWN'}
              </td>
              <td style={tdStyle}>{shipment.departure_port || 'N/A'}</td>
              <td style={tdStyle}>{shipment.arrival_port || 'N/A'}</td>
              <td style={tdStyle}>
                {shipment.created_at ? new Date(shipment.created_at).toLocaleDateString() : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const tableStyle: React.CSSProperties = {
  width: "100%",
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

const thStyle: React.CSSProperties = {
  padding: 10,
  background: "#f4f6f8",
  textAlign: "left",
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: 10,
  borderTop: "1px solid #eee",
};

