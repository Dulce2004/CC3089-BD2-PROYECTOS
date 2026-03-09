import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Restaurants from './pages/Restaurants';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import Reviews from './pages/Reviews';
import Analytics from './pages/Analytics';
import Files from './pages/Files';
import Login from './pages/Login';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const handleLogin = (usuario, jwt) => {
    setUser(usuario);
    setToken(jwt);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          user={user}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users user={user} />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/orders" element={<Orders user={user} />} />
            <Route path="/reviews" element={<Reviews user={user} />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/files" element={<Files />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
