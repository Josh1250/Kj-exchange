import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Color palette (matching your brand)
const colors = {
  purple: '#4E1F91',
  purpleLight: '#7B3FBF',
  orange: '#FF7300',
  orangeLight: '#FF9A44',
  green: '#2ECC71',
  red: '#E74C3C',
  blue: '#3498DB',
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#B8B0C9',
        font: { size: 12, family: 'Inter' },
      },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#7A728F' },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#7A728F' },
    },
  },
};

export default function AdminCharts() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    pendingOrders: 0,
    revenueData: { labels: [], values: [] },
    ordersData: { labels: [], values: [] },
    usersData: { labels: [], values: [] },
    topAssets: [],
  });

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      setLoading(true);

      // Get date range for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // 1. Total Stats
      const { data: orders, count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact' });

      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

      const totalRevenue = orders?.reduce((sum, o) => {
        if (o.status === 'completed' || o.status === 'verified') {
          return sum + (o.value_ngn || 0);
        }
        return sum;
      }, 0) || 0;

      // 2. Revenue by day (last 30 days)
      const revenueByDay = {};
      const ordersByDay = {};
      const usersByDay = {};

      // Revenue + Orders by day
      orders?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        ordersByDay[date] = (ordersByDay[date] || 0) + 1;
        if (order.status === 'completed' || order.status === 'verified') {
          revenueByDay[date] = (revenueByDay[date] || 0) + (order.value_ngn || 0);
        }
      });

      // Users by day (last 30 days)
      const { data: users } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());

      users?.forEach(user => {
        const date = new Date(user.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        usersByDay[date] = (usersByDay[date] || 0) + 1;
      });

      // Sort by date
      const sortedDates = Object.keys(revenueByDay).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
      });

      // 3. Top Assets
      const assetMap = {};
      orders?.forEach(order => {
        if (order.status === 'completed' || order.status === 'verified') {
          assetMap[order.asset] = (assetMap[order.asset] || 0) + (order.value_ngn || 0);
        }
      });
      const topAssets = Object.entries(assetMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

      setStats({
        totalRevenue,
        totalOrders: totalOrders || 0,
        totalUsers: totalUsers || 0,
        pendingOrders,
        revenueData: {
          labels: sortedDates,
          values: sortedDates.map(date => revenueByDay[date] || 0),
        },
        ordersData: {
          labels: sortedDates,
          values: sortedDates.map(date => ordersByDay[date] || 0),
        },
        usersData: {
          labels: Object.keys(usersByDay).sort((a, b) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateA - dateB;
          }),
          values: Object.values(usersByDay),
        },
        topAssets,
      });
    } catch (err) {
      console.error('Error fetching chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-orange"></i>
        <span className="ml-3 text-text-muted">Loading analytics...</span>
      </div>
    );
  }

  // Revenue Chart Data
  const revenueChartData = {
    labels: stats.revenueData.labels,
    datasets: [
      {
        label: 'Revenue (₦)',
        data: stats.revenueData.values,
        borderColor: colors.orange,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(255, 115, 0, 0.3)');
          gradient.addColorStop(1, 'rgba(255, 115, 0, 0.01)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: colors.orange,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  // Orders Chart Data
  const ordersChartData = {
    labels: stats.ordersData.labels,
    datasets: [
      {
        label: 'Orders',
        data: stats.ordersData.values,
        backgroundColor: 'rgba(78, 31, 145, 0.6)',
        borderColor: colors.purple,
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  // Users Chart Data
  const usersChartData = {
    labels: stats.usersData.labels,
    datasets: [
      {
        label: 'New Users',
        data: stats.usersData.values,
        borderColor: colors.green,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(46, 204, 113, 0.3)');
          gradient.addColorStop(1, 'rgba(46, 204, 113, 0.01)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: colors.green,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-card rounded-xl p-4 border border-border">
          <p className="text-text-muted text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-orange">₦{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-bg-card rounded-xl p-4 border border-border">
          <p className="text-text-muted text-sm">Total Orders</p>
          <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
        </div>
        <div className="bg-bg-card rounded-xl p-4 border border-border">
          <p className="text-text-muted text-sm">Total Users</p>
          <p className="text-2xl font-bold text-green-400">{stats.totalUsers}</p>
        </div>
        <div className="bg-bg-card rounded-xl p-4 border border-border">
          <p className="text-text-muted text-sm">Pending Orders</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.pendingOrders}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-bg-card rounded-2xl p-6 border border-border">
          <h3 className="font-bold text-lg mb-2">Revenue (30 Days)</h3>
          <div className="h-64">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-bg-card rounded-2xl p-6 border border-border">
          <h3 className="font-bold text-lg mb-2">Orders (30 Days)</h3>
          <div className="h-64">
            <Bar data={ordersChartData} options={chartOptions} />
          </div>
        </div>

        {/* Users Chart */}
        <div className="bg-bg-card rounded-2xl p-6 border border-border">
          <h3 className="font-bold text-lg mb-2">New Users (30 Days)</h3>
          <div className="h-64">
            <Line data={usersChartData} options={chartOptions} />
          </div>
        </div>

        {/* Top Assets */}
        <div className="bg-bg-card rounded-2xl p-6 border border-border">
          <h3 className="font-bold text-lg mb-2">Top Assets by Volume</h3>
          {stats.topAssets.length === 0 ? (
            <p className="text-text-muted text-sm">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.topAssets.map((asset, idx) => {
                const colors = ['#f7931a', '#627eea', '#26a17b', '#9945FF', '#FF7300'];
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></div>
                    <span className="font-medium flex-1">{asset.name}</span>
                    <span className="text-text-muted text-sm">₦{asset.value.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
