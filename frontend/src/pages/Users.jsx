import { useEffect, useState } from 'react';
import { Search, UserPlus, MapPin, Edit3, User } from 'lucide-react';
import DataTable from '../components/DataTable';
import FormInput from '../components/FormInput';
import {
  register,
  getPerfil,
  updatePerfil,
  addDireccion,
  getTopUsuarios,
} from '../services/api';

const ITEMS_PER_PAGE = 8;

export default function UsersPage({ user }) {
  // ── Profile state ────────────────────────────────────
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ nombre: '', telefono: '' });
  const [profileMsg, setProfileMsg] = useState('');

  // ── Address state ────────────────────────────────────
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    calle: '',
    zona: '',
    ciudad: '',
    coordenadas: '',
  });
  const [addressMsg, setAddressMsg] = useState('');

  // ── Register state ───────────────────────────────────
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
    telefono: '',
  });
  const [registerMsg, setRegisterMsg] = useState('');

  // ── Top users state ──────────────────────────────────
  const [topUsers, setTopUsers] = useState([]);
  const [topLoading, setTopLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // ── Load profile on mount ────────────────────────────
  useEffect(() => {
    loadProfile();
    loadTopUsers();
  }, []);

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await getPerfil();
      const data = res.data || null;
      setProfile(data);
      if (data) {
        setProfileForm({
          nombre: data.nombre || '',
          telefono: data.telefono || '',
        });
      }
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadTopUsers = async () => {
    setTopLoading(true);
    try {
      const res = await getTopUsuarios();
      const raw = res.data;
      const data = Array.isArray(raw) ? raw : [];
      setTopUsers(
        data.map((u) => ({
          id: u._id,
          nombre: u.nombre || 'N/A',
          correo: u.correo || 'N/A',
          total_gastado: u.total_gastado || 0,
          cantidad_pedidos: u.cantidad_pedidos || 0,
        }))
      );
    } catch {
      setTopUsers([]);
    } finally {
      setTopLoading(false);
    }
  };

  // ── Profile handlers ─────────────────────────────────
  const handleProfileChange = (e) =>
    setProfileForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      await updatePerfil({
        nombre: profileForm.nombre,
        telefono: profileForm.telefono,
      });
      setProfileMsg('Profile updated successfully');
      setEditingProfile(false);
      loadProfile();
    } catch (err) {
      setProfileMsg(err.response?.data?.error || 'Error updating profile');
    }
  };

  // ── Address handlers ─────────────────────────────────
  const handleAddressChange = (e) =>
    setAddressForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setAddressMsg('');
    const userId = profile?.id || user?.id;
    if (!userId) {
      setAddressMsg('Error: user ID not available');
      return;
    }
    try {
      await addDireccion(userId, {
        calle: addressForm.calle,
        zona: parseInt(addressForm.zona, 10) || 0,
        ciudad: addressForm.ciudad,
        coordenadas: addressForm.coordenadas,
      });
      setAddressMsg('Address added successfully');
      setAddressForm({ calle: '', zona: '', ciudad: '', coordenadas: '' });
      setShowAddressForm(false);
      loadProfile();
    } catch (err) {
      setAddressMsg(err.response?.data?.error || 'Error adding address');
    }
  };

  // ── Register handlers ────────────────────────────────
  const handleRegisterChange = (e) =>
    setRegisterForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterMsg('');
    try {
      await register({
        nombre: registerForm.nombre,
        correo: registerForm.correo,
        contrasena: registerForm.contrasena,
        telefono: registerForm.telefono,
      });
      setRegisterMsg('User created successfully');
      setRegisterForm({ nombre: '', correo: '', contrasena: '', telefono: '' });
      setShowRegisterForm(false);
      loadTopUsers();
    } catch (err) {
      setRegisterMsg(err.response?.data?.error || 'Error creating user');
    }
  };

  // ── Top users filtering and pagination ───────────────
  const filtered = topUsers.filter(
    (u) =>
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.correo.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const pageData = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const topColumns = [
    { key: 'nombre', label: 'Name' },
    { key: 'correo', label: 'Email' },
    {
      key: 'total_gastado',
      label: 'Total Spent',
      render: (r) => `Q${(r.total_gastado || 0).toFixed(2)}`,
    },
    { key: 'cantidad_pedidos', label: 'Orders' },
  ];

  // ── Helpers ──────────────────────────────────────────
  const addresses = Array.isArray(profile?.direcciones)
    ? profile.direcciones
    : [];

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const MsgBanner = ({ msg }) => {
    if (!msg) return null;
    const isError =
      msg.toLowerCase().includes('error') ||
      msg.toLowerCase().includes('fail');
    return (
      <div
        className={`p-3 rounded-lg text-sm ${
          isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}
      >
        {msg}
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Users</h2>
      </div>

      {/* ─── SECTION 1: My Profile ──────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User size={20} className="text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-800">My Profile</h3>
          </div>
          {!editingProfile && !profileLoading && profile && (
            <button
              onClick={() => setEditingProfile(true)}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <Edit3 size={14} />
              Edit
            </button>
          )}
        </div>

        <MsgBanner msg={profileMsg} />

        {profileLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-7 w-7 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : !profile ? (
          <p className="text-gray-400 text-sm py-4">
            Could not load profile data.
          </p>
        ) : editingProfile ? (
          <form onSubmit={handleProfileSave} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Name"
                name="nombre"
                value={profileForm.nombre}
                onChange={handleProfileChange}
                required
                placeholder="Full name"
              />
              <FormInput
                label="Phone"
                name="telefono"
                value={profileForm.telefono}
                onChange={handleProfileChange}
                placeholder="+502 1234-5678"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Email and password cannot be changed from this form.</span>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingProfile(false);
                  setProfileMsg('');
                  setProfileForm({
                    nombre: profile.nombre || '',
                    telefono: profile.telefono || '',
                  });
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-2">
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Name
              </span>
              <p className="text-sm text-gray-800 mt-0.5">
                {profile.nombre || 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Email
              </span>
              <p className="text-sm text-gray-800 mt-0.5">
                {profile.correo || 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Phone
              </span>
              <p className="text-sm text-gray-800 mt-0.5">
                {profile.telefono || 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Registered
              </span>
              <p className="text-sm text-gray-800 mt-0.5">
                {formatDate(profile.fecha_registro)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── SECTION 2: My Addresses ────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              My Addresses
            </h3>
          </div>
          <button
            onClick={() => {
              setShowAddressForm(!showAddressForm);
              setAddressMsg('');
            }}
            className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <MapPin size={14} />
            Add Address
          </button>
        </div>

        <MsgBanner msg={addressMsg} />

        {showAddressForm && (
          <form
            onSubmit={handleAddressSubmit}
            className="mt-4 mb-6 border border-gray-100 rounded-lg p-4 bg-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <FormInput
              label="Street (Calle)"
              name="calle"
              value={addressForm.calle}
              onChange={handleAddressChange}
              required
              placeholder="12 Avenida 3-45"
            />
            <FormInput
              label="Zone (Zona)"
              name="zona"
              type="number"
              value={addressForm.zona}
              onChange={handleAddressChange}
              required
              placeholder="10"
              min="1"
            />
            <FormInput
              label="City (Ciudad)"
              name="ciudad"
              value={addressForm.ciudad}
              onChange={handleAddressChange}
              required
              placeholder="Guatemala"
            />
            <FormInput
              label="Coordinates (Coordenadas)"
              name="coordenadas"
              value={addressForm.coordenadas}
              onChange={handleAddressChange}
              placeholder="14.6349, -90.5069"
            />
            <div className="sm:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddressForm(false);
                  setAddressMsg('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Save Address
              </button>
            </div>
          </form>
        )}

        {profileLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : addresses.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">
            No addresses saved yet. Click "Add Address" to create one.
          </p>
        ) : (
          <div className="space-y-3 mt-2">
            {addresses.map((addr, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50"
              >
                <MapPin
                  size={16}
                  className="text-indigo-500 mt-0.5 shrink-0"
                />
                <div className="text-sm text-gray-700">
                  <p className="font-medium">{addr.calle || 'N/A'}</p>
                  <p className="text-gray-500">
                    Zone {addr.zona || 0}, {addr.ciudad || 'N/A'}
                    {addr.coordenadas ? ` -- ${addr.coordenadas}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── SECTION 3: Register New User ───────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserPlus size={20} className="text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Register New User
            </h3>
          </div>
          <button
            onClick={() => {
              setShowRegisterForm(!showRegisterForm);
              setRegisterMsg('');
            }}
            className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <UserPlus size={14} />
            {showRegisterForm ? 'Close' : 'New User'}
          </button>
        </div>

        <MsgBanner msg={registerMsg} />

        {showRegisterForm && (
          <form
            onSubmit={handleRegisterSubmit}
            className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <FormInput
              label="Name"
              name="nombre"
              value={registerForm.nombre}
              onChange={handleRegisterChange}
              required
              placeholder="Full name"
            />
            <FormInput
              label="Email"
              name="correo"
              type="email"
              value={registerForm.correo}
              onChange={handleRegisterChange}
              required
              placeholder="email@example.com"
            />
            <FormInput
              label="Password"
              name="contrasena"
              type="password"
              value={registerForm.contrasena}
              onChange={handleRegisterChange}
              required
              placeholder="Min 6 characters"
            />
            <FormInput
              label="Phone"
              name="telefono"
              value={registerForm.telefono}
              onChange={handleRegisterChange}
              placeholder="+502 1234-5678"
            />
            <div className="sm:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRegisterForm(false);
                  setRegisterMsg('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Create User
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ─── SECTION 4: Top Users ───────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Top Users</h3>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {topLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <DataTable
            columns={topColumns}
            data={pageData}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            emptyMessage="No top user data available yet."
          />
        )}
      </div>
    </div>
  );
}
