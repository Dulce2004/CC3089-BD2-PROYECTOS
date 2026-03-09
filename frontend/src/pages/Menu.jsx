import { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import FormInput from '../components/FormInput';
import {
  getRestaurantes,
  getMenu,
  createArticulo,
  updateArticulo,
  deleteArticulo,
} from '../services/api';

const ITEMS_PER_PAGE = 10;

const emptyForm = {
  nombre: '',
  descripcion: '',
  precio: '',
  categoria: '',
  disponible: true,
};

export default function MenuPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ ...emptyForm });

  // ── Load restaurants on mount ────────────────────────
  useEffect(() => {
    getRestaurantes()
      .then((res) => {
        const data = res.data;
        setRestaurants(Array.isArray(data) ? data : []);
      })
      .catch(() => setRestaurants([]));
  }, []);

  // ── Load menu when restaurant changes ────────────────
  useEffect(() => {
    if (selectedRestaurant) {
      loadMenu(selectedRestaurant);
    } else {
      setMenuItems([]);
    }
    // Reset form state when switching restaurants
    resetFormState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurant]);

  const loadMenu = async (id) => {
    setLoading(true);
    try {
      const res = await getMenu(id);
      const data = res.data;
      setMenuItems(Array.isArray(data) ? data : []);
      setPage(1);
    } catch {
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const resetFormState = () => {
    setForm({ ...emptyForm });
    setShowForm(false);
    setEditingItem(null);
    setMsg('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // ── Create ───────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await createArticulo(selectedRestaurant, {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio: parseFloat(form.precio) || 0,
        categoria: form.categoria,
      });
      setMsg('Menu item created successfully');
      setForm({ ...emptyForm });
      setShowForm(false);
      loadMenu(selectedRestaurant);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error creating menu item');
    }
  };

  // ── Edit: open form with prefilled values ────────────
  const startEditing = (item) => {
    setEditingItem(item);
    setForm({
      nombre: item.nombre || '',
      descripcion: item.descripcion || '',
      precio: item.precio != null ? String(item.precio) : '',
      categoria: item.categoria || '',
      disponible: item.disponible ?? true,
    });
    setShowForm(true);
    setMsg('');
  };

  // ── Update ───────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setMsg('');
    const itemId = editingItem.id || editingItem._id;
    try {
      await updateArticulo(itemId, {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio: parseFloat(form.precio) || 0,
        categoria: form.categoria,
        disponible: form.disponible,
      });
      setMsg('Menu item updated successfully');
      setForm({ ...emptyForm });
      setShowForm(false);
      setEditingItem(null);
      loadMenu(selectedRestaurant);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error updating menu item');
    }
  };

  // ── Delete ───────────────────────────────────────────
  const handleDelete = async (item) => {
    const itemId = item.id || item._id;
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    setMsg('');
    try {
      await deleteArticulo(itemId);
      setMsg('Menu item deleted successfully');
      // If we were editing the deleted item, close the form
      if (editingItem && (editingItem.id || editingItem._id) === itemId) {
        resetFormState();
      }
      loadMenu(selectedRestaurant);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error deleting menu item');
    }
  };

  // ── Open blank create form ───────────────────────────
  const openCreateForm = () => {
    setEditingItem(null);
    setForm({ ...emptyForm });
    setShowForm(true);
    setMsg('');
  };

  // ── Pagination ───────────────────────────────────────
  const safeItems = Array.isArray(menuItems) ? menuItems : [];
  const totalPages = Math.ceil(safeItems.length / ITEMS_PER_PAGE);
  const pageData = safeItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // ── Table columns ────────────────────────────────────
  const columns = [
    { key: 'nombre', label: 'Name' },
    {
      key: 'descripcion',
      label: 'Description',
      render: (r) => (
        <span className="max-w-xs truncate block" title={r.descripcion || ''}>
          {r.descripcion || '-'}
        </span>
      ),
    },
    {
      key: 'precio',
      label: 'Price',
      render: (r) => `Q${(r.precio || 0).toFixed(2)}`,
    },
    { key: 'categoria', label: 'Category' },
    {
      key: 'disponible',
      label: 'Available',
      render: (r) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
            r.disponible
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {r.disponible ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              startEditing(r);
            }}
            className="text-indigo-500 hover:text-indigo-700 p-1 rounded hover:bg-indigo-50 transition-colors"
            title="Edit item"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(r);
            }}
            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
            title="Delete item"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  // ── Render ───────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Menu Items</h2>
        {selectedRestaurant && (
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            Add Item
          </button>
        )}
      </div>

      {/* Flash message */}
      {msg && (
        <div
          className={`p-3 rounded-lg text-sm flex items-center justify-between ${
            msg.includes('Error')
              ? 'bg-red-50 text-red-700'
              : 'bg-green-50 text-green-700'
          }`}
        >
          <span>{msg}</span>
          <button
            onClick={() => setMsg('')}
            className="ml-3 hover:opacity-70"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Restaurant selector */}
      <div className="max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Restaurant
        </label>
        <select
          value={selectedRestaurant}
          onChange={(e) => setSelectedRestaurant(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">-- Choose a restaurant --</option>
          {(Array.isArray(restaurants) ? restaurants : []).map((r) => (
            <option key={r.id || r._id} value={r.id || r._id}>
              {r.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Create / Edit form */}
      {showForm && selectedRestaurant && (
        <form
          onSubmit={editingItem ? handleUpdate : handleCreate}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {editingItem ? 'Edit Menu Item' : 'New Menu Item'}
            </h3>
            <button
              type="button"
              onClick={resetFormState}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Name"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              placeholder="Dish name"
            />
            <FormInput
              label="Category"
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              placeholder="e.g. Entrees, Drinks"
            />
            <FormInput
              label="Price (Q)"
              name="precio"
              type="number"
              value={form.precio}
              onChange={handleChange}
              required
              placeholder="0.00"
            />
            <FormInput
              label="Description"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Short description"
            />
          </div>

          {/* Availability toggle (only shown during edit) */}
          {editingItem && (
            <div className="flex items-center gap-3 pt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="disponible"
                  checked={form.disponible}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
              </label>
              <span className="text-sm font-medium text-gray-700">
                Available
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  form.disponible
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {form.disponible ? 'Yes' : 'No'}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetFormState}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              {editingItem ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      )}

      {/* Content area */}
      {!selectedRestaurant ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-400">
          Select a restaurant to view its menu
        </div>
      ) : loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : safeItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <p className="text-gray-400 mb-3">
            No menu items. Add the first item!
          </p>
          {!showForm && (
            <button
              onClick={openCreateForm}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              + Add the first menu item
            </button>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={pageData}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="No menu items found for this restaurant"
        />
      )}
    </div>
  );
}
