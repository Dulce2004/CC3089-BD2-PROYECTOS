import { useEffect, useState, useCallback } from 'react';
import { Star, Plus, MessageSquare } from 'lucide-react';
import FormInput from '../components/FormInput';
import {
  getRestaurantes,
  getOrdenesByRestaurante,
  createResena,
  getResenasPorRestaurante,
} from '../services/api';

export default function ReviewsPage({ user }) {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [orders, setOrders] = useState([]);
  const [resenas, setResenas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [submitting, setSubmitting] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingResenas, setLoadingResenas] = useState(false);
  const [form, setForm] = useState({
    pedido_id: '',
    calificacion: 5,
    comentario: '',
  });

  // ── Load restaurants on mount ──────────────────────────
  useEffect(() => {
    getRestaurantes()
      .then((res) => {
        const data = res?.data;
        setRestaurants(Array.isArray(data) ? data : []);
      })
      .catch(() => setRestaurants([]));
  }, []);

  // ── Load orders when restaurant changes ────────────────
  const loadOrders = useCallback(async (id) => {
    if (!id) {
      setOrders([]);
      setResenas([]);
      return;
    }
    setLoadingOrders(true);
    setLoadingResenas(true);
    try {
      const [ordRes, resRes] = await Promise.all([
        getOrdenesByRestaurante(id).catch(() => null),
        getResenasPorRestaurante(id).catch(() => null),
      ]);
      const ordData = ordRes?.data;
      const resData = resRes?.data;
      setOrders(Array.isArray(ordData) ? ordData : []);
      setResenas(Array.isArray(resData) ? resData : []);
    } catch {
      setOrders([]);
      setResenas([]);
    } finally {
      setLoadingOrders(false);
      setLoadingResenas(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      loadOrders(selectedRestaurant);
    } else {
      setOrders([]);
    }
  }, [selectedRestaurant, loadOrders]);

  // ── Derived data ───────────────────────────────────────
  const deliveredOrders = Array.isArray(orders)
    ? orders.filter((o) => o && o.estado === 'entregada')
    : [];

  const reviewableOrders = deliveredOrders.filter((o) => o.resenado !== true);

  const selectedRestaurantObj = Array.isArray(restaurants)
    ? restaurants.find((r) => r.id === selectedRestaurant)
    : null;

  // ── Handlers ───────────────────────────────────────────
  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleRestaurantChange = (e) => {
    const val = e.target.value;
    setSelectedRestaurant(val);
    setForm((f) => ({ ...f, pedido_id: '' }));
  };

  const handleStarClick = (val) => {
    setForm((f) => ({ ...f, calificacion: val }));
  };

  const selectOrderForReview = (order) => {
    if (!order || order.resenado === true) return;
    setForm((f) => ({ ...f, pedido_id: order.id }));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setForm({ pedido_id: '', calificacion: 5, comentario: '' });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg('');
    setSubmitting(true);
    try {
      await createResena({
        usuario_id: user?.id || '',
        restaurante_id: selectedRestaurant,
        pedido_id: form.pedido_id,
        calificacion: Number(form.calificacion),
        comentario: form.comentario,
      });
      setMsg('Review created successfully! The order was marked as reviewed and the restaurant rating was recalculated.');
      setMsgType('success');
      resetForm();
      setShowForm(false);
      // Refresh restaurants (updated average rating) and orders (updated resenado flag)
      const [restRes] = await Promise.all([
        getRestaurantes().catch(() => null),
        loadOrders(selectedRestaurant),
      ]);
      if (restRes?.data) {
        const data = restRes.data;
        setRestaurants(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setMsg(err?.response?.data?.error || err?.message || 'Error creating review');
      setMsgType('error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Star rendering helper ──────────────────────────────
  const renderStars = (rating, size = 16) => {
    const rounded = Math.round(rating || 0);
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={size}
        className={
          i < rounded
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-gray-300'
        }
      />
    ));
  };

  // ── Order display helpers ──────────────────────────────
  const orderIdShort = (id) => {
    if (!id || typeof id !== 'string') return '—';
    return id.length > 8 ? `...${id.slice(-8)}` : id;
  };

  const orderItemsSummary = (items) => {
    if (!Array.isArray(items) || items.length === 0) return 'No items';
    const names = items.map((i) => i?.nombre || 'Item').slice(0, 3);
    const suffix = items.length > 3 ? ` +${items.length - 3} more` : '';
    return names.join(', ') + suffix;
  };

  // ── Restaurants to display in the grid ─────────────────
  const displayedRestaurants = Array.isArray(restaurants)
    ? selectedRestaurant
      ? restaurants.filter((r) => r.id === selectedRestaurant)
      : restaurants
    : [];

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <MessageSquare size={22} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Reviews</h2>
            <p className="text-sm text-gray-500">Manage restaurant reviews and ratings</p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) resetForm();
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          New Review
        </button>
      </div>

      {/* Info Card — MongoDB Transaction explanation */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="bg-amber-100 p-2 rounded-lg mt-0.5">
            <Star size={18} className="text-amber-600 fill-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">MongoDB Transaction</h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              Reviews use a <span className="font-semibold">MongoDB Transaction</span> &mdash; creating a review atomically:
              inserts the review document, marks the order as reviewed (<code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">resenado: true</code>),
              and recalculates the restaurant&apos;s average rating (<code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">calificacion_promedio</code>).
              If any step fails the entire operation is rolled back.
            </p>
          </div>
        </div>
      </div>

      {/* Status message */}
      {msg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            msgType === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {msgType === 'error' ? (
            <span className="font-medium">Error:</span>
          ) : (
            <Star size={14} className="text-green-600 fill-green-600 flex-shrink-0" />
          )}
          {msg}
        </div>
      )}

      {/* ── Create Review Form ──────────────────────────── */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5"
        >
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Plus size={18} className="text-indigo-600" />
            Create Review
          </h3>

          {/* Logged-in user info */}
          <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3 text-sm">
            <div className="bg-indigo-100 w-8 h-8 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-xs">
              {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p className="font-medium text-gray-800">{user?.nombre || 'Unknown User'}</p>
              <p className="text-gray-500 text-xs">{user?.correo || user?.id || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Restaurant dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedRestaurant}
                onChange={handleRestaurantChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              >
                <option value="">Select a restaurant...</option>
                {Array.isArray(restaurants) &&
                  restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
              </select>
            </div>

            {/* Order dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order <span className="text-red-400">*</span>
              </label>
              {loadingOrders ? (
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50">
                  Loading orders...
                </div>
              ) : (
                <select
                  name="pedido_id"
                  value={form.pedido_id}
                  onChange={handleChange}
                  required
                  disabled={!selectedRestaurant || reviewableOrders.length === 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">
                    {!selectedRestaurant
                      ? 'Select a restaurant first...'
                      : reviewableOrders.length === 0
                      ? 'No reviewable orders available'
                      : 'Select a delivered order...'}
                  </option>
                  {reviewableOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {orderIdShort(o.id)} — {orderItemsSummary(o.items)} — Q
                      {(o.total || 0).toFixed(2)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Star rating selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleStarClick(val)}
                  className="p-1 rounded-md hover:bg-yellow-50 transition-colors"
                  title={`${val} star${val > 1 ? 's' : ''}`}
                >
                  <Star
                    size={28}
                    className={
                      val <= form.calificacion
                        ? 'text-yellow-400 fill-yellow-400 transition-colors'
                        : 'text-gray-300 hover:text-yellow-300 transition-colors'
                    }
                  />
                </button>
              ))}
              <span className="text-sm text-gray-500 ml-3 font-medium">
                {form.calificacion}/5
              </span>
            </div>
          </div>

          {/* Comment */}
          <FormInput
            label="Comment"
            name="comentario"
            type="textarea"
            value={form.comentario}
            onChange={handleChange}
            required
            placeholder="Share your experience with this restaurant..."
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <Star size={14} />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── Restaurant filter (outside form) ────────────── */}
      <div className="max-w-sm">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Restaurant
        </label>
        <select
          value={selectedRestaurant}
          onChange={handleRestaurantChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        >
          <option value="">All Restaurants</option>
          {Array.isArray(restaurants) &&
            restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
        </select>
      </div>

      {/* ── Restaurant Ratings Grid ─────────────────────── */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Restaurant Ratings</h3>
        {displayedRestaurants.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
            No restaurants found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedRestaurants.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-gray-800 text-base">{r.nombre}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-0.5">
                    {renderStars(r.calificacion_promedio)}
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {(r.calificacion_promedio || 0).toFixed(1)}
                  </span>
                </div>
                {Array.isArray(r.categorias) && r.categorias.length > 0 && (
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {r.categorias.map((c) => (
                      <span
                        key={c}
                        className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Delivered Orders Section ────────────────────── */}
      {selectedRestaurant && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            Delivered Orders
            {selectedRestaurantObj && (
              <span className="text-sm font-normal text-gray-500">
                for {selectedRestaurantObj.nombre}
              </span>
            )}
          </h3>

          {loadingOrders ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
              Loading orders...
            </div>
          ) : deliveredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
              No delivered orders found for this restaurant.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
              {deliveredOrders.map((o) => {
                const isReviewed = o.resenado === true;
                const isSelected = form.pedido_id === o.id;
                return (
                  <div
                    key={o.id}
                    className={`flex items-center justify-between p-4 transition-colors ${
                      isSelected
                        ? 'bg-indigo-50'
                        : !isReviewed
                        ? 'hover:bg-gray-50 cursor-pointer'
                        : ''
                    }`}
                    onClick={() => {
                      if (!isReviewed) selectOrderForReview(o);
                    }}
                    role={!isReviewed ? 'button' : undefined}
                    tabIndex={!isReviewed ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (!isReviewed && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        selectOrderForReview(o);
                      }
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {orderIdShort(o.id)}
                        </span>
                        {isSelected && (
                          <span className="text-xs text-indigo-600 font-medium">Selected</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 truncate">
                        {orderItemsSummary(o.items)}
                      </p>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">
                        Q{(o.total || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      {!isReviewed && (
                        <span className="text-xs text-gray-400 hidden sm:inline">
                          Click to review
                        </span>
                      )}
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          isReviewed
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}
                      >
                        {isReviewed ? 'Reviewed' : 'Not Reviewed'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Reviews Display Section ────────────────────── */}
      {selectedRestaurant && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            📝 Recent Reviews
          </h3>

          {loadingResenas ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
              Loading reviews...
            </div>
          ) : resenas.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
              No reviews yet for this restaurant.
            </div>
          ) : (
            <div className="space-y-3">
              {resenas.slice(0, 10).map((review, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">
                        ⭐ {review.calificacion}/5
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {review.fecha_resena
                          ? new Date(review.fecha_resena).toLocaleDateString('es-ES')
                          : '—'}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={
                            i < (review.calificacion || 0)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-200'
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {review.comentario || '(Sin comentario)'}
                  </p>
                </div>
              ))}
              {resenas.length > 10 && (
                <p className="text-sm text-gray-500 text-center mt-4">
                  +{resenas.length - 10} more reviews
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
