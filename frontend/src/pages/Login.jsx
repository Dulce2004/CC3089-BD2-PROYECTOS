import { useState } from 'react';
import FormInput from '../components/FormInput';
import { login, register } from '../services/api';

export default function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
    telefono: '',
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      if (isRegister) {
        await register({
          nombre: form.nombre,
          correo: form.correo,
          contrasena: form.contrasena,
          telefono: form.telefono,
        });
        setMsg('Account created. Please log in.');
        setIsRegister(false);
      } else {
        const res = await login({
          correo: form.correo,
          contrasena: form.contrasena,
        });
        const { token, usuario } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(usuario));
        onLogin(usuario, token);
      }
    } catch (err) {
      setMsg(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Restaurant Dashboard</h1>
          <p className="text-sm text-gray-500 mt-2">MongoDB + Go + React</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {isRegister ? 'Create Account' : 'Log In'}
          </h2>

          {msg && (
            <div
              className={`p-3 rounded-lg text-sm mb-4 ${
                msg.includes('failed') || msg.includes('Error')
                  ? 'bg-red-50 text-red-700'
                  : 'bg-green-50 text-green-700'
              }`}
            >
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <FormInput
                  label="Name"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Full name"
                />
                <FormInput
                  label="Phone"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="+502 1234-5678"
                />
              </>
            )}
            <FormInput
              label="Email"
              name="correo"
              type="email"
              value={form.correo}
              onChange={handleChange}
              required
              placeholder="email@example.com"
            />
            <FormInput
              label="Password"
              name="contrasena"
              type="password"
              value={form.contrasena}
              onChange={handleChange}
              required
              placeholder="Password"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading
                ? 'Please wait...'
                : isRegister
                ? 'Create Account'
                : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setMsg('');
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              {isRegister
                ? 'Already have an account? Log in'
                : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
