import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Simple bar chart component
const BarChart = ({ data, labels, color = '#FF7300', height = 200 }) => {
  const maxValue = Math.max(...data, 1);
  return (
    <div className="relative" style={{ height: `${height}px` }}>
      <div className="flex items-end justify-between h-full gap-1">
        {data.map((value, index) => {
          const barHeight = (value / maxValue) * 100;
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="w-full rounded-t transition-all duration-500"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: color,
                  minHeight: '2px',
                }}
              ></div>
              <span className="text-text-muted text-[8px] mt-1 truncate max-w-full">
                {labels[index] || ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Simple line chart using SVG
const LineChart = ({ data, labels, color = '#FF7300', height = 200 }) => {
  const maxValue = Math.max(...data, 1);
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * 100;
    const y = 100 - (value / maxValue) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative" style={{ height: `${height}px` }}>
      <svg width="100%" height="100%" viewBox={`0 0 100 100`} preserveAspectRatio="none">
        {/* Grid lines */}
        <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Area under line */}
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={`${color}20`}
        />
        {/* Points */}
        {data.map((value, index) => {
          const x = (index / (data.length - 1 || 1)) * 100;
          const y = 100 - (value / maxValue) * 100;
          return (
            <circle key={index} cx={x} cy={y} r="2" fill={color} />
          );
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {labels.map((label, index) => (
          <span key={index} className="text-text-muted text-[8px]">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
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

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Total stats
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

      // Revenue by day
      const revenueByDay = {};
      const ordersByDay = {};
      orders?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        ordersByDay[date] = (ordersByDay[date] || 0) + 1;
        if (order.status === 'completed' || order.status === 'verified') {
          revenueByDay[date] = (revenueByDay[date] || 0) + (order.value_ngn || 0);
        }
      });

      // Users by day
      const usersByDay = {};
      const { data: users } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());
      users?.forEach(user => {
        const date = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        usersByDay[date] = (usersByDay[date] || 0) + 1;
      });

      // Sort dates
      const sortedDates = Object.keys(revenueByDay).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
      });

      // Top assets
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
          labels: sortedDates.slice(-14), // show last 14 days for cleaner chart
          values: sortedDates.slice(-14).map(date => revenueByDay[date] || 0),
        },
        ordersData: {
          labels: sortedDates.slice(-14),
          values: sortedDates.slice(-14).map(date => ordersByDay[date] || 0),
        },
        usersData: {
          labels: Object.keys(usersByDay).sort((a, b) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateA - dateB;
          }).slice(-14),
          values: Object.values(usersByDay).slice(-14),
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
          <h3 className="font-bold text-lg mb-2">Revenue (Last 14 Days)</h3>
          <div className="h-48">
            <LineChart
              data={stats.revenueData.values}
              labels={stats.revenueData.labels}
              color="#FF7300"
              height={180}
            />
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-bg-card rounded-2xl p-6 border border-border">
          <h3 className="font-bold text-lg mb-2">Orders (Last 14 Days)</h3>
          <div className="h-48">
            <BarChart
              data={stats.ordersData.values}
              labels={stats.ordersData.labels}
              color="#4E1F91"
              height={180}
            />
          </div>
        </div>

        {/* Users Chart */}
        <div className="bg-bg-card rounded-2xl p-6 border border-border">
          <h3 className="font-bold text-lg mb-2">New Users (Last 14 Days)</h3>
          <div className="h-48">
            <LineChart
              data={stats.usersData.values}
              labels={stats.usersData.labels}
              color="#2ECC71"
              height={180}
            />
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
