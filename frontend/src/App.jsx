import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Verify token on app load
  useEffect(() => {
    const verifyToken = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!storedToken || !storedUser) {
        setToken(null);
        setUser(null);
      } else {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setIsInitialized(true);
    };

    verifyToken();
  }, []);

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

  // Don't render until initialization is complete
  if (!isInitialized) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Show login if not authenticated
  if (!token || !user) {
    return (
      <Routes>
        <Route path="/" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
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
            <Route path="/" element={<ProtectedRoute isAuthenticated={!!token}><Dashboard /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute isAuthenticated={!!token}><Users user={user} /></ProtectedRoute>} />
            <Route path="/restaurants" element={<ProtectedRoute isAuthenticated={!!token}><Restaurants /></ProtectedRoute>} />
            <Route path="/menu" element={<ProtectedRoute isAuthenticated={!!token}><Menu /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute isAuthenticated={!!token}><Orders user={user} /></ProtectedRoute>} />
            <Route path="/reviews" element={<ProtectedRoute isAuthenticated={!!token}><Reviews user={user} /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute isAuthenticated={!!token}><Analytics /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute isAuthenticated={!!token}><Files /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
