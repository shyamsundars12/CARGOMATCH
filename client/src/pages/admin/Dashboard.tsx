import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface DashboardStats {
  containers: number;
  bookings: number;
  users: number;
  lsps: number;
  traders: number;
  containerTypes: number;
  totalLspRegistrations: number;
  approvedLsps: number;
  totalComplaints: number;
  estimatedRevenue: string;
  activeUsers: number;
  complaintResolutionRate: number;
}

interface ChartData {
  lspStatusData: Array<{ status: string; count: number }>;
  complaintsData: Array<{ status: string; count: number }>;
  monthlyTrends: Array<{ month: string; count: number }>;
  containerTypesData: Array<{ type_name: string; usage_count: number }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, chartsRes] = await Promise.all([
          fetch("/api/admin/dashboard", {
            headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
          }),
          fetch("/api/admin/dashboard/charts", {
            headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
          })
        ]);

        if (!statsRes.ok || !chartsRes.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const [statsData, chartsData] = await Promise.all([
          statsRes.json(),
          chartsRes.json()
        ]);

        setStats(statsData);
        setChartData(chartsData);
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-xl">{error}</div>
      </div>
    );
  }

  if (!stats || !chartData) return null;

  // Chart configurations
  const lspStatusChartData = {
    labels: chartData.lspStatusData.map(item => item.status),
    datasets: [
      {
        label: 'LSP Registrations',
        data: chartData.lspStatusData.map(item => item.count),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // Green for Approved
          'rgba(239, 68, 68, 0.8)', // Red for Rejected
          'rgba(245, 158, 11, 0.8)', // Yellow for Pending
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const complaintsChartData = {
    labels: chartData.complaintsData.map(item => item.status),
    datasets: [
      {
        data: chartData.complaintsData.map(item => item.count),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)', // Red for Open
          'rgba(34, 197, 94, 0.8)', // Green for Resolved
          'rgba(107, 114, 128, 0.8)', // Gray for Closed
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(107, 114, 128, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const monthlyTrendsData = {
    labels: chartData.monthlyTrends.map(item => 
      new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    ),
    datasets: [
      {
        label: 'New Registrations',
        data: chartData.monthlyTrends.map(item => item.count),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const containerTypesData = {
    labels: chartData.containerTypesData.map(item => item.type_name),
    datasets: [
      {
        label: 'Usage Count',
        data: chartData.containerTypesData.map(item => item.usage_count),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Real-time analytics and insights</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <MetricCard
          title="Total LSP Registrations"
          value={stats.totalLspRegistrations}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Approved LSPs"
          value={stats.approvedLsps}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="Total Complaints"
          value={stats.totalComplaints}
          icon="📝"
          color="red"
        />
        <MetricCard
          title="Estimated Revenue"
          value={`$${stats.estimatedRevenue}`}
          icon="💰"
          color="purple"
        />
        <MetricCard
          title="Active Users"
          value={stats.activeUsers}
          icon="👤"
          color="indigo"
        />
        <MetricCard
          title="Resolution Rate"
          value={`${stats.complaintResolutionRate}%`}
          icon="��"
          color="yellow"
        />
      </div>

      {/* Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* LSP Registration Status Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4">LSP Registration Status</h3>
          <Bar data={lspStatusChartData} options={chartOptions} />
        </div>

        {/* Complaints Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Complaints Distribution</h3>
          <Pie data={complaintsChartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Registration Trends Line Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Monthly Registration Trends</h3>
          <Line data={monthlyTrendsData} options={chartOptions} />
        </div>

        {/* Container Types Distribution Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Container Types Usage</h3>
          <Bar data={containerTypesData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

function MetricCard({ title, value, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
    yellow: 'from-yellow-500 to-yellow-600',
  };

  return (
    <div className={`bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} p-6 rounded-xl text-white shadow-lg transform hover:scale-105 transition-transform duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );
} 