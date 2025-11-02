import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch basic stats
      const statsRes = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch detailed analytics
      const [lspsRes, containersRes, bookingsRes, shipmentsRes, complaintsRes] = await Promise.all([
        fetch("/api/admin/lsps", {
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        }),
        fetch("/api/admin/containers", {
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        }),
        fetch("/api/admin/bookings", {
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        }),
        fetch("/api/admin/shipments", {
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        }),
        fetch("/api/admin/complaints", {
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        })
      ]);

      const [lsps, containers, bookings, shipments, complaints] = await Promise.all([
        lspsRes.ok ? lspsRes.json() : [],
        containersRes.ok ? containersRes.json() : [],
        bookingsRes.ok ? bookingsRes.json() : [],
        shipmentsRes.ok ? shipmentsRes.json() : [],
        complaintsRes.ok ? complaintsRes.json() : []
      ]);

      setAnalytics({
        lsps,
        containers,
        bookings,
        shipments,
        complaints
      });
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusCounts = (items: any[], statusField: string) => {
    if (!Array.isArray(items)) {
      return {};
    }
    const counts: { [key: string]: number } = {};
    items.forEach(item => {
      const status = item[statusField]?.toLowerCase() || 'unknown';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  };

  const getRecentActivity = () => {
    if (!analytics) return [];
    
    const activities = [];
    
    // Recent LSPs
    const recentLSPs = analytics.lsps
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .map((lsp: any) => ({
        type: 'LSP Registration',
        description: `${lsp.company_name} registered`,
        time: lsp.created_at,
        status: lsp.is_verified ? 'verified' : 'pending'
      }));

    // Recent Bookings
    const recentBookings = analytics.bookings
      .sort((a: any, b: any) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime())
      .slice(0, 3)
      .map((booking: any) => ({
        type: 'Booking',
        description: `New booking for container ${booking.container_number}`,
        time: booking.booking_date,
        status: booking.status
      }));

    // Recent Shipments
    const recentShipments = analytics.shipments
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .map((shipment: any) => ({
        type: 'Shipment',
        description: `Shipment ${shipment.shipment_number} created`,
        time: shipment.created_at,
        status: shipment.status
      }));

    return [...recentLSPs, ...recentBookings, ...recentShipments]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);
  };

  if (loading) return <div style={{ padding: 32 }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: 32, color: "red" }}>{error}</div>;
  if (!stats || !analytics) return <div style={{ padding: 32 }}>Loading...</div>;

  const containerStatusCounts = getStatusCounts(analytics.containers, 'status');
  const bookingStatusCounts = getStatusCounts(analytics.bookings, 'status');
  const shipmentStatusCounts = getStatusCounts(analytics.shipments, 'status');
  const complaintStatusCounts = getStatusCounts(analytics.complaints, 'status');
  const lspVerificationCounts = {
    verified: analytics.lsps.filter((lsp: any) => lsp.is_verified === true).length,
    pending: analytics.lsps.filter((lsp: any) => lsp.is_verified === null || lsp.verification_status === 'pending').length,
    rejected: analytics.lsps.filter((lsp: any) => lsp.is_verified === false).length
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Admin Dashboard</h1>
        <button
          onClick={fetchDashboardData}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Data
        </button>
      </div>

      {/* Overview Cards */}
      <div style={gridStyle}>
        <div style={cardStyle}>
          <div style={cardTitle}>Total Users</div>
          <div style={cardValue}>{stats.users}</div>
          <div style={cardSubtext}>
            LSPs: {stats.lsps} | Traders: {stats.traders}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={cardTitle}>Containers</div>
          <div style={cardValue}>{stats.containers}</div>
          <div style={cardSubtext}>
            Available: {containerStatusCounts.available || 0} | Booked: {containerStatusCounts.booked || 0}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={cardTitle}>Bookings</div>
          <div style={cardValue}>{stats.bookings}</div>
          <div style={cardSubtext}>
            Pending: {bookingStatusCounts.pending || 0} | Approved: {bookingStatusCounts.approved || 0}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={cardTitle}>Shipments</div>
          <div style={cardValue}>{analytics.shipments.length}</div>
          <div style={cardSubtext}>
            In Transit: {shipmentStatusCounts.in_transit || 0} | Delivered: {shipmentStatusCounts.delivered || 0}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={cardTitle}>Complaints</div>
          <div style={cardValue}>{analytics.complaints.length}</div>
          <div style={cardSubtext}>
            Open: {complaintStatusCounts.open || 0} | Resolved: {complaintStatusCounts.resolved || 0}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={cardTitle}>LSP Verification</div>
          <div style={cardValue}>{lspVerificationCounts.verified}</div>
          <div style={cardSubtext}>
            Pending: {lspVerificationCounts.pending} | Rejected: {lspVerificationCounts.rejected}
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 32 }}>
        {/* Container Status Distribution */}
        <div style={analyticsCard}>
          <h3 style={analyticsTitle}>Container Status Distribution</h3>
          <div style={statusList}>
            {Object.entries(containerStatusCounts).map(([status, count]) => (
              <div key={status} style={statusItem}>
                <span style={statusLabel}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                <span style={statusCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div style={analyticsCard}>
          <h3 style={analyticsTitle}>Booking Status Distribution</h3>
          <div style={statusList}>
            {Object.entries(bookingStatusCounts).map(([status, count]) => (
              <div key={status} style={statusItem}>
                <span style={statusLabel}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                <span style={statusCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* LSP Verification Status */}
        <div style={analyticsCard}>
          <h3 style={analyticsTitle}>LSP Verification Status</h3>
          <div style={statusList}>
            {Object.entries(lspVerificationCounts).map(([status, count]) => (
              <div key={status} style={statusItem}>
                <span style={statusLabel}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                <span style={statusCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={analyticsCard}>
          <h3 style={analyticsTitle}>Recent Activity</h3>
          <div style={activityList}>
            {getRecentActivity().map((activity, index) => (
              <div key={index} style={activityItem}>
                <div style={activityType}>{activity.type}</div>
                <div style={activityDescription}>{activity.description}</div>
                <div style={activityTime}>{new Date(activity.time).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const gridStyle: React.CSSProperties = { 
  display: "grid", 
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
  gap: 16 
};

const cardStyle: React.CSSProperties = { 
  background: "#fff", 
  padding: 20, 
  borderRadius: 8, 
  textAlign: "center", 
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  border: '1px solid #e5e7eb'
};

const cardTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#6b7280',
  marginBottom: 8,
  textTransform: 'uppercase' as const
};

const cardValue: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 700,
  color: '#1f2937',
  marginBottom: 8
};

const cardSubtext: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  lineHeight: 1.4
};

const analyticsCard: React.CSSProperties = {
  background: '#fff',
  padding: 20,
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  border: '1px solid #e5e7eb'
};

const analyticsTitle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#1f2937',
  marginBottom: 16,
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: 8
};

const statusList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 8
};

const statusItem: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 12px',
  background: '#f8f9fa',
  borderRadius: '4px'
};

const statusLabel: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 500,
  color: '#374151',
  textTransform: 'capitalize' as const
};

const statusCount: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#1f2937',
  background: '#e5e7eb',
  padding: '2px 8px',
  borderRadius: '12px',
  minWidth: '24px',
  textAlign: 'center' as const
};

const activityList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 12,
  maxHeight: '300px',
  overflowY: 'auto' as const
};

const activityItem: React.CSSProperties = {
  padding: '12px',
  background: '#f8f9fa',
  borderRadius: '6px',
  borderLeft: '3px solid #2563eb'
};

const activityType: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#2563eb',
  textTransform: 'uppercase' as const,
  marginBottom: 4
};

const activityDescription: React.CSSProperties = {
  fontSize: '14px',
  color: '#374151',
  marginBottom: 4
};

const activityTime: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280'
};
