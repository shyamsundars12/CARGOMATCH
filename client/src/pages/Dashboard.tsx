import { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    containers: null as number | null,
    bookings: null as number | null,
    shipments: null as number | null,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const adminToken = localStorage.getItem("adminToken");
    
    console.log("🔐 Dashboard - Token:", token ? "Present" : "Missing");
    console.log("🔐 Dashboard - Admin Token:", adminToken ? "Present" : "Missing");
    
    if (!token && !adminToken) {
      console.log("❌ No authentication token found");
      return;
    }
    
    // Determine which API to use based on token type
    const apiPrefix = adminToken ? "/api/admin" : "/api/lsp";
    const authToken = adminToken || token;
    
    console.log("🌐 Using API prefix:", apiPrefix);
    
    // Fetch all counts in parallel
    Promise.all([
      fetch(`${apiPrefix}/containers`, {
        headers: { Authorization: `Bearer ${authToken}` },
      }).then(res => {
        console.log("📦 Containers response:", res.status);
        return res.ok ? res.json() : [];
      }),
      fetch(`${apiPrefix}/bookings`, {
        headers: { Authorization: `Bearer ${authToken}` },
      }).then(res => {
        console.log("📋 Bookings response:", res.status);
        return res.ok ? res.json() : [];
      }),
      fetch(`${apiPrefix}/shipments`, {
        headers: { Authorization: `Bearer ${authToken}` },
      }).then(res => {
        console.log("🚢 Shipments response:", res.status);
        return res.ok ? res.json() : [];
      }),
    ]).then(([containers, bookings, shipments]) => {
      console.log("📊 Dashboard data:", { containers, bookings, shipments });
      setStats({
        containers: Array.isArray(containers) ? containers.length : 0,
        bookings: Array.isArray(bookings) ? bookings.length : 0,
        shipments: Array.isArray(shipments) ? shipments.length : 0,
      });
    }).catch(error => {
      console.error("❌ Dashboard fetch error:", error);
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
