import { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    containers: null as number | null,
    bookings: null as number | null,
    shipments: null as number | null,
  });

  useEffect(() => {
    // Fetch all counts in parallel
    Promise.all([
      fetch("/api/lsp/containers", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).then(res => res.ok ? res.json() : []),
      fetch("/api/lsp/bookings", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).then(res => res.ok ? res.json() : []),
      fetch("/api/lsp/shipments", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).then(res => res.ok ? res.json() : []),
    ]).then(([containers, bookings, shipments]) => {
      setStats({
        containers: Array.isArray(containers) ? containers.length : 0,
        bookings: Array.isArray(bookings) ? bookings.length : 0,
        shipments: Array.isArray(shipments) ? shipments.length : 0,
      });
    });
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Dashboard Overview</h1>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700 }}>
            {stats.containers !== null ? stats.containers : '--'}
          </div>
          <div style={{ color: '#666' }}>Containers</div>
        </div>
        <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700 }}>
            {stats.bookings !== null ? stats.bookings : '--'}
          </div>
          <div style={{ color: '#666' }}>Bookings</div>
        </div>
        <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700 }}>
            {stats.shipments !== null ? stats.shipments : '--'}
          </div>
          <div style={{ color: '#666' }}>Shipments</div>
        </div>
      </div>
    </div>
  );
}
