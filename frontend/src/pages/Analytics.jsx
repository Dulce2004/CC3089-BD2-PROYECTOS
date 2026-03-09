import { useEffect, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import {
  getTopPlatillos,
  getTopUsuarios,
  getOrdenes,
  getRestaurantes,
  countOrdenes,
} from '../services/api';

const COLORS = ['#6366f1', '#22c55e', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

const STATUS_LABELS = {
  pendiente: 'Pending',
  en_preparacion: 'Preparing',
  en_camino: 'On the way',
  entregada: 'Delivered',
  cancelada: 'Cancelled',
};

const STATUS_KEYS = ['pendiente', 'en_preparacion', 'en_camino', 'entregada', 'cancelada'];

export default function AnalyticsPage() {
  const [topDishes, setTopDishes] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [revenueByRestaurant, setRevenueByRestaurant] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      // Load main data
      const [dishRes, userRes, ordRes, restRes] = await Promise.allSettled([
        getTopPlatillos(),
        getTopUsuarios(),
        getOrdenes(),
        getRestaurantes(),
      ]);

      // Load counts per status
      const countPromises = STATUS_KEYS.map((s) =>
        countOrdenes(s)
          .then((r) => ({ estado: s, total: r.data?.total_ordenes || 0 }))
          .catch(() => ({ estado: s, total: 0 }))
      );
      const totalRes = await countOrdenes('').catch(() => ({ data: { total_ordenes: 0 } }));
      const counts = await Promise.all(countPromises);

      const countMap = {};
      counts.forEach((c) => { countMap[c.estado] = c.total; });
      setStatusCounts(countMap);
      setTotalCount(totalRes.data?.total_ordenes || 0);

      // Top dishes
      const rawDishes = dishRes.status === 'fulfilled' ? dishRes.value.data : [];
      setTopDishes(
        (Array.isArray(rawDishes) ? rawDishes : []).map((d, i) => ({
          name: d._id?.articulo ? `Dish ${i + 1}` : `Dish ${i + 1}`,
          cantidad: d.cantidad_total || 0,
          ingresos: d.ingresos || 0,
        }))
      );

      // Top users
      const rawUsers = userRes.status === 'fulfilled' ? userRes.value.data : [];
      setTopUsers(
        (Array.isArray(rawUsers) ? rawUsers : []).map((u) => ({
          name: u.nombre || 'Unknown',
          total: u.total_gastado || 0,
          pedidos: u.cantidad_pedidos || 0,
        }))
      );

      // Orders by status
      const rawOrders = ordRes.status === 'fulfilled' ? ordRes.value.data : [];
      const orders = Array.isArray(rawOrders) ? rawOrders : [];
      const statusCount = {};
      orders.forEach((o) => {
        const label = STATUS_LABELS[o.estado] || o.estado;
        statusCount[label] = (statusCount[label] || 0) + 1;
      });
      setOrdersByStatus(
        Object.entries(statusCount).map(([name, value]) => ({ name, value }))
      );

      // Revenue by restaurant
      const rawRestaurants = restRes.status === 'fulfilled' ? restRes.value.data : [];
      const restaurants = Array.isArray(rawRestaurants) ? rawRestaurants : [];
      const restMap = {};
      restaurants.forEach((r) => { restMap[r.id] = r.nombre; });

      const revMap = {};
      orders.forEach((o) => {
        const name = restMap[o.restaurante_id] || (o.restaurante_id || '').slice(-6);
        revMap[name] = (revMap[name] || 0) + (o.total || 0);
      });
      setRevenueByRestaurant(
        Object.entries(revMap)
          .map(([name, revenue]) => ({ name, revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10)
      );
    } catch (err) {
      console.error('Analytics error:', err);
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
      <h2 className="text-2xl font-bold text-gray-800">Analytics</h2>
      <p className="text-sm text-gray-500">
        Data visualizations powered by MongoDB aggregation pipelines
      </p>

      {/* Order Count Stats (uses GET /ordenes/count) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Order Counts</h3>
        <p className="text-xs text-gray-400 mb-4">Endpoint: GET /ordenes/count?estado= &mdash; uses CountDocuments</p>
        <div className="flex flex-wrap gap-3">
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-center min-w-[100px]">
            <p className="text-2xl font-bold text-gray-800">{totalCount}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          {STATUS_KEYS.map((s) => {
            const colorMap = {
              pendiente: 'bg-yellow-50 text-yellow-700',
              en_preparacion: 'bg-blue-50 text-blue-700',
              en_camino: 'bg-purple-50 text-purple-700',
              entregada: 'bg-green-50 text-green-700',
              cancelada: 'bg-red-50 text-red-700',
            };
            return (
              <div key={s} className={`rounded-lg px-4 py-3 text-center min-w-[100px] ${colorMap[s] || 'bg-gray-50'}`}>
                <p className="text-2xl font-bold">{statusCounts[s] || 0}</p>
                <p className="text-xs">{STATUS_LABELS[s]}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Dishes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Top Selling Dishes</h3>
          <p className="text-xs text-gray-400 mb-4">Pipeline: $match(entregada) &rarr; $unwind(items) &rarr; $group &rarr; $sort &rarr; $limit(5)</p>
          {topDishes.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topDishes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cantidad" fill="#6366f1" name="Qty Sold" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ingresos" fill="#22c55e" name="Revenue (Q)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10">No data available</p>
          )}
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Orders by Status</h3>
          <p className="text-xs text-gray-400 mb-4">Client-side grouping from GET /ordenes</p>
          {ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
            <p className="text-gray-400 text-center py-10">No data available</p>
          )}
        </div>

        {/* Top Users by Spending */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Top Users by Spending</h3>
          <p className="text-xs text-gray-400 mb-4">Pipeline: $match(entregada) &rarr; $group &rarr; $sort &rarr; $limit(10) &rarr; $lookup(usuarios) &rarr; $project</p>
          {topUsers.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topUsers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(val) => `Q${val.toFixed(2)}`} />
                <Bar dataKey="total" fill="#f97316" name="Total Spent (Q)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10">No data available</p>
          )}
        </div>

        {/* Revenue by Restaurant */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Revenue by Restaurant</h3>
          <p className="text-xs text-gray-400 mb-4">Client-side: $group by restaurante_id, $sum total</p>
          {revenueByRestaurant.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByRestaurant}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip formatter={(val) => `Q${val.toFixed(2)}`} />
                <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue (Q)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10">No data available</p>
          )}
        </div>
      </div>

      {/* MongoDB Concepts Reference */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">MongoDB Features Demonstrated</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-gray-600">
          <div className="bg-white p-3 rounded-lg border border-gray-100">
            <p className="font-semibold text-gray-800 mb-1">Aggregation Pipelines</p>
            <p>$match, $unwind, $group, $sort, $limit, $lookup, $project — used in top-platillos and top-usuarios</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-100">
            <p className="font-semibold text-gray-800 mb-1">Indices</p>
            <p>Unique (correo), Compound (restaurante_id + fecha), Multikey (categorias[]), 2dsphere (ubicacion)</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-100">
            <p className="font-semibold text-gray-800 mb-1">Transactions</p>
            <p>Reviews use a multi-document transaction: insert review + mark order + recalculate average rating</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-100">
            <p className="font-semibold text-gray-800 mb-1">GridFS</p>
            <p>File storage split into fs.files (metadata) and fs.chunks (255KB binary chunks)</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-100">
            <p className="font-semibold text-gray-800 mb-1">BulkWrite</p>
            <p>Mass insertion of orders using MongoDB BulkWrite for volume testing</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-100">
            <p className="font-semibold text-gray-800 mb-1">CRUD Operations</p>
            <p>InsertOne, Find, FindOne, UpdateOne, UpdateMany, DeleteOne, DeleteMany, CountDocuments</p>
          </div>
        </div>
      </div>
    </div>
  );
}
