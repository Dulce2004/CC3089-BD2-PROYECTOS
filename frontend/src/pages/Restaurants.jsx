import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Star, Trash2, Edit3, MapPin, Filter, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import FormInput from '../components/FormInput';
import {
  getRestaurantes,
  getRestaurante,
  createRestaurante,
  updateRestaurante,
  deleteRestaurante,
  buscarRestaurantes,
  getRestaurantesPorCategoria,
  getRestaurantesCerca,
  searchRestaurantes,
  getCategorias,
} from '../services/api';

const ITEMS_PER_PAGE = 8;

const SEARCH_MODES = [
  { key: 'name', label: 'By Name', icon: Search },
  { key: 'category', label: 'By Category', icon: Filter },
  { key: 'nearby', label: 'Nearby', icon: MapPin },
];

export default function RestaurantsPage() {
  // ── Data state ───────────────────────────────────────
  const [restaurants, setRestaurants] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // ── Pagination & sorting ─────────────────────────────
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('nombre');

  // ── Create form ──────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    categorias: '',
    lat: '',
    lng: '',
  });

  // ── Search state ─────────────────────────────────────
  const [searchMode, setSearchMode] = useState('name');
  const [searchName, setSearchName] = useState('');
  const [searchCat, setSearchCat] = useState('');
  const [searchNearby, setSearchNearby] = useState({ lat: '', lng: '', dist: '' });

  // ── Edit modal state ─────────────────────────────────
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: '', categorias: '' });

  // ── Helpers ──────────────────────────────────────────
  const safeArray = (val) => (Array.isArray(val) ? val : []);

  const flash = useCallback((text, durationMs = 4000) => {
    setMsg(text);
    setTimeout(() => setMsg(''), durationMs);
  }, []);

  // ── Load all restaurants + categories ────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [restRes, catRes] = await Promise.allSettled([
        getRestaurantes(),
        getCategorias(),
      ]);

      if (restRes.status === 'fulfilled') {
        const d = restRes.value.data;
        setRestaurants(safeArray(d));
      }
      if (catRes.status === 'fulfilled') {
        const cats = restRes.value?.data
          ? catRes.value.data?.categorias_disponibles
          : catRes.value.data?.categorias_disponibles;
        setCategorias(safeArray(cats));
      }
    } catch (err) {
      console.error('loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Create restaurant ────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createRestaurante({
        nombre: form.nombre,
        categorias: form.categorias
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        ubicacion: {
          type: 'Point',
          coordinates: [
            parseFloat(form.lng) || -90.5069,
            parseFloat(form.lat) || 14.6349,
          ],
        },
      });
      flash('Restaurant created successfully');
      setForm({ nombre: '', categorias: '', lat: '', lng: '' });
      setShowForm(false);
      loadData();
    } catch (err) {
      flash(err.response?.data?.error || 'Error creating restaurant');
    }
  };

  // ── Delete restaurant ────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm('Delete this restaurant?')) return;
    try {
      await deleteRestaurante(id);
      flash('Restaurant deleted');
      loadData();
    } catch (err) {
      flash(err.response?.data?.error || 'Error deleting restaurant');
    }
  };

  // ── Open edit modal (fetches single restaurant) ──────
  const openEdit = async (restaurant) => {
    try {
      const id = restaurant.id || restaurant._id;
      const res = await getRestaurante(id);
      const data = res.data || restaurant;
      setEditingId(id);
      setEditForm({
        nombre: data.nombre || '',
        categorias: safeArray(data.categorias).join(', '),
      });
    } catch {
      setEditingId(restaurant.id || restaurant._id);
      setEditForm({
        nombre: restaurant.nombre || '',
        categorias: safeArray(restaurant.categorias).join(', '),
      });
    }
  };

  // ── Save edit ────────────────────────────────────────
  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await updateRestaurante(editingId, {
        nombre: editForm.nombre,
        categorias: editForm.categorias
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
      });
      flash('Restaurant updated successfully');
      setEditingId(null);
      loadData();
    } catch (err) {
      flash(err.response?.data?.error || 'Error updating restaurant');
    }
  };

  // ── Search handlers ──────────────────────────────────
  const handleSearchByName = async () => {
    if (!searchName.trim()) {
      loadData();
      return;
    }
    setLoading(true);
    try {
      const res = await buscarRestaurantes(searchName);
      setRestaurants(safeArray(res.data));
      setPage(1);
    } catch {
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByCategory = async () => {
    if (!searchCat) {
      loadData();
      return;
    }
    setLoading(true);
    try {
      const res = await getRestaurantesPorCategoria(searchCat);
      setRestaurants(safeArray(res.data));
      setPage(1);
    } catch {
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchNearby = async () => {
    const { lat, lng, dist } = searchNearby;
    if (!lat || !lng || !dist) {
      flash('Please fill in latitude, longitude and distance');
      return;
    }
    setLoading(true);
    try {
      const res = await getRestaurantesCerca(
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(dist),
      );
      setRestaurants(safeArray(res.data));
      setPage(1);
    } catch {
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchName('');
    setSearchCat('');
    setSearchNearby({ lat: '', lng: '', dist: '' });
    loadData();
  };

  // ── Form handlers ────────────────────────────────────
  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleEditChange = (e) =>
    setEditForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleNearbyChange = (e) =>
    setSearchNearby((s) => ({ ...s, [e.target.name]: e.target.value }));

  // ── Sorting & pagination ─────────────────────────────
  const sorted = [...restaurants].sort((a, b) => {
    if (sortBy === 'calificacion')
      return (b.calificacion_promedio || 0) - (a.calificacion_promedio || 0);
    return (a.nombre || '').localeCompare(b.nombre || '');
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const pageData = sorted.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  // ── Table columns ────────────────────────────────────
  const columns = [
    { key: 'nombre', label: 'Name' },
    {
      key: 'categorias',
      label: 'Categories',
      render: (r) => (
        <div className="flex gap-1 flex-wrap">
          {safeArray(r.categorias).map((c) => (
            <span
              key={c}
              className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium"
            >
              {c}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'calificacion_promedio',
      label: 'Rating',
      render: (r) => (
        <span className="flex items-center gap-1">
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
          {(r.calificacion_promedio || 0).toFixed(1)}
        </span>
      ),
    },
    {
      key: 'fecha_creacion',
      label: 'Created',
      render: (r) =>
        r.fecha_creacion
          ? new Date(r.fecha_creacion).toLocaleDateString()
          : '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(r);
            }}
            className="text-indigo-500 hover:text-indigo-700 p-1 rounded hover:bg-indigo-50 transition-colors"
            title="Edit"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(r.id || r._id);
            }}
            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
            title="Delete"
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
      {/* ── Top bar ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Restaurants</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          New Restaurant
        </button>
      </div>

      {/* ── Flash message ────────────────────────────── */}
      {msg && (
        <div
          className={`p-3 rounded-lg text-sm flex items-center justify-between ${
            msg.toLowerCase().includes('error')
              ? 'bg-red-50 text-red-700'
              : 'bg-green-50 text-green-700'
          }`}
        >
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="ml-2 hover:opacity-70">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Create form ──────────────────────────────── */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <FormInput
            label="Name"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            required
            placeholder="Restaurant name"
          />
          <FormInput
            label="Categories (comma-separated)"
            name="categorias"
            value={form.categorias}
            onChange={handleChange}
            placeholder="Italian, Pizza, Fast Food"
          />
          <FormInput
            label="Latitude"
            name="lat"
            type="number"
            step="any"
            value={form.lat}
            onChange={handleChange}
            placeholder="14.6349"
          />
          <FormInput
            label="Longitude"
            name="lng"
            type="number"
            step="any"
            value={form.lng}
            onChange={handleChange}
            placeholder="-90.5069"
          />
          <div className="sm:col-span-2 flex justify-end gap-3">
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
              Create
            </button>
          </div>
        </form>
      )}

      {/* ── Search section ───────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        {/* Tab-like mode buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {SEARCH_MODES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSearchMode(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchMode === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}

          {/* Clear search */}
          <button
            onClick={clearSearch}
            className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={12} />
            Clear
          </button>
        </div>

        {/* Search inputs by mode */}
        {searchMode === 'name' && (
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchByName()}
                placeholder="Search by name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handleSearchByName}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
          </div>
        )}

        {searchMode === 'category' && (
          <div className="flex gap-3">
            <select
              value={searchCat}
              onChange={(e) => setSearchCat(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a category...</option>
              {safeArray(categorias).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              onClick={handleSearchByCategory}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Filter
            </button>
          </div>
        )}

        {searchMode === 'nearby' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <FormInput
              label="Latitude"
              name="lat"
              type="number"
              step="any"
              value={searchNearby.lat}
              onChange={handleNearbyChange}
              placeholder="14.6349"
            />
            <FormInput
              label="Longitude"
              name="lng"
              type="number"
              step="any"
              value={searchNearby.lng}
              onChange={handleNearbyChange}
              placeholder="-90.5069"
            />
            <FormInput
              label="Distance (m)"
              name="dist"
              type="number"
              step="any"
              value={searchNearby.dist}
              onChange={handleNearbyChange}
              placeholder="5000"
            />
            <div className="flex items-end">
              <button
                onClick={handleSearchNearby}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
              >
                <MapPin size={14} className="inline mr-1 -mt-0.5" />
                Find Nearby
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Categories pills + Sort toggle ───────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {safeArray(categorias).length > 0 && (
          <div className="flex gap-2 flex-wrap flex-1">
            <span className="text-sm text-gray-500 py-1">Categories:</span>
            {categorias.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setSearchMode('category');
                  setSearchCat(c);
                  // auto-trigger search
                  setLoading(true);
                  getRestaurantesPorCategoria(c)
                    .then((res) => {
                      setRestaurants(safeArray(res.data));
                      setPage(1);
                    })
                    .catch(() => setRestaurants([]))
                    .finally(() => setLoading(false));
                }}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
        >
          <option value="nombre">Sort by Name</option>
          <option value="calificacion">Sort by Rating</option>
        </select>
      </div>

      {/* ── Data table ───────────────────────────────── */}
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
          emptyMessage="No restaurants found"
        />
      )}

      {/* ── Edit modal ───────────────────────────────── */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleEditSave}
            className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-md mx-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Edit Restaurant
              </h3>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <FormInput
              label="Name"
              name="nombre"
              value={editForm.nombre}
              onChange={handleEditChange}
              required
              placeholder="Restaurant name"
            />
            <FormInput
              label="Categories (comma-separated)"
              name="categorias"
              value={editForm.categorias}
              onChange={handleEditChange}
              placeholder="Italian, Pizza, Fast Food"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
