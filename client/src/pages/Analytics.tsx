import { useEffect, useState } from 'react';

export default function Analytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found. Please log in.');
      setLoading(false);
      return;
    }

    console.log('🔍 Fetching analytics with token:', token.substring(0, 20) + '...');
    
    fetch('/api/lsp/analytics', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        console.log('📊 Analytics response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('📈 Analytics data received:', data);
        setAnalytics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Analytics fetch error:', err);
        setError(`Failed to load analytics: ${err.message}`);
        setLoading(false);
      });
  }, []);

  const refreshAnalytics = () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('No authentication token found. Please log in.');
      setLoading(false);
      return;
    }

    fetch('/api/lsp/analytics', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(err => {
        setError(`Failed to load analytics: ${err.message}`);
        setLoading(false);
      });
  };

  if (loading) return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <div>Loading analytics...</div>
      <button 
        onClick={refreshAnalytics}
        style={{ marginTop: 16, padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Retry
      </button>
    </div>
  );
  
  if (error) return (
    <div style={{ padding: 32 }}>
      <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>
      <button 
        onClick={refreshAnalytics}
        style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Retry
      </button>
    </div>
  );
  
  if (!analytics) return (
    <div style={{ padding: 32 }}>
      <div>No analytics data available</div>
      <button 
        onClick={refreshAnalytics}
        style={{ marginTop: 16, padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Refresh
      </button>
    </div>
  );

  const { containers, bookings, shipments, revenue, recentActivity } = analytics;

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Analytics Dashboard</h1>
        <button 
          onClick={refreshAnalytics}
          style={{ 
            padding: '8px 16px', 
            background: '#2563eb', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          🔄 Refresh
        </button>
      </div>
      
      {/* Revenue Overview */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Revenue Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>
              ${parseFloat(revenue.total_revenue || 0).toLocaleString()}
            </div>
            <div style={{ color: '#666' }}>Total Revenue</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb' }}>
              ${parseFloat(revenue.average_price || 0).toFixed(2)}
            </div>
            <div style={{ color: '#666' }}>Average Price</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#7c3aed' }}>
              {revenue.total_bookings || '0'}
            </div>
            <div style={{ color: '#666' }}>Total Bookings</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>
              ${parseFloat(revenue.revenue_per_booking || 0).toFixed(2)}
            </div>
            <div style={{ color: '#666' }}>Revenue per Booking</div>
          </div>
        </div>
      </div>

      {/* Container Statistics */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Container Statistics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{containers.total_containers || '0'}</div>
            <div style={{ color: '#666' }}>Total Containers</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{containers.available_containers || '0'}</div>
            <div style={{ color: '#666' }}>Available</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb' }}>{containers.booked_containers || '0'}</div>
            <div style={{ color: '#666' }}>Booked</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#7c3aed' }}>{containers.in_transit_containers || '0'}</div>
            <div style={{ color: '#666' }}>In Transit</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{containers.delivered_containers || '0'}</div>
            <div style={{ color: '#666' }}>Delivered</div>
          </div>
        </div>
      </div>

      {/* Booking Statistics */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Booking Statistics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{bookings.total_bookings || '0'}</div>
            <div style={{ color: '#666' }}>Total Bookings</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{bookings.pending_bookings || '0'}</div>
            <div style={{ color: '#666' }}>Pending</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{bookings.approved_bookings || '0'}</div>
            <div style={{ color: '#666' }}>Approved</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#6b7280' }}>{bookings.closed_bookings || '0'}</div>
            <div style={{ color: '#666' }}>Closed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>{bookings.cancelled_bookings || '0'}</div>
            <div style={{ color: '#666' }}>Cancelled</div>
          </div>
        </div>
      </div>

      {/* Shipment Statistics */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Shipment Statistics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{shipments.total_shipments || '0'}</div>
            <div style={{ color: '#666' }}>Total Shipments</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb' }}>{shipments.scheduled_shipments || '0'}</div>
            <div style={{ color: '#666' }}>Scheduled</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#7c3aed' }}>{shipments.in_transit_shipments || '0'}</div>
            <div style={{ color: '#666' }}>In Transit</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{shipments.delivered_shipments || '0'}</div>
            <div style={{ color: '#666' }}>Delivered</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#6b7280' }}>{shipments.closed_shipments || '0'}</div>
            <div style={{ color: '#666' }}>Closed</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Recent Activity</h2>
        {recentActivity && recentActivity.length > 0 ? (
          <div style={{ space: 8 }}>
            {recentActivity.map((activity: any, index: number) => (
              <div key={index} style={{ 
                padding: 12, 
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{activity.title}</div>
                  <div style={{ color: '#666', fontSize: 14 }}>{activity.description}</div>
                </div>
                <div style={{ color: '#666', fontSize: 12 }}>
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#666', padding: 32 }}>
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
}

