import { useEffect, useState, useCallback } from 'react';
import { Plus, Filter, Trash2, ArrowUpDown, Hash, Zap } from 'lucide-react';
import DataTable from '../components/DataTable';
import FormInput from '../components/FormInput';
import {
  getOrdenes,
  getOrden,
  createOrden,
  updateEstadoOrden,
  deleteOrden,
  countOrdenes,
  updateEstadoMasivo,
  deleteOrdenesMasivo,
  getOrdenesByRestaurante,
  getRestaurantes,
  getMenu,
} from '../services/api';

const ITEMS_PER_PAGE = 8;

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pendiente', label: 'Pending' },
  { value: 'en_preparacion', label: 'Preparing' },
  { value: 'en_camino', label: 'On the way' },
  { value: 'entregada', label: 'Delivered' },
  { value: 'cancelada', label: 'Cancelled' },
];

const STATUS_KEYS = ['pendiente', 'en_preparacion', 'en_camino', 'entregada', 'cancelada'];

const STATUS_COLORS = {
  pendiente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  en_preparacion: 'bg-blue-50 text-blue-700 border-blue-200',
  en_camino: 'bg-purple-50 text-purple-700 border-purple-200',
  entregada: 'bg-green-50 text-green-700 border-green-200',
  cancelada: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_PILL_COLORS = {
  pendiente: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  en_preparacion: 'bg-blue-100 text-blue-800 border border-blue-300',
  en_camino: 'bg-purple-100 text-purple-800 border border-purple-300',
  entregada: 'bg-green-100 text-green-800 border border-green-300',
  cancelada: 'bg-red-100 text-red-800 border border-red-300',
};

const STATUS_LABELS = {
  pendiente: 'Pending',
  en_preparacion: 'Preparing',
  en_camino: 'On the way',
  entregada: 'Delivered',
  cancelada: 'Cancelled',
};

export default function OrdersPage({ user }) {
  // ── Core state ──────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // ── Create form state ───────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [userDirecciones, setUserDirecciones] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [form, setForm] = useState({
    restaurante_id: '',
    direccion_idx: '',
    calle: '',
    zona: '',
    ciudad: '',
  });
  const [selectedItems, setSelectedItems] = useState([]);

  // ── Stats state ─────────────────────────────────────────
  const [statusCounts, setStatusCounts] = useState({});

  // ── Bulk operations state ───────────────────────────────
  const [showBulk, setShowBulk] = useState(false);
  const [bulkFromStatus, setBulkFromStatus] = useState('pendiente');
  const [bulkToStatus, setBulkToStatus] = useState('en_preparacion');
  const [bulkDeleteStatus, setBulkDeleteStatus] = useState('cancelada');
  const [bulkMsg, setBulkMsg] = useState('');

  // ── Order detail state ──────────────────────────────────
  const [detailOrder, setDetailOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // ── View by restaurant state ────────────────────────────
  const [restFilterId, setRestFilterId] = useState('');
  const [restOrders, setRestOrders] = useState([]);
  const [restOrdersLoading, setRestOrdersLoading] = useState(false);
  const [restPage, setRestPage] = useState(1);

  // ── Load orders ─────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrdenes();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load status counts ──────────────────────────────────
  const loadStatusCounts = useCallback(async () => {
    const counts = {};
    try {
      const allRes = await countOrdenes('');
      counts.all = allRes.data?.total_ordenes ?? 0;
    } catch {
      counts.all = 0;
    }
    for (const status of STATUS_KEYS) {
      try {
        const res = await countOrdenes(status);
        counts[status] = res.data?.total_ordenes ?? 0;
      } catch {
        counts[status] = 0;
      }
    }
    setStatusCounts(counts);
  }, []);

  // ── Initial load ────────────────────────────────────────
  useEffect(() => {
    loadOrders();
    loadStatusCounts();
    getRestaurantes()
      .then((res) => setRestaurants(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRestaurants([]));
    
    // Load user addresses if user object is available
    if (user && user.direcciones && Array.isArray(user.direcciones)) {
      setUserDirecciones(user.direcciones);
    }
  }, [loadOrders, loadStatusCounts, user]);

  // ── Load menu when restaurant selected ──────────────────
  useEffect(() => {
    if (form.restaurante_id) {
      setMenuLoading(true);
      getMenu(form.restaurante_id)
        .then((res) => {
          const data = res.data;
          setMenuItems(Array.isArray(data) ? data : []);
        })
        .catch(() => setMenuItems([]))
        .finally(() => setMenuLoading(false));
    } else {
      setMenuItems([]);
    }
    setSelectedItems([]);
  }, [form.restaurante_id]);

  // ── Load restaurant orders ──────────────────────────────
  useEffect(() => {
    if (!restFilterId) {
      setRestOrders([]);
      return;
    }
    setRestOrdersLoading(true);
    getOrdenesByRestaurante(restFilterId)
      .then((res) => setRestOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRestOrders([]))
      .finally(() => setRestOrdersLoading(false));
    setRestPage(1);
  }, [restFilterId]);

  // ── Helpers ─────────────────────────────────────────────
  const clearMsg = () => setTimeout(() => setMsg(''), 5000);

  const refreshAll = () => {
    loadOrders();
    loadStatusCounts();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    
    // If user selects a saved address, populate fields
    if (name === 'direccion_idx' && value !== '') {
      const idx = parseInt(value);
      if (userDirecciones[idx]) {
        const addr = userDirecciones[idx];
        setForm((f) => ({
          ...f,
          calle: addr.calle || '',
          zona: (addr.zona || '').toString(),
          ciudad: addr.ciudad || '',
        }));
      }
    }
  };

  const toggleMenuItem = (item) => {
    setSelectedItems((prev) => {
      const exists = prev.find((si) => si.id === item.id);
      if (exists) return prev.filter((si) => si.id !== item.id);
      return [...prev, { ...item, cantidad: 1 }];
    });
  };

  const updateItemQty = (id, qty) => {
    setSelectedItems((prev) =>
      prev.map((si) => (si.id === id ? { ...si, cantidad: qty } : si))
    );
  };

  // ── Create order (POST /ordenes) ────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const items = selectedItems
        .filter((si) => si.cantidad > 0)
        .map((si) => ({
          articulo_id: si.id,
          nombre: si.nombre,
          cantidad: parseInt(si.cantidad),
          precio_unitario: si.precio,
        }));

      if (items.length === 0) {
        setMsg('Error: Select at least one item');
        return;
      }

      await createOrden({
        usuario_id: user?.id || '',
        restaurante_id: form.restaurante_id,
        items,
        direccion_entrega: {
          calle: form.calle,
          zona: parseInt(form.zona) || 1,
          ciudad: form.ciudad || 'Guatemala',
          coordenadas: '',
        },
      });

      setMsg('Order created successfully');
      setShowForm(false);
      setSelectedItems([]);
      setForm({ restaurante_id: '', direccion_idx: '', calle: '', zona: '', ciudad: '' });
      refreshAll();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error creating order');
    }
    clearMsg();
  };

  // ── View single order (GET /ordenes/:id) ────────────────
  const handleViewDetail = async (orderId) => {
    try {
      const res = await getOrden(orderId);
      setDetailOrder(res.data || null);
      setShowDetail(true);
    } catch {
      setMsg('Error: Could not load order details');
      clearMsg();
    }
  };

  // ── Update status (PUT /ordenes/:id/estado) ─────────────
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateEstadoOrden(orderId, newStatus);
      refreshAll();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error updating status');
      clearMsg();
    }
  };

  // ── Delete order (DELETE /ordenes/:id) ──────────────────
  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await deleteOrden(orderId);
      setMsg('Order deleted successfully');
      refreshAll();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error deleting order');
    }
    clearMsg();
  };

  // ── Bulk status update (PUT /ordenes/estado-masivo) ─────
  const handleBulkStatusUpdate = async () => {
    setBulkMsg('');
    if (bulkFromStatus === bulkToStatus) {
      setBulkMsg('Error: Source and target status must be different');
      return;
    }
    try {
      const res = await updateEstadoMasivo({
        estado_actual: bulkFromStatus,
        nuevo_estado: bulkToStatus,
      });
      const count = res.data?.modificadas ?? res.data?.matched ?? '?';
      setBulkMsg(`${count} orders updated from ${STATUS_LABELS[bulkFromStatus]} to ${STATUS_LABELS[bulkToStatus]}`);
      refreshAll();
    } catch (err) {
      setBulkMsg(err.response?.data?.error || 'Error in bulk status update');
    }
  };

  // ── Bulk delete (DELETE /ordenes/masivo?estado=) ────────
  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ALL orders with status "${STATUS_LABELS[bulkDeleteStatus]}"? This cannot be undone.`)) return;
    setBulkMsg('');
    try {
      const res = await deleteOrdenesMasivo(bulkDeleteStatus);
      const count = res.data?.eliminadas ?? '?';
      setBulkMsg(res.data?.message || `${count} orders deleted`);
      refreshAll();
    } catch (err) {
      setBulkMsg(err.response?.data?.error || 'Error in bulk delete');
    }
  };

  // ── Filter and sort ─────────────────────────────────────
  const filtered = (orders || []).filter((o) => !filter || o?.estado === filter);
  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a?.fecha_pedido || 0);
    const db = new Date(b?.fecha_pedido || 0);
    return sortDesc ? db - da : da - db;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const pageData = sorted.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // ── Restaurant orders pagination ────────────────────────
  const restSorted = [...(restOrders || [])].sort((a, b) => {
    const da = new Date(a?.fecha_pedido || 0);
    const db = new Date(b?.fecha_pedido || 0);
    return db - da;
  });
  const restTotalPages = Math.max(1, Math.ceil(restSorted.length / ITEMS_PER_PAGE));
  const restPageData = restSorted.slice(
    (restPage - 1) * ITEMS_PER_PAGE,
    restPage * ITEMS_PER_PAGE
  );

  // ── Table columns ───────────────────────────────────────
  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetail(r.id);
          }}
          className="font-mono text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
          title="View order details"
        >
          {(r.id || '').slice(-8)}
        </button>
      ),
    },
    {
      key: 'estado',
      label: 'Status',
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            STATUS_COLORS[r.estado] || 'bg-gray-100 text-gray-700'
          }`}
        >
          {STATUS_LABELS[r.estado] || r.estado}
        </span>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      render: (r) => (Array.isArray(r.items) ? r.items : []).length,
    },
    {
      key: 'total',
      label: 'Total',
      render: (r) => `Q${(r.total ?? 0).toFixed(2)}`,
    },
    {
      key: 'fecha_pedido',
      label: 'Date',
      render: (r) =>
        r.fecha_pedido
          ? new Date(r.fecha_pedido).toLocaleDateString()
          : '-',
    },
    {
      key: 'actions_status',
      label: 'Update Status',
      render: (r) => (
        <select
          value={r.estado || ''}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => handleStatusChange(r.id, e.target.value)}
          className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {STATUS_OPTIONS.filter((s) => s.value).map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'actions_delete',
      label: 'Delete',
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(r.id);
          }}
          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete order"
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ];

  const restColumns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (r) => (
        <span className="font-mono text-xs">{(r.id || '').slice(-8)}</span>
      ),
    },
    {
      key: 'estado',
      label: 'Status',
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            STATUS_COLORS[r.estado] || 'bg-gray-100 text-gray-700'
          }`}
        >
          {STATUS_LABELS[r.estado] || r.estado}
        </span>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      render: (r) => (Array.isArray(r.items) ? r.items : []).length,
    },
    {
      key: 'total',
      label: 'Total',
      render: (r) => `Q${(r.total ?? 0).toFixed(2)}`,
    },
    {
      key: 'fecha_pedido',
      label: 'Date',
      render: (r) =>
        r.fecha_pedido
          ? new Date(r.fecha_pedido).toLocaleDateString()
          : '-',
    },
  ];

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulk(!showBulk)}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Zap size={16} />
            Bulk Ops
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            New Order
          </button>
        </div>
      </div>

      {/* ── Global message ─────────────────────────────── */}
      {msg && (
        <div
          className={`p-3 rounded-lg text-sm ${
            msg.includes('Error')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {msg}
        </div>
      )}

      {/* ── 1. Stats Bar ───────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
          <Hash size={12} />
          All: {statusCounts.all ?? '-'}
        </div>
        {STATUS_KEYS.map((key) => (
          <div
            key={key}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${STATUS_PILL_COLORS[key]}`}
          >
            {STATUS_LABELS[key]}: {statusCounts[key] ?? '-'}
          </div>
        ))}
      </div>

      {/* ── 2. Create Order Form ───────────────────────── */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-800">Create New Order</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant
              </label>
              <select
                name="restaurante_id"
                value={form.restaurante_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select restaurant...</option>
                {(restaurants || []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Saved addresses selector */}
            {userDirecciones.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saved Addresses
                </label>
                <select
                  name="direccion_idx"
                  value={form.direccion_idx}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Or use saved address...</option>
                  {userDirecciones.map((addr, idx) => (
                    <option key={idx} value={idx}>
                      {addr.calle}, Z.{addr.zona}, {addr.ciudad}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <FormInput
              label="Street"
              name="calle"
              value={form.calle}
              onChange={handleChange}
              placeholder="Delivery address"
              required
            />
            <FormInput
              label="Zone"
              name="zona"
              type="number"
              value={form.zona}
              onChange={handleChange}
              placeholder="1"
              min="1"
            />
            <FormInput
              label="City"
              name="ciudad"
              value={form.ciudad}
              onChange={handleChange}
              placeholder="Guatemala"
            />
          </div>

          {/* Menu item selection */}
          {form.restaurante_id && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Select Items
              </h4>
              {menuLoading ? (
                <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
                  <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                  Loading menu...
                </div>
              ) : menuItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {menuItems.map((item) => {
                    const selected = selectedItems.find(
                      (si) => si.id === item.id
                    );
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                          selected
                            ? 'border-indigo-300 bg-indigo-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleMenuItem(item)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.nombre}</p>
                          <p className="text-gray-500 text-xs">
                            Q{(item.precio ?? 0).toFixed(2)}
                          </p>
                        </div>
                        {selected && (
                          <input
                            type="number"
                            min="1"
                            value={selected.cantidad}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              updateItemQty(item.id, e.target.value)
                            }
                            className="w-14 text-center border border-gray-300 rounded px-1 py-0.5 text-xs"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  This restaurant has no menu items yet. Go to the{' '}
                  <strong>Menu</strong> page to add items first.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Create Order
            </button>
          </div>
        </form>
      )}

      {/* ── 3. Bulk Operations Panel ───────────────────── */}
      {showBulk && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Zap size={18} className="text-indigo-600" />
            Bulk Operations
          </h3>

          {bulkMsg && (
            <div
              className={`p-3 rounded-lg text-sm ${
                bulkMsg.includes('Error')
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}
            >
              {bulkMsg}
            </div>
          )}

          {/* Bulk status update */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Bulk Status Update
            </h4>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  From Status
                </label>
                <select
                  value={bulkFromStatus}
                  onChange={(e) => setBulkFromStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {STATUS_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {STATUS_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-gray-400 pb-2">
                <ArrowUpDown size={16} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  To Status
                </label>
                <select
                  value={bulkToStatus}
                  onChange={(e) => setBulkToStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {STATUS_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {STATUS_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleBulkStatusUpdate}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <ArrowUpDown size={14} />
                Update All
              </button>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Bulk delete */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Bulk Delete by Status
            </h4>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Status to Delete
                </label>
                <select
                  value={bulkDeleteStatus}
                  onChange={(e) => setBulkDeleteStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {STATUS_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {STATUS_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <Trash2 size={14} />
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Filter / Sort Bar ───────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setSortDesc(!sortDesc)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 px-3 py-2 rounded-lg transition-colors"
        >
          <ArrowUpDown size={14} />
          Date: {sortDesc ? 'Newest First' : 'Oldest First'}
        </button>
        <span className="text-xs text-gray-400 ml-auto">
          {sorted.length} order{sorted.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* ── 5. Orders Table ────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={pageData}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="No orders found"
        />
      )}

      {/* ── Order Detail Modal ─────────────────────────── */}
      {showDetail && detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Order Detail
                </h3>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  x
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID</span>
                  <span className="font-mono text-xs">
                    {detailOrder.id || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_COLORS[detailOrder.estado] ||
                      'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {STATUS_LABELS[detailOrder.estado] || detailOrder.estado}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total</span>
                  <span className="font-semibold">
                    Q{(detailOrder.total ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span>
                    {detailOrder.fecha_pedido
                      ? new Date(detailOrder.fecha_pedido).toLocaleString()
                      : '-'}
                  </span>
                </div>

                {/* Delivery address */}
                {detailOrder.direccion_entrega && (
                  <div>
                    <span className="text-gray-500 block mb-1">
                      Delivery Address
                    </span>
                    <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                      <p>
                        {detailOrder.direccion_entrega.calle || '-'}
                      </p>
                      <p>
                        Zone {detailOrder.direccion_entrega.zona || '-'},{' '}
                        {detailOrder.direccion_entrega.ciudad || '-'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Items */}
                <div>
                  <span className="text-gray-500 block mb-1">Items</span>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {(Array.isArray(detailOrder.items)
                      ? detailOrder.items
                      : []
                    ).length > 0 ? (
                      (detailOrder.items || []).map((item, idx) => (
                        <div
                          key={item.articulo_id || idx}
                          className="flex justify-between text-xs"
                        >
                          <span>
                            {item.nombre || 'Item'} x{item.cantidad ?? 1}
                          </span>
                          <span className="text-gray-600">
                            Q{((item.precio_unitario ?? 0) * (item.cantidad ?? 1)).toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No items</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowDetail(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. View by Restaurant ──────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          View Orders by Restaurant
        </h3>
        <p className="text-xs text-gray-400">
          Public endpoint -- no authentication required
        </p>
        <div className="flex items-center gap-3">
          <select
            value={restFilterId}
            onChange={(e) => setRestFilterId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a restaurant...</option>
            {(restaurants || []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
          {restFilterId && (
            <span className="text-xs text-gray-400">
              {restSorted.length} order{restSorted.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {restFilterId && (
          restOrdersLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin h-6 w-6 border-3 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <DataTable
              columns={restColumns}
              data={restPageData}
              page={restPage}
              totalPages={restTotalPages}
              onPageChange={setRestPage}
              emptyMessage="No orders for this restaurant"
            />
          )
        )}
      </div>
    </div>
  );
}
