import { Menu, LogOut } from 'lucide-react';

export default function Navbar({ onToggleSidebar, user, onLogout }) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          Restaurant Dashboard
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 hidden sm:inline">
          MongoDB &middot; Go &middot; React
        </span>
        {user && (
          <div className="flex items-center gap-3 ml-2">
            <span className="text-sm font-medium text-gray-700">
              {user.nombre}
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
