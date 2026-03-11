import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const API = axios.create({
  baseURL: baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle authentication errors (expired token, invalid token, etc.)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getPerfil = () => API.get('/usuarios/perfil');
export const updatePerfil = (data) => API.put('/usuarios/perfil', data);
export const addDireccion = (id, data) => API.put(`/usuarios/${id}/direcciones`, data);
export const getUsuarios = () => API.get('/usuarios');
export const deleteUsuario = (id) => API.delete(`/usuarios/${id}`);
export const eliminarDireccion = (id, data) => API.delete(`/usuarios/${id}/direcciones`, { data });

// ── Restaurantes ──────────────────────────────────────
export const getRestaurantes = () => API.get('/restaurantes');
export const getRestaurante = (id) => API.get(`/restaurantes/${id}`);
export const createRestaurante = (data) => API.post('/restaurantes', data);
export const updateRestaurante = (id, data) => API.put(`/restaurantes/${id}`, data);
export const deleteRestaurante = (id) => API.delete(`/restaurantes/${id}`);
export const agregarCategoria = (id, data) => API.post(`/restaurantes/${id}/categorias`, data);
export const eliminarCategoria = (id, data) => API.delete(`/restaurantes/${id}/categorias`, { data });
export const buscarRestaurantes = (nombre) => API.get(`/restaurantes/buscar?nombre=${encodeURIComponent(nombre)}`);
export const searchRestaurantes = (params) => API.get('/restaurantes/search', { params });
export const getRestaurantesPorCategoria = (cat) => API.get(`/restaurantes/categoria?cat=${encodeURIComponent(cat)}`);
export const getCategorias = () => API.get('/restaurantes/categorias');
export const getRestaurantesCerca = (lat, lng, dist) => API.get('/restaurantes/cerca', { params: { lat, lng, dist } });

// ── Menu ──────────────────────────────────────────────
export const getMenu = (restauranteId) => API.get(`/restaurantes/${restauranteId}/menu`);
export const createArticulo = (restauranteId, data) => API.post(`/restaurantes/${restauranteId}/menu`, data);
export const updateArticulo = (id, data) => API.put(`/menu/${id}`, data);
export const deleteArticulo = (id) => API.delete(`/menu/${id}`);

// ── Ordenes ───────────────────────────────────────────
export const getOrdenes = () => API.get('/ordenes');
export const getOrden = (id) => API.get(`/ordenes/${id}`);
export const createOrden = (data) => API.post('/ordenes', data);
export const updateEstadoOrden = (id, estado) => API.put(`/ordenes/${id}/estado`, { estado });
export const deleteOrden = (id) => API.delete(`/ordenes/${id}`);
export const countOrdenes = (estado) => API.get('/ordenes/count', { params: estado ? { estado } : {} });
export const updateEstadoMasivo = (data) => API.put('/ordenes/estado-masivo', data);
export const deleteOrdenesMasivo = (estado) => API.delete(`/ordenes/masivo?estado=${encodeURIComponent(estado)}`);
export const getOrdenesByRestaurante = (id) => API.get(`/restaurantes/${id}/ordenes`);

// ── Resenas ───────────────────────────────────────────
export const createResena = (data) => API.post('/resenas', data);
export const getResenas = () => API.get('/resenas');
export const getResenasPorRestaurante = (id) => API.get(`/resenas/restaurante/${id}`);
export const updateResena = (id, data) => API.put(`/resenas/${id}`, data);
export const deleteResena = (id) => API.delete(`/resenas/${id}`);

// ── Analytics ─────────────────────────────────────────
export const getTopPlatillos = () => API.get('/analytics/top-platillos');
export const getTopUsuarios = () => API.get('/analytics/top-usuarios');

// ── Archivos (GridFS) ─────────────────────────────────
export const uploadArchivo = (formData) =>
  API.post('/archivos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getArchivoUrl = (id) => `http://localhost:8080/archivos/${id}`;

// ── Bulk ──────────────────────────────────────────────
export const bulkInsertOrdenes = (cantidad) => API.post(`/bulk/ordenes?cantidad=${cantidad}`);
export const bulkInsertTodo = (cantidad) => API.post(`/bulk/todo?cantidad=${cantidad}`);

export default API;
