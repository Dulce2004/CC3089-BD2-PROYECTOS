import { useEffect, useState } from 'react';
import { Users, Store, ShoppingCart, DollarSign } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import StatCard from '../components/StatCard';
import {
  getRestaurantes,
  getOrdenes,
  getTopPlatillos,
  getTopUsuarios,
} from '../services/api';

const COLORS = ['#6366f1', '#22c55e', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4'];

const STATUS_LABELS = {
  pendiente: 'Pending',
  en_preparacion: 'Preparing',
  en_camino: 'On the way',
  entregada: 'Delivered',
  cancelada: 'Cancelled',
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    restaurants: 0,
    orders: 0,
    revenue: 0,
  });
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [topDishes, setTopDishes] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [restRes, ordRes, dishRes, userRes] = await Promise.allSettled([
        getRestaurantes(),
        getOrdenes(),
        getTopPlatillos(),
        getTopUsuarios(),
      ]);

      const restaurants = restRes.status === 'fulfilled' ? (restRes.value.data || []) : [];
      const orders = ordRes.status === 'fulfilled' ? (ordRes.value.data || []) : [];
      const dishes = dishRes.status === 'fulfilled' ? (dishRes.value.data || []) : [];
      const users = userRes.status === 'fulfilled' ? (userRes.value.data || []) : [];

      // Ensure arrays
      const safeOrders = Array.isArray(orders) ? orders : [];
      const safeRestaurants = Array.isArray(restaurants) ? restaurants : [];
      const safeDishes = Array.isArray(dishes) ? dishes : [];
      const safeUsers = Array.isArray(users) ? users : [];

      // Compute stats
      const revenue = safeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const uniqueUsers = new Set(safeOrders.map((o) => o.usuario_id)).size;

      setStats({
        users: Math.max(uniqueUsers, safeUsers.length, 1),
        restaurants: safeRestaurants.length,
        orders: safeOrders.length,
        revenue,
      });

      // Orders by status
      const statusCount = {};
      safeOrders.forEach((o) => {
        const label = STATUS_LABELS[o.estado] || o.estado;
        statusCount[label] = (statusCount[label] || 0) + 1;
      });
      setOrdersByStatus(
        Object.entries(statusCount).map(([name, value]) => ({ name, value }))
      );

      // Top dishes - extract proper fields from aggregation result
      setTopDishes(
        safeDishes.slice(0, 5).map((d, i) => {
          return {
            name: d.nombre || `Plato ${i + 1}`,
            cantidad: Math.floor(d.cantidad_total || 0),
            ingresos: Math.round((d.ingresos || 0) * 100) / 100,
          };
        })
      );

      // Top users - extract proper fields from aggregation result with lookup
      setTopUsers(
        safeUsers.slice(0, 10).map((u) => ({
          name: u.nombre || u.name || 'Unknown User',
          total: Math.round((u.total_gastado || u.totalSpent || 0) * 100) / 100,
          pedidos: u.cantidad_pedidos || u.orders || 0,
          correo: u.correo || u.email || '—',
        }))
      );
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.users} icon={Users} color="indigo" />
        <StatCard title="Total Restaurants" value={stats.restaurants} icon={Store} color="green" />
        <StatCard title="Total Orders" value={stats.orders} icon={ShoppingCart} color="orange" />
        <StatCard
          title="Total Revenue"
          value={`Q${stats.revenue.toLocaleString('en', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="rose"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Orders by Status</h3>
          {ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {ordersByStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10">No order data available</p>
          )}
        </div>

        {/* Top Dishes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Dishes Sold</h3>
          {topDishes.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {topDishes.map((dish, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{idx + 1}. {dish.name}</div>
                    <div className="text-xs text-gray-600">{dish.cantidad} sold</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-indigo-600">Q{dish.ingresos.toLocaleString('en', { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-10">No data available</p>
          )}
        </div>

        {/* Top Users by Spending */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Users by Spending</h3>
          {topUsers.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {topUsers.map((user, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{idx + 1}. {user.name}</div>
                    <div className="text-sm text-gray-600">{user.correo}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">Q{user.total.toLocaleString('en', { minimumFractionDigits: 2 })}</div>
                    <div className="text-xs text-gray-500">{user.pedidos} orders</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-10">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
